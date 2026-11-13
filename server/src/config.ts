import { readFileSync } from 'node:fs';
import { readApiKey } from './ai/provider.ts';
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
  /**
   * When set (the test environment), mail is delivered only to these domains,
   * e.g. ["uib.es", "fueib.org"]; the rest is logged and not sent. Empty: no
   * restriction.
   */
  mailAllowedDomains: string[];
  /** Where feedback sent from the app is mailed. Empty disables the mail; it is still stored. */
  feedbackTo: string;
  /**
   * The AI assistant. Off without a key, or with AI_ENABLED=false (a switch
   * for the pilot if the data protection officer asks for it).
   */
  ai: {
    enabled: boolean;
    /** `local`: the UIB's engine (pausat-llm); `gemini`: Google. */
    provider: 'local' | 'gemini';
    apiKey: string;
    model: string;
    local: { url: string; token: string; model: string };
    retentionDays: number | null;
  };
  /**
   * Reminders the server sends by itself (src/reminders.ts), and Web Push.
   * Push is off without VAPID keys (VAPID_FILE: {"publicKey","privateKey"}).
   */
  reminders: {
    enabled: boolean;
    push: { publicKey: string; privateKey: string; subject: string } | null;
  };
  /** Disables request logging; used by tests. */
  logger: boolean;
}

function readVapid(path: string | undefined, subject: string): Config['reminders']['push'] {
  const raw = readSecret(path);
  if (!raw) return null;
  try {
    const { publicKey, privateKey } = JSON.parse(raw) as { publicKey?: string; privateKey?: string };
    return publicKey && privateKey ? { publicKey, privateKey, subject } : null;
  } catch {
    return null;
  }
}

/**
 * A secret from a file, or '' when there is no such file: a missing secret
 * leaves the assistant off instead of stopping the API.
 */
function readSecret(path: string | undefined): string {
  if (!path) return '';
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
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
    mailAllowedDomains: env('MAIL_ALLOWED_DOMAINS', '').split(',').map((d) => d.trim()).filter(Boolean),
    ai: {
      enabled: env('AI_ENABLED', 'true') !== 'false',
      provider: env('AI_PROVIDER', 'gemini') === 'local' ? 'local' : 'gemini',
      local: {
        url: env('LOCAL_LLM_URL', 'http://pausat-llm:8080/v1'),
        token: process.env.LOCAL_LLM_TOKEN || readSecret(process.env.LOCAL_LLM_TOKEN_FILE).trim(),
        model: env('LOCAL_LLM_MODEL', 'pausat-chat'),
      },
      apiKey: process.env.GEMINI_API_KEY || readApiKey(readSecret(process.env.GEMINI_KEY_FILE)),
      // Comma-separated, in order of preference (see ai/provider.ts).
      model: env('GEMINI_MODEL', 'gemini-3.8-flash,gemini-2.5-flash'),
      // Questions and answers older than this are deleted. Empty: kept.
      retentionDays: process.env.AI_RETENTION_DAYS ? Number(process.env.AI_RETENTION_DAYS) : null,
    },
    reminders: {
      enabled: env('REMINDERS_ENABLED', 'true') !== 'false',
      push: readVapid(process.env.VAPID_FILE, env('VAPID_SUBJECT', 'mailto:salutmental@fueib.org')),
    },
    // Like BACKUP_DIR, an explicitly empty FEEDBACK_TO means "off".
    feedbackTo: process.env.FEEDBACK_TO ?? 'salutmental@fueib.org',
    logger: true,
    ...overrides,
  };
}
