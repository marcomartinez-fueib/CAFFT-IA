import { backup } from 'node:sqlite';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './db.ts';

const FILE_PATTERN = /^cafft-(\d{4}-\d{2}-\d{2})\.db$/;

/**
 * Writes a consistent snapshot of the live database to
 * <dir>/cafft-YYYY-MM-DD.db (one per day; a second run the same day replaces
 * it) and deletes snapshots older than `keepDays`. Safe while the API is
 * serving requests: SQLite's online backup copies a consistent state.
 */
export async function backupDatabase(db: Db, dir: string, keepDays: number): Promise<string> {
  mkdirSync(dir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const target = join(dir, `cafft-${day}.db`);

  // Write under a temporary name so a crash mid-backup never leaves a
  // truncated file that looks like a valid snapshot.
  const partial = `${target}.partial`;
  rmSync(partial, { force: true });
  await backup(db, partial);
  renameSync(partial, target);

  const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  for (const file of readdirSync(dir)) {
    const match = FILE_PATTERN.exec(file);
    if (match && Date.parse(match[1]) < cutoff) rmSync(join(dir, file));
  }
  return target;
}
