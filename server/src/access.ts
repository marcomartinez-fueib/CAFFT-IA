import type { Db } from './db.ts';
import type { UserRow } from './users.ts';

/**
 * Who can see whom. Every read and write of another user's data goes through
 * here, so this is the whole authorization model:
 *
 *   patient     themselves
 *   therapist   themselves and their patients
 *   manager     themselves, their therapists, and those therapists' patients
 *   superadmin  everyone
 */
function visibilityClause(actor: UserRow): { sql: string; params: string[] } {
  switch (actor.role) {
    case 'patient':
      return { sql: 'u.id = ?', params: [actor.id] };
    case 'therapist':
      return { sql: '(u.id = ? OR u.therapist_id = ?)', params: [actor.id, actor.id] };
    case 'manager':
      return {
        sql: '(u.id = ? OR u.manager_id = ? OR u.therapist_id IN (SELECT id FROM users WHERE manager_id = ?))',
        params: [actor.id, actor.id, actor.id],
      };
    case 'superadmin':
      return { sql: '1 = 1', params: [] };
  }
}

export function visibleUsers(db: Db, actor: UserRow): UserRow[] {
  const { sql, params } = visibilityClause(actor);
  return db.prepare(`SELECT * FROM users u WHERE ${sql} ORDER BY u.created_at`).all(...params) as unknown as UserRow[];
}

/** The target user, if the actor may see them; undefined otherwise (callers answer 404, not 403). */
export function visibleUser(db: Db, actor: UserRow, targetId: string): UserRow | undefined {
  const { sql, params } = visibilityClause(actor);
  return db.prepare(`SELECT * FROM users u WHERE u.id = ? AND ${sql}`).get(targetId, ...params) as unknown as UserRow | undefined;
}

/**
 * Clinical records (QPV-II, exposure progress, AI consultations) are written
 * only by the patient they belong to. Superadmin may also write them, which
 * the development seeding tool relies on.
 */
export function canWriteClinical(actor: UserRow, userId: string): boolean {
  return actor.id === userId || actor.role === 'superadmin';
}

/**
 * Account administration (delete, reset password) of another user: a
 * therapist over their own patients, a superadmin over anyone but themselves.
 */
export function canAdminister(actor: UserRow, target: UserRow): boolean {
  if (actor.id === target.id) return false;
  if (actor.role === 'superadmin') return true;
  return actor.role === 'therapist' && target.role === 'patient' && target.therapist_id === actor.id;
}
