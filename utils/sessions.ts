import type { ExposureSession, UserExposureProgress, VideoDiscomfortRating } from '../types.ts';

/** The ratings given during a session, oldest first. */
export function ratingsInSession(session: ExposureSession, progress: UserExposureProgress | null | undefined): VideoDiscomfortRating[] {
  if (!progress) return [];
  return progress.discomfortRatings
    .filter((r) => r.videoTimestamp >= session.startedAt && r.videoTimestamp <= session.lastActivityAt)
    .sort((a, b) => a.videoTimestamp - b.videoTimestamp);
}

export interface SessionSummary {
  ratings: VideoDiscomfortRating[];
  videosPassed: number; // ratings of 2 or less, the rule to advance
  first: number;
  last: number;
  max: number;
  minutes: number;
}

export function summarizeSession(session: ExposureSession, progress: UserExposureProgress | null | undefined): SessionSummary {
  const ratings = ratingsInSession(session, progress);
  const values = ratings.map((r) => r.rating);
  return {
    ratings,
    videosPassed: values.filter((v) => v <= 2).length,
    first: values[0] ?? 0,
    last: values[values.length - 1] ?? 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    minutes: Math.max(1, Math.round((session.lastActivityAt - session.startedAt) / 60_000)),
  };
}
