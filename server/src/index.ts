import { loadConfig } from './config.ts';
import { migrate, openDb } from './db.ts';
import { buildApp } from './app.ts';
import { purgeExpiredSessions } from './sessions.ts';
import { backupDatabase } from './backup.ts';

const config = loadConfig();
const db = openDb(config.dbPath, { migrate: false });

// Snapshot before migrating, so every deploy leaves behind a copy of the data
// as it was before the new code touched the schema. A failed backup stops the
// start-up rather than migrating without a safety net.
if (config.backupDir) {
  const file = await backupDatabase(db, config.backupDir, config.backupKeepDays);
  console.log(`pre-start backup written to ${file}`);
}
migrate(db);

const app = await buildApp(config, db);

purgeExpiredSessions(db);
setInterval(() => purgeExpiredSessions(db), 6 * 60 * 60 * 1000).unref();

// Then one a day while the process runs.
async function runBackup(): Promise<void> {
  try {
    app.log.info({ file: await backupDatabase(db, config.backupDir, config.backupKeepDays) }, 'database backup written');
  } catch (err) {
    app.log.error({ err }, 'database backup failed');
  }
}
if (config.backupDir) {
  setInterval(runBackup, 24 * 60 * 60 * 1000).unref();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    db.close();
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: config.host });
