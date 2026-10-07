import { createHash, randomBytes } from 'node:crypto';
import type { Db } from './db.ts';
import { findUserById, type UserRow } from './users.ts';

export const SESSION_COOKIE = 'cafft_session';

// Refreshing expires_at on every request would mean a write per request;
// once an hour is enough for a sliding window measured in days.
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Creates a session and returns the raw token for the cookie. Only its hash is stored. */
export function createSession(db: Db, userId: string, ttlMs: number): string {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?)').run(
    hashToken(token),
    userId,
    now,
    now + ttlMs,
    now,
  );
  return token;
}

interface SessionRow {
  token_hash: string;
  user_id: string;
  expires_at: number;
  last_seen_at: number;
}

/** Resolves a cookie token to its user, extending the session's lifetime. */
export function resolveSession(db: Db, token: string, ttlMs: number): UserRow | null {
  const tokenHash = hashToken(token);
  const session = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(tokenHash) as unknown as SessionRow | undefined;
  if (!session) return null;

  const now = Date.now();
  if (session.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }

  if (now - session.last_seen_at > TOUCH_INTERVAL_MS) {
    db.prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?').run(now, now + ttlMs, tokenHash);
  }

  return findUserById(db, session.user_id) ?? null;
}

export function deleteSession(db: Db, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

/** Revokes every session of a user except, optionally, the one making the request. */
export function deleteOtherSessions(db: Db, userId: string, keepToken?: string): void {
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, keepToken ? hashToken(keepToken) : '');
}

export function purgeExpiredSessions(db: Db): void {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
}
