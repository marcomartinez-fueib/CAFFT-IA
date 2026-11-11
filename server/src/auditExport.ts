import type { Db } from './db.ts';

/**
 * The audit log as CSV, for the data protection officer: when, who (username
 * and role), what, about whom, from where, and the detail (for clinical
 * accesses, the patients' usernames). Read-only.
 */
export function auditCsv(db: Db, since: number): string {
  const users = new Map(
    (db.prepare('SELECT id, username, role FROM users').all() as { id: string; username: string; role: string }[]).map((u) => [u.id, u]),
  );
  const name = (id: string | null) => (id ? users.get(id)?.username ?? `(esborrat ${id.slice(0, 8)})` : '');
  const rows = db
    .prepare('SELECT at, actor_id, action, target_id, ip, detail FROM audit_log WHERE at >= ? ORDER BY at')
    .all(since) as { at: number; actor_id: string | null; action: string; target_id: string | null; ip: string | null; detail: string | null }[];

  const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [['data_utc', 'usuari', 'rol', 'accio', 'sobre', 'ip', 'pacients'].join(',')];
  for (const r of rows) {
    const patients = r.detail ? ((JSON.parse(r.detail) as { patients?: string[] }).patients ?? []).map(name).join(' ') : '';
    lines.push(
      [new Date(r.at).toISOString(), name(r.actor_id), r.actor_id ? users.get(r.actor_id)?.role ?? '' : '', r.action, name(r.target_id), r.ip ?? '', patients]
        .map((v) => quote(String(v)))
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}
