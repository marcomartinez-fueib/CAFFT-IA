/**
 * Prints the audit log as CSV: logins, account changes, consents, and every
 * access by staff to patients' clinical data. For the data protection
 * officer, or to answer «who has seen this patient?».
 *
 *   docker exec cafft-api node src/cli/audit.ts               # last 30 days
 *   docker exec cafft-api node src/cli/audit.ts --days 365 > audit.csv
 */
import { loadConfig } from '../config.ts';
import { openDb } from '../db.ts';
import { auditCsv } from '../auditExport.ts';

const i = process.argv.indexOf('--days');
const days = i > 0 ? Number(process.argv[i + 1]) : 30;
if (!Number.isFinite(days) || days <= 0) {
  console.error('usage: audit.ts [--days N]');
  process.exit(2);
}

const db = openDb(loadConfig().dbPath, { migrate: false });
process.stdout.write(auditCsv(db, Date.now() - days * 24 * 60 * 60 * 1000));
db.close();
