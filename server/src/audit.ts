import type { Db } from './db.ts';

export function audit(
  db: Db,
  entry: { actorId: string | null; action: string; targetId?: string | null; ip?: string | null },
): void {
  db.prepare('INSERT INTO audit_log (at, actor_id, action, target_id, ip) VALUES (?, ?, ?, ?, ?)').run(
    Date.now(),
    entry.actorId,
    entry.action,
    entry.targetId ?? null,
    entry.ip ?? null,
  );
}
