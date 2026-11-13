import type { Db } from './db.ts';
import { zonedParts } from './sessionPlan.ts';

/**
 * The pilot's funnel (fita 5.8): one row per patient, pseudonymised (patient
 * code, dates without times), with each step of the journey. Where each
 * patient stops is what the team needs to improve it; the target figures are
 * set with them before the pilot.
 */

const DAY = 24 * 60 * 60 * 1000;

export interface FunnelRow {
  patient_code: string;
  registered: string;
  account_activated: 'yes' | 'no';
  days_to_activate: number | '';
  welcome_completed: 'yes' | 'no';
  planned_at_welcome: 'yes' | 'no';
  saw_p04_or_p17_before_first_session: 'yes' | 'no';
  qpvii_initial: string;
  first_session: string;
  first_session_within_7_days: 'yes' | 'no' | '';
  sessions: number;
  sessions_within_2_days_of_previous_pct: number | '';
  hierarchy_completed: 'yes' | 'no';
  qpvii_final: string;
  flight_reported: 'yes' | 'no';
  flew: 'yes' | 'no' | '';
  reminders_on: 'yes' | 'no';
}

const date = (at: number | null | undefined) => (at ? zonedParts(at).date : '');
const yes = (v: unknown): 'yes' | 'no' => (v ? 'yes' : 'no');

export function funnelRows(db: Db, patientIds: string[]): FunnelRow[] {
  return patientIds.map((id) => {
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> & { created_at: number };
    // Invited patients activate by choosing their password; self-registered ones did at registration.
    const invited = db.prepare("SELECT MIN(created_at) AS at FROM password_tokens WHERE user_id = ? AND purpose = 'invite'").get(id) as { at: number | null };
    const accepted = db.prepare("SELECT MIN(at) AS at FROM audit_log WHERE actor_id = ? AND action = 'invitation.accepted'").get(id) as { at: number | null };
    const activatedAt = invited.at === null ? u.created_at : accepted.at;

    const qpvii = db.prepare('SELECT timestamp, evaluation_type FROM qpvii_results WHERE user_id = ? ORDER BY timestamp').all(id) as { timestamp: number; evaluation_type: string | null }[];
    const sessions = (db.prepare('SELECT started_at FROM exposure_sessions WHERE user_id = ? AND is_review = 0 ORDER BY started_at').all(id) as { started_at: number }[]).map((s) => s.started_at);
    const firstSession = sessions[0];
    const gaps = sessions.slice(1).map((at, i) => at - sessions[i]);
    const plan = db.prepare('SELECT created_at FROM session_plans WHERE user_id = ?').get(id) as { created_at: number } | undefined;
    const welcome = u.welcome_completed_at as number | null;
    const explained = db
      .prepare("SELECT MIN(first_at) AS at FROM help_video_views WHERE user_id = ? AND video_id IN ('P04', 'P17')")
      .get(id) as { at: number | null };
    const flight = db.prepare('SELECT flew FROM flight_reports WHERE user_id = ?').get(id) as { flew: number } | undefined;
    const completed = db.prepare('SELECT 1 FROM exposure_progress WHERE user_id = ? AND program_completed = 1').get(id);
    const prefs = u.notification_prefs ? (JSON.parse(u.notification_prefs as string) as { enabled?: boolean }) : null;
    const start = activatedAt ?? u.created_at;

    return {
      patient_code: (u.patient_code as string) ?? '',
      registered: date(u.created_at),
      account_activated: yes(activatedAt),
      days_to_activate: activatedAt ? Math.floor((activatedAt - u.created_at) / DAY) : '',
      welcome_completed: yes(welcome),
      // Planned by the end of the welcome, give or take the same visit.
      planned_at_welcome: yes(plan && welcome && plan.created_at <= welcome + 60 * 60 * 1000),
      saw_p04_or_p17_before_first_session: yes(explained.at !== null && (firstSession === undefined || explained.at < firstSession)),
      qpvii_initial: date(qpvii[0]?.timestamp),
      first_session: date(firstSession),
      first_session_within_7_days: firstSession === undefined ? '' : yes(firstSession - start <= 7 * DAY),
      sessions: sessions.length,
      sessions_within_2_days_of_previous_pct: gaps.length === 0 ? '' : Math.round((100 * gaps.filter((g) => g <= 2 * DAY).length) / gaps.length),
      hierarchy_completed: yes(completed),
      qpvii_final: date(qpvii.length > 1 ? qpvii[qpvii.length - 1].timestamp : null),
      flight_reported: yes(flight),
      flew: flight ? yes(flight.flew) : '',
      reminders_on: yes(prefs?.enabled && u.notification_consent_version),
    };
  });
}
