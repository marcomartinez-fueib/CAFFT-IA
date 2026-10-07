import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export type Db = DatabaseSync;

const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'migrations');

/** Opens the database and, unless told otherwise, brings its schema up to date. */
export function openDb(path: string, options: { migrate?: boolean } = {}): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  // Another process (the backup job) may hold the lock briefly.
  db.exec('PRAGMA busy_timeout = 5000');
  if (options.migrate !== false) migrate(db);
  return db;
}

/**
 * Applies every migrations/NNN_*.sql file not yet recorded in
 * schema_migrations, in order, each in its own transaction.
 */
export function migrate(db: Db): void {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)');

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((r) => Number(r.version)),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .sort();

  for (const file of files) {
    const version = Number.parseInt(file, 10);
    if (applied.has(version)) continue;

    transaction(db, () => {
      db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(version, Date.now());
    });
  }
}

export function transaction<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
