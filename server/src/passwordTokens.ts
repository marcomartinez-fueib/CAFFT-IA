import { createHash, randomBytes } from 'node:crypto';
import type { Db } from './db.ts';

export type TokenPurpose = 'reset' | 'invite';

const TTL_MS: Record<TokenPurpose, number> = {
  reset: 60 * 60 * 1000,
  invite: 7 * 24 * 60 * 60 * 1000,
};

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/** Issues a new link token. Any earlier unused token of the user stops working. */
export function issuePasswordToken(db: Db, userId: string, purpose: TokenPurpose): string {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare('UPDATE password_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL').run(now, userId);
  db.prepare('INSERT INTO password_tokens (token_hash, user_id, purpose, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
    hash(token),
    userId,
    purpose,
    now,
    now + TTL_MS[purpose],
  );
  return token;
}

/** The user a valid token belongs to, marking it used; null if unknown, used or expired. */
export function consumePasswordToken(db: Db, token: string): { userId: string; purpose: TokenPurpose } | null {
  const row = db
    .prepare('SELECT user_id, purpose, expires_at, used_at FROM password_tokens WHERE token_hash = ?')
    .get(hash(token)) as { user_id: string; purpose: TokenPurpose; expires_at: number; used_at: number | null } | undefined;
  if (!row || row.used_at !== null || row.expires_at <= Date.now()) return null;
  db.prepare('UPDATE password_tokens SET used_at = ? WHERE token_hash = ?').run(Date.now(), hash(token));
  return { userId: row.user_id, purpose: row.purpose };
}
