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
  /** 'graph' delivers through Microsoft Graph; 'log' only writes mail to the log. */
  mailTransport: 'graph' | 'log';
  graph: { tenantId: string; clientId: string; clientSecret: string; sender: string };
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
    backupDir: env('BACKUP_DIR', './data/backups'),
    backupKeepDays: Number(env('BACKUP_KEEP_DAYS', '30')),
    appUrl: env('APP_URL', 'http://localhost:3000/cafft/'),
    mailTransport: env('MAIL_TRANSPORT', 'log') === 'graph' ? 'graph' : 'log',
    graph: {
      tenantId: env('GRAPH_TENANT_ID', ''),
      clientId: env('GRAPH_CLIENT_ID', ''),
      clientSecret: env('GRAPH_CLIENT_SECRET', ''),
      sender: env('MAIL_FROM', ''),
    },
    logger: true,
    ...overrides,
  };
}
