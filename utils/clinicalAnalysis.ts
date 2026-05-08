

import {
  UserExposureProgress,
  Recommendation,
  ExposureSceneKey,
  PatientStatus,
  QPVIIUserResult,
} from '../types';
import {
  getAllUserExposureProgress,
} from './localStorageDB';
import { EXPOSURE_VIDEOS } from '../constants';
import { calculateQPVIIScores } from './qpviiScoring';
import { determineVideoSequence, isExposureFullyCompleted } from './exposureUtils';

const STALLED_HABITUATION_THRESHOLD = 4; // More repetitions needed to suspect genuine stalls
const HIGH_VOLUME_RATIO_THRESHOLD = 5; // Views per unique video indicating high dosage

const sceneTranslationKeys: Record<ExposureSceneKey, string> = {
  psychoed: 'evolution.scene_psychoed',
  preparation: 'evolution.scene_preparation',
  boarding: 'evolution.scene_boarding',
  takeoff: 'evolution.scene_takeoff',
  inflight: 'evolution.scene_inflight',
  landing: 'evolution.scene_landing',
  accidents: 'evolution.scene_accidents',
};

/**
 * Calculates current patient status based on their progress and history.
 */
export function getPatientStatus(
  patientId: string,
  allQpvii: QPVIIUserResult[],
  allProgress: UserExposureProgress[]
): { status: PatientStatus; progressPercent: number } {
  const patientQpvii = allQpvii.filter(q => q.userId === patientId).sort((a, b) => b.timestamp - a.timestamp);
  const patientProgress = allProgress.filter(p => p.userId === patientId).sort((a, b) => b.lastUpdated - a.lastUpdated);

  // 1. New
  if (patientQpvii.length === 0) {
    return { status: { textKey: 'new', color: 'gray', progressPercent: 0 }, progressPercent: 0 };
  }

  const latestQpvii = patientQpvii[0];
  const latestProgress = patientProgress.find(p => p.qpviiTimestamp === latestQpvii.timestamp);

  // 2. Ready (Evaluation done, no exposure for THIS evaluation)
  if (!latestProgress) {
    return { status: { textKey: 'ready', color: 'blue', progressPercent: 0 }, progressPercent: 0 };
  }

  // 3. Completed
  if (latestProgress.programCompleted) {
    return { status: { textKey: 'completed', color: 'green', progressPercent: 100 }, progressPercent: 100 };
  }

  const sequence = determineVideoSequence(latestQpvii.answers);
  const progressPercent = sequence.length > 0 ? (latestProgress.completedVideoIds.length / sequence.length) * 100 : 0;

  // 4. Dropping Out (Risk detection)
  // Inactivity > 10 days OR multiple abandonments in recent sessions
  const inactivityDays = (Date.now() - latestProgress.lastUpdated) / (1000 * 60 * 60 * 24);
  const recentSessions = patientProgress.slice(0, 3);
  const hasMultipleAbandonments = recentSessions.filter(s => {
    const ratings = s.discomfortRatings || [];
    return ratings.length >= 3 && ratings[ratings.length - 1].rating > 6;
  }).length >= 2;

  if (inactivityDays > 10 || hasMultipleAbandonments) {
    return { status: { textKey: 'dropping_out', color: 'red', progressPercent }, progressPercent: progressPercent };
  }

  // 5. Stalled (3+ sessions with flat slope)
  const isStalled = recentSessions.length >= 3 && recentSessions.every(s => {
    const ratings = s.discomfortRatings || [];
    if (ratings.length < 3) return false;
    const points = ratings.map((r, i) => ({ x: i + 1, y: r.rating }));
    const slope = calculateLinearRegressionSlope(points);
    return slope !== null && slope >= -0.05;
  });

  if (isStalled) {
    return { status: { textKey: 'stalled', color: 'amber', progressPercent }, progressPercent: progressPercent };
  }

  // 6. Needs Review
  if (isExposureFullyCompleted(latestProgress, sequence)) {
    return { status: { textKey: 'needs_review', color: 'amber', progressPercent: 100 }, progressPercent: 100 };
  }

  // 7. In Progress
  return { status: { textKey: 'in_progress', color: 'sky', progressPercent }, progressPercent: progressPercent };
}

/**
 * Calculates the slope of a simple linear regression line (y = a + bx).
 * This is used to determine the TCIa (Individual Rate of Change).
 * @param points An array of {x, y} data points.
 * @returns The slope (b) of the regression line, or null if it cannot be calculated.
 */
export function calculateLinearRegressionSlope(points: { x: number; y: number }[]): number | null {
  const n = points.length;
  if (n < 2) {
    return null; // Cannot calculate slope with fewer than 2 points
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) {
    return null; // Avoid division by zero (happens with a vertical line of points)
  }

  return numerator / denominator;
}


export const generateClinicalRecommendations = (patientId: string, t: (key: string, params?: any) => string): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const allUserProgress = getAllUserExposureProgress().filter(p => p.userId === patientId);

  if (allUserProgress.length === 0) {
    return [{
      id: 'no_data',
      type: 'info',
      messageKey: 'patientDetail.recommendations.noExposureDataForRecommendations',
    }];
  }

  // Use lastUpdated to get the truly most recent progress entry
  const latestSession = [...allUserProgress].sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))[0];
  const { discomfortRatings } = latestSession;

  if (!discomfortRatings || discomfortRatings.length < 2) {
      return [{
          id: 'no_significant_alerts',
          type: 'info',
          messageKey: 'patientDetail.recommendations.noSignificantAlerts',
      }];
  }

  const ratingsByScene: Record<string, number[]> = {};
  
  discomfortRatings.forEach(rating => {
    const video = EXPOSURE_VIDEOS.find(v => v.id === rating.id);
    if (video) {
      const scene = video.relatedArea;
      if (!ratingsByScene[scene]) {
        ratingsByScene[scene] = [];
      }
      ratingsByScene[scene].push(rating.rating);
    }
  });

  // 1. Check for persistent reactivity (lack of habituation)
  for (const scene of Object.keys(ratingsByScene)) {
    const ratings = ratingsByScene[scene];
    if (ratings.length >= STALLED_HABITUATION_THRESHOLD) {
      const points = ratings.map((r, i) => ({ x: i + 1, y: r }));
      const slope = calculateLinearRegressionSlope(points);
      
      // If slope is flat or positive after several attempts, it might indicate safety behaviors or high sensitivity
      if (slope !== null && slope >= -0.05) { 
        recommendations.push({
          id: `stalled_${scene}`,
          type: 'warning',
          messageKey: 'patientDetail.recommendations.stalledHabituation',
          messageParams: { sceneName: t(sceneTranslationKeys[scene as ExposureSceneKey]) },
        });
      }
    }
  }

  // 2. Check for Practice Volume (High dosage is good for inhibitory learning)
  const uniqueVideosAttempted = new Set(discomfortRatings.map(r => r.id)).size;
  if (uniqueVideosAttempted > 0 && (discomfortRatings.length / uniqueVideosAttempted) >= HIGH_VOLUME_RATIO_THRESHOLD) {
     recommendations.push({
          id: 'high_volume',
          type: 'success', 
          messageKey: 'patientDetail.recommendations.highExposureVolume',
     });
  }

  // 3. Check for Effective Habituation
  if (recommendations.filter(r => r.type === 'warning').length === 0) {
      const allPoints = discomfortRatings.map((r, i) => ({ x: i + 1, y: r.rating }));
      const overallSlope = calculateLinearRegressionSlope(allPoints);
      
      if (overallSlope !== null && overallSlope < -0.1) {
          recommendations.push({
              id: 'effective_habituation',
              type: 'success',
              messageKey: 'patientDetail.recommendations.effectiveHabituation',
          });
      }
  }

  // 4. Check for Dropout Risk / Early Abandonment
  // Defined as having high anxiety at the end of multiple sequences
  const abandonmentCheck = Object.keys(ratingsByScene).some(scene => {
    const ratings = ratingsByScene[scene];
    // If the last rating in a sequence of at least 3 is still high (> 6)
    return ratings.length >= 3 && ratings[ratings.length - 1] > 6;
  });

  if (abandonmentCheck) {
    recommendations.push({
        id: 'dropout_risk',
        type: 'warning',
        messageKey: 'patientDetail.recommendations.dropoutRisk',
    });
  }

  // 5. Check for Irregular Practice
  if (allUserProgress.length > 2) {
      const sortedHistory = [...allUserProgress].sort((a, b) => (a.lastUpdated || 0) - (b.lastUpdated || 0));
      const gaps = [];
      for (let i = 1; i < sortedHistory.length; i++) {
          const diffInDays = ((sortedHistory[i].lastUpdated || 0) - (sortedHistory[i-1].lastUpdated || 0)) / (1000 * 60 * 60 * 24);
          gaps.push(diffInDays);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const maxGap = Math.max(...gaps);

      if (avgGap > 4 || maxGap > 7) {
          recommendations.push({
              id: 'irregular_practice',
              type: 'info',
              messageKey: 'patientDetail.recommendations.irregularPractice',
          });
      }
  }

  // 6. Default message
  if (recommendations.length === 0) {
      recommendations.push({
          id: 'no_significant_alerts',
          type: 'info',
          messageKey: 'patientDetail.recommendations.noSignificantAlerts',
      });
  }

  return recommendations;
};
