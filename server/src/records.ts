import type { Db } from './db.ts';
import type { AiConsultation, QPVIIUserResult, SimulatedEmail, UserExposureProgress } from '../../types.ts';

// Row <-> client-shape mapping for the clinical and log tables. The shapes are
// the client's own types, so the frontend consumes these unchanged.

interface QpviiRow {
  user_id: string;
  timestamp: number;
  form_name: string;
  form_date: string;
  evaluation_type: 'pre' | 'post' | null;
  original_timestamp: number | null;
  scores: string;
  answers: string;
}

function toQpvii(r: QpviiRow): QPVIIUserResult {
  const result: QPVIIUserResult = {
    userId: r.user_id,
    formName: r.form_name,
    date: r.form_date,
    timestamp: r.timestamp,
    scores: JSON.parse(r.scores),
    answers: JSON.parse(r.answers),
    evaluationType: r.evaluation_type ?? 'pre',
  };
  if (r.original_timestamp !== null) result.originalQpviiTimestamp = r.original_timestamp;
  return result;
}

interface ProgressRow {
  user_id: string;
  qpvii_timestamp: number | null;
  original_qpvii_timestamp: number | null;
  is_review: number;
  video_sequence: string;
  current_video_index: number;
  completed_video_ids: string;
  discomfort_ratings: string;
  explanation_shown: number;
  program_completed: number;
  review_completed: number;
  last_updated: number;
}

function toProgress(r: ProgressRow): UserExposureProgress {
  const progress: UserExposureProgress = {
    userId: r.user_id,
    qpviiTimestamp: r.qpvii_timestamp,
    videoSequence: JSON.parse(r.video_sequence),
    currentVideoIndex: r.current_video_index,
    completedVideoIds: JSON.parse(r.completed_video_ids),
    discomfortRatings: JSON.parse(r.discomfort_ratings),
    explanationShown: r.explanation_shown === 1,
    programCompleted: r.program_completed === 1,
    isReview: r.is_review === 1,
    reviewCompleted: r.review_completed === 1,
    lastUpdated: r.last_updated,
  };
  if (r.original_qpvii_timestamp !== null) progress.originalQpviiTimestamp = r.original_qpvii_timestamp;
  return progress;
}

interface ConsultationRow {
  id: string;
  user_id: string;
  username: string;
  user_role: 'patient' | 'therapist';
  query: string;
  response: string;
  timestamp: number;
}

function toConsultation(r: ConsultationRow): AiConsultation {
  return { id: r.id, userId: r.user_id, userName: r.username, userRole: r.user_role, query: r.query, response: r.response, timestamp: r.timestamp };
}

interface EmailRow {
  id: string;
  patient_id: string;
  type: SimulatedEmail['type'];
  subject: string;
  body: string;
  status: SimulatedEmail['status'];
  timestamp: number;
}

function toEmail(r: EmailRow): SimulatedEmail {
  return { id: r.id, patientId: r.patient_id, type: r.type, subject: r.subject, body: r.body, status: r.status, timestamp: r.timestamp };
}

// --- Bulk reads, always restricted to a set of user ids the caller may see ---

function placeholders(ids: string[]): string {
  return ids.map(() => '?').join(', ');
}

export function qpviiFor(db: Db, userIds: string[]): QPVIIUserResult[] {
  if (userIds.length === 0) return [];
  const rows = db
    .prepare(`SELECT * FROM qpvii_results WHERE user_id IN (${placeholders(userIds)}) ORDER BY timestamp DESC`)
    .all(...userIds) as unknown as QpviiRow[];
  return rows.map(toQpvii);
}

export function progressFor(db: Db, userIds: string[]): UserExposureProgress[] {
  if (userIds.length === 0) return [];
  const rows = db
    .prepare(`SELECT * FROM exposure_progress WHERE user_id IN (${placeholders(userIds)}) ORDER BY last_updated DESC`)
    .all(...userIds) as unknown as ProgressRow[];
  return rows.map(toProgress);
}

export function consultationsFor(db: Db, userIds: string[]): AiConsultation[] {
  if (userIds.length === 0) return [];
  const rows = db
    .prepare(
      `SELECT c.*, u.username FROM ai_consultations c JOIN users u ON u.id = c.user_id
       WHERE c.user_id IN (${placeholders(userIds)}) ORDER BY c.timestamp DESC`,
    )
    .all(...userIds) as unknown as ConsultationRow[];
  return rows.map(toConsultation);
}

export function emailsFor(db: Db, userIds: string[]): SimulatedEmail[] {
  if (userIds.length === 0) return [];
  const rows = db
    .prepare(`SELECT * FROM emails WHERE patient_id IN (${placeholders(userIds)}) ORDER BY timestamp DESC`)
    .all(...userIds) as unknown as EmailRow[];
  return rows.map(toEmail);
}

/**
 * Most recent sign of life: exposure activity, login, or assessment. Mirrors
 * getDaysSinceLastActivity on the client.
 */
export function lastActivityAt(db: Db, userId: string): number | null {
  const row = db
    .prepare(
      `SELECT MAX(COALESCE(u.last_login_at, 0), COALESCE(u.last_assessment_at, 0),
                  COALESCE((SELECT MAX(last_updated) FROM exposure_progress WHERE user_id = u.id), 0)) AS at
       FROM users u WHERE u.id = ?`,
    )
    .get(userId) as { at: number } | undefined;
  return row && row.at > 0 ? row.at : null;
}
