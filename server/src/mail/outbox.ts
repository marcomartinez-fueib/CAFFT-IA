import type { Db } from '../db.ts';
import type { MailTransport } from './transport.ts';

export type MailKind = 'password_reset' | 'invitation' | 'reminder';

/** Call inside the transaction that makes the change the mail is about. */
export function enqueueMail(db: Db, mail: { to: string; subject: string; body: string; kind: MailKind }): void {
  const now = Date.now();
  db.prepare('INSERT INTO outbound_mail (to_address, subject, body, kind, created_at, next_attempt_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    mail.to,
    mail.subject,
    mail.body,
    mail.kind,
    now,
    now,
  );
}

// After the first failure: 1 min, 5 min, 30 min, 2 h, 6 h, then give up
// (~9 h in all). A password-reset link is only valid for an hour anyway.
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000, 6 * 3600_000];

interface MailRow {
  id: number;
  to_address: string;
  subject: string;
  body: string;
  attempts: number;
}

/**
 * Sends every due message once. Returns how many were sent. Runs on a timer in
 * the API process (src/index.ts); a single process means no two workers can
 * pick the same row.
 */
export async function processOutbox(db: Db, transport: MailTransport, log: (msg: string, err?: unknown) => void = () => {}): Promise<number> {
  const due = db
    .prepare('SELECT id, to_address, subject, body, attempts FROM outbound_mail WHERE sent_at IS NULL AND failed_at IS NULL AND next_attempt_at <= ? ORDER BY id LIMIT 50')
    .all(Date.now()) as unknown as MailRow[];

  let sent = 0;
  for (const mail of due) {
    try {
      const response = await transport.send({ to: mail.to_address, subject: mail.subject, body: mail.body });
      db.prepare('UPDATE outbound_mail SET sent_at = ?, attempts = attempts + 1, last_error = NULL, relay_response = ? WHERE id = ?').run(
        Date.now(),
        typeof response === 'string' ? response.slice(0, 500) : null,
        mail.id,
      );
      sent++;
    } catch (err) {
      const attempts = mail.attempts + 1;
      const giveUp = attempts > BACKOFF_MS.length;
      const now = Date.now();
      db.prepare('UPDATE outbound_mail SET attempts = ?, last_error = ?, next_attempt_at = ?, failed_at = ? WHERE id = ?').run(
        attempts,
        String((err as Error)?.message ?? err).slice(0, 1000),
        giveUp ? now : now + BACKOFF_MS[attempts - 1],
        giveUp ? now : null,
        mail.id,
      );
      log(giveUp ? `mail ${mail.id} failed permanently` : `mail ${mail.id} failed, will retry`, err);
    }
  }
  return sent;
}
