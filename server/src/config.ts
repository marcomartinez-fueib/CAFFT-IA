export interface Config {
  dbPath: string;
  port: number;
  host: string;
  publicOrigin: string;
  cookiePath: string;
  cookieSecure: boolean;
  sessionTtlMs: number;
  /** Daily snapshots go here. Empty disables automatic backups. */
  backupDir: string;
  backupKeepDays: number;
  /** Public URL of the app, for links in emails, e.g. https://pausat.uib.es/cafft/ */
  appUrl: string;
  /**
   * SMTP relay for outgoing mail. Without a host, mail is only written to the
   * log, which is what development and tests want.
   */
  smtp: { host: string; port: number; requireTls: boolean; from: string };
  /** Disables request logging; used by tests. */
  logger: boolean;
}

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export function loadConfig(overrides: Partial<Config> = {}): Config {
  return {
    dbPath: env('DB_PATH', './data/cafft.db'),
    port: Number(env('PORT', '3001')),
    host: env('HOST', '127.0.0.1'),
    publicOrigin: env('PUBLIC_ORIGIN', 'http://localhost:3000'),
    cookiePath: env('COOKIE_PATH', '/cafft'),
    cookieSecure: env('COOKIE_SECURE', 'true') !== 'false',
    sessionTtlMs: Number(env('SESSION_TTL_DAYS', '14')) * 24 * 60 * 60 * 1000,
    // Unlike the other settings, an explicitly empty BACKUP_DIR means "off".
    backupDir: process.env.BACKUP_DIR ?? './data/backups',
    backupKeepDays: Number(env('BACKUP_KEEP_DAYS', '30')),
    appUrl: env('APP_URL', 'http://localhost:3000/cafft/'),
    smtp: {
      host: env('SMTP_HOST', ''),
      port: Number(env('SMTP_PORT', '25')),
      // Anything but an explicit "false" requires STARTTLS; sending in clear is
      // only acceptable against a local test server.
      requireTls: env('SMTP_STARTTLS', 'true') !== 'false',
      from: env('MAIL_FROM', ''),
    },
    logger: true,
    ...overrides,
  };
}
