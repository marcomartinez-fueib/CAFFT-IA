import type { QPVIIAnswers, QPVIIScores } from '../types.ts';
import { getAllUserExposureProgress, getQPVIIResultsForUser } from '../services/dataStore.ts';

export interface CurrentPlan {
  qpviiTimestamp: number;
  scores: QPVIIScores;
  answers: QPVIIAnswers;
}

/**
 * The QPV-II the patient's hierarchy comes from: that of their unfinished
 * treatment record, or else their newest pre-treatment result. Pages reached
 * by a direct link or a reload have no navigation state and use this instead;
 * null means the patient has not answered the QPV-II yet.
 */
export function currentPlanFor(userId: string): CurrentPlan | null {
  const results = getQPVIIResultsForUser(userId); // newest first
  const active = getAllUserExposureProgress().find((p) => p.userId === userId && !p.isReview && !p.programCompleted);
  const result =
    (active && results.find((r) => r.timestamp === active.qpviiTimestamp)) ||
    results.find((r) => r.evaluationType !== 'post');
  return result ? { qpviiTimestamp: result.timestamp, scores: result.scores, answers: result.answers } : null;
}
