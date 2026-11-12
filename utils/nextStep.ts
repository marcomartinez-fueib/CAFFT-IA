import { ExposureSceneKey, User } from '../types';
import { getAllUserExposureProgress, getQPVIIResultsForUser, getQpviiDraft } from '../services/dataStore';
import { EXPOSURE_VIDEOS, CANONICAL_FLIGHT_STAGES_ORDER } from '../constants';
import { determineVideoSequence, isExposureFullyCompleted } from './exposureUtils';
import { needsTreatmentConsent } from '../consent';

/**
 * The patient's next step in the programme: where «El seu pas següent» on the
 * start screen leads, and where they land after logging in. `key` names the
 * texts (start.steps.<key>) and the funnel moment.
 */
export interface NextStep {
  key: 'welcome' | 'qpvii' | 'qpviiResume' | 'hierarchy' | 'explanation' | 'session' | 'review' | 'lastSession' | 'flightReport' | 'done';
  path: string;
  state?: Record<string, unknown>;
}

/** A patient who has done nothing yet goes through the three-step welcome first. */
export function needsWelcome(user: User | null): boolean {
  if (!user || user.role !== 'patient' || user.welcomeCompletedAt) return false;
  return getQPVIIResultsForUser(user.id).length === 0 && getAllUserExposureProgress().every((p) => p.userId !== user.id);
}

export function nextStepFor(user: User, hasFlightReport: boolean): NextStep {
  if (needsTreatmentConsent(user) || needsWelcome(user)) return { key: 'welcome', path: '/welcome' };

  const progress = getAllUserExposureProgress()
    .filter((p) => p.userId === user.id)
    .sort((a, b) => (b.qpviiTimestamp || b.lastUpdated) - (a.qpviiTimestamp || a.lastUpdated));
  const results = getQPVIIResultsForUser(user.id); // newest first

  // A review under way comes first.
  const review = progress.find((p) => p.isReview && !p.programCompleted);
  if (review) {
    const scenes = new Set<ExposureSceneKey>();
    for (const id of review.videoSequence || []) {
      const video = EXPOSURE_VIDEOS.find((v) => v.id === id);
      if (video) scenes.add(video.relatedArea);
    }
    const reviewScenes = [...scenes].sort((a, b) => CANONICAL_FLIGHT_STAGES_ORDER.indexOf(a) - CANONICAL_FLIGHT_STAGES_ORDER.indexOf(b));
    return { key: 'review', path: '/exposure', state: { reviewScenes, reviewSessionTimestamp: review.qpviiTimestamp, originalQpviiTimestamp: review.originalQpviiTimestamp } };
  }

  // The programme under way.
  const current = progress.find((p) => !p.isReview && !p.programCompleted);
  const result = current && results.find((r) => r.timestamp === current.qpviiTimestamp);
  if (current && result) {
    const state = { qpviiTimestamp: current.qpviiTimestamp, scores: result.scores, answers: result.answers };
    if (isExposureFullyCompleted(current, determineVideoSequence(result.answers))) return { key: 'lastSession', path: '/last-session', state: { qpviiTimestamp: current.qpviiTimestamp } };
    if (!current.explanationShown) return { key: 'explanation', path: '/exposure-explanation', state };
    return { key: 'session', path: '/exposure', state };
  }

  // A questionnaire answered whose programme has not started.
  const latest = results[0];
  if (latest && !progress.some((p) => p.qpviiTimestamp === latest.timestamp)) {
    return { key: 'hierarchy', path: '/exposure-hierarchy', state: { qpviiTimestamp: latest.timestamp, scores: latest.scores, answers: latest.answers } };
  }

  // The programme is over: tell us about the flight, then nothing pending.
  if (progress[0]?.programCompleted) {
    return hasFlightReport ? { key: 'done', path: '/celebration' } : { key: 'flightReport', path: '/flight-report' };
  }

  return getQpviiDraft() ? { key: 'qpviiResume', path: '/qpvii-evaluation' } : { key: 'qpvii', path: '/qpvii-evaluation' };
}
