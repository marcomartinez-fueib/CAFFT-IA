import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { backupDatabase } from '../src/backup.ts';
import { makeApp, seedUser } from './helpers.ts';

test('backup snapshots the database and prunes old snapshots', async () => {
  const { db } = await makeApp();
  await seedUser(db, 'patient', 'enlacopia');
  const dir = mkdtempSync(join(tmpdir(), 'cafft-backup-'));
  writeFileSync(join(dir, 'cafft-2000-01-01.db'), '');  // ancient: must go
  writeFileSync(join(dir, 'unrelated.txt'), '');        // not ours: must stay

  const file = await backupDatabase(db, dir, 30);

  const copy = new DatabaseSync(file, { readOnly: true });
  assert.equal(copy.prepare('SELECT username FROM users').get()!.username, 'enlacopia');
  copy.close();
  assert.deepEqual(readdirSync(dir).sort(), [file.split('/').pop(), 'unrelated.txt'].sort());
});

test('BACKUP_DIR set to empty disables backups; unset uses the default', async () => {
  const { loadConfig } = await import('../src/config.ts');
  const saved = process.env.BACKUP_DIR;
  try {
    process.env.BACKUP_DIR = '';
    assert.equal(loadConfig().backupDir, '');
    delete process.env.BACKUP_DIR;
    assert.equal(loadConfig().backupDir, './data/backups');
  } finally {
    if (saved === undefined) delete process.env.BACKUP_DIR;
    else process.env.BACKUP_DIR = saved;
  }
});
