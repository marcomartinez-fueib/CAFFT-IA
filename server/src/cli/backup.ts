/**
 * Takes a backup now, in addition to the daily one the API makes by itself.
 * Run it before anything risky, e.g. a deploy that adds a migration:
 *
 *   docker compose exec api node src/cli/backup.ts
 */
import { loadConfig } from '../config.ts';
import { openDb } from '../db.ts';
import { backupDatabase } from '../backup.ts';

const config = loadConfig();
const db = openDb(config.dbPath);
console.log(`Backup written to ${await backupDatabase(db, config.backupDir, config.backupKeepDays)}`);
db.close();
