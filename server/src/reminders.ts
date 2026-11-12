import { randomBytes } from 'node:crypto';
import type { Db } from './db.ts';
import { transaction } from './db.ts';
import { enqueueMail } from './mail/outbox.ts';
import { asLang, inactivityReminderMail, sessionReminderMail, unsubscribeLink, type ReminderMessage } from './mail/templates.ts';
import { normalizeSlots, reminderTime, zonedParts, zonedTime, type PlanSlot } from './sessionPlan.ts';
import { CONSENT_VERSIONS } from './consentVersions.ts';

/**
 * The reminders the server sends by itself, every few minutes (src/index.ts):
 *
 *  - On the day of a planned session, two hours before it (8:00 at the
 *    earliest), unless the patient has already had a session that day.
 *  - After more than two days without a session, a kind reminder to carry on;
 *    at most one every two days, between 10:00 and 20:00.
 *
 * Only to patients who accepted the current treatment consent and the
 * notification consent, have reminders on in their preferences, and have not
 * finished the programme. By email, and by push to their browsers if they
 * subscribed. No clinical information in either.
 */

const DAY = 24 * 60 * 60 * 1000;
export const INACTIVITY_DAYS = 2;

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Sends one notification; 'gone' when the browser unsubscribed and the subscription should be dropped. */
export interface PushSender {
  send(subscription: PushSubscriptionRow, message: { title: string; body: string; url: string }): Promise<'ok' | 'gone' | 'error'>;
}

interface Candidate {
  id: string;
  username: string;
  email: string;
  notification_prefs: string | null;
  unsubscribe_token: string | null;
  slots: string | null;
  language: string | null;
}

/** Reminders are on for this patient: they said yes in the dialog and did not switch them off. */
function wantsReminders(prefsJson: string | null): boolean {
  if (!prefsJson) return false;
  const prefs = JSON.parse(prefsJson) as { enabled?: boolean; reminders?: boolean };
  return prefs.enabled === true && prefs.reminders !== false;
}

/** The patient's secret for the «turn reminders off» link, created on first use. */
export function unsubscribeTokenFor(db: Db, userId: string, existing: string | null): string {
  if (existing) return existing;
  const token = randomBytes(24).toString('base64url');
  db.prepare('UPDATE users SET unsubscribe_token = ? WHERE id = ?').run(token, userId);
  return token;
}

function candidates(db: Db): Candidate[] {
  return db
    .prepare(
      `SELECT u.id, u.username, u.email, u.notification_prefs, u.unsubscribe_token, p.slots,
              (SELECT language FROM consents c WHERE c.user_id = u.id AND c.kind = 'treatment' ORDER BY accepted_at DESC LIMIT 1) AS language
       FROM users u LEFT JOIN session_plans p ON p.user_id = u.id
       WHERE u.role = 'patient'
         AND u.treatment_consent_version = ?
         AND u.notification_consent_version = ?
         AND NOT EXISTS (SELECT 1 FROM exposure_progress e WHERE e.user_id = u.id AND e.program_completed = 1)`,
    )
    .all(CONSENT_VERSIONS.treatment, CONSENT_VERSIONS.notifications) as unknown as Candidate[];
}

function alreadySent(db: Db, userId: string, kind: 'session' | 'inactivity', key: string): boolean {
  return !!db.prepare('SELECT 1 FROM reminders_sent WHERE user_id = ? AND kind = ? AND key = ?').get(userId, kind, key);
}

function lastSessionAt(db: Db, userId: string): number | null {
  const row = db.prepare('SELECT MAX(last_activity_at) AS at FROM exposure_sessions WHERE user_id = ? AND is_review = 0').get(userId) as { at: number | null };
  return row.at;
}

export async function runReminders(
  db: Db,
  opts: { now?: number; appUrl: string; push?: PushSender | null },
): Promise<{ session: number; inactivity: number }> {
  const now = opts.now ?? Date.now();
  const today = zonedParts(now);
  const sent = { session: 0, inactivity: 0 };
  const outgoing: { userId: string; message: ReminderMessage }[] = [];

  for (const p of candidates(db)) {
    if (!wantsReminders(p.notification_prefs)) continue;
    const lang = asLang(p.language ?? undefined);
    const last = lastSessionAt(db, p.id);
    const hadSessionToday = last !== null && zonedParts(last).date === today.date;
    const link = () => unsubscribeLink(opts.appUrl, unsubscribeTokenFor(db, p.id, p.unsubscribe_token));

    // The planned session of today.
    const slot = p.slots ? normalizeSlots(JSON.parse(p.slots) as PlanSlot[])?.find((s) => s.day === today.day) : undefined;
    if (slot && !hadSessionToday && !alreadySent(db, p.id, 'session', today.date)) {
      const at = zonedTime(today.date, slot.time);
      if (now >= reminderTime(today.date, slot.time) && now < at) {
        const message = sessionReminderMail(lang, p.username, slot.time, opts.appUrl, link());
        record(db, p, 'session', today.date, now, message);
        outgoing.push({ userId: p.id, message });
        sent.session++;
        continue;
      }
    }

    // A planned day speaks of the session only, not of the days without one.
    if (slot) continue;

    // Some days without a session, once they have started the treatment.
    if (last === null || now - last < INACTIVITY_DAYS * DAY) continue;
    if (today.minutes < 10 * 60 || today.minutes >= 20 * 60) continue;
    const lastNudge = db.prepare("SELECT MAX(sent_at) AS at FROM reminders_sent WHERE user_id = ? AND kind = 'inactivity'").get(p.id) as { at: number | null };
    if (lastNudge.at !== null && now - lastNudge.at < INACTIVITY_DAYS * DAY) continue;
    const message = inactivityReminderMail(lang, p.username, opts.appUrl, link());
    record(db, p, 'inactivity', today.date, now, message);
    outgoing.push({ userId: p.id, message });
    sent.inactivity++;
  }

  if (opts.push) {
    for (const { userId, message } of outgoing) await pushTo(db, opts.push, userId, { ...message.push, url: opts.appUrl });
  }
  return sent;
}

/** The reminder is recorded and its email queued together, so it can never go twice. */
function record(db: Db, p: Candidate, kind: 'session' | 'inactivity', key: string, now: number, message: ReminderMessage): void {
  transaction(db, () => {
    db.prepare('INSERT INTO reminders_sent (user_id, kind, key, sent_at) VALUES (?, ?, ?, ?)').run(p.id, kind, key, now);
    db.prepare("INSERT INTO emails (id, patient_id, type, subject, body, status, timestamp) VALUES (?, ?, 'reminder', ?, ?, 'sent', ?)").run(
      `auto_${kind}_${key}_${p.id}`,
      p.id,
      message.subject,
      message.body,
      now,
    );
    db.prepare('UPDATE users SET last_reminder_at = ? WHERE id = ?').run(now, p.id);
    enqueueMail(db, { to: p.email, subject: message.subject, body: message.body, kind: 'reminder' });
  });
}

export async function pushTo(db: Db, sender: PushSender, userId: string, message: { title: string; body: string; url: string }): Promise<void> {
  const subs = db.prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?').all(userId) as unknown as PushSubscriptionRow[];
  for (const sub of subs) {
    if ((await sender.send(sub, message)) === 'gone') db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
  }
}
