import { loadConfig } from './config.ts';
import { migrate, openDb } from './db.ts';
import { buildApp, configuredProvider, configuredPush } from './app.ts';
import { runReminders } from './reminders.ts';
import { purgeExpiredSessions } from './sessions.ts';
import { backupDatabase } from './backup.ts';
import { processOutbox } from './mail/outbox.ts';
import nodemailer from 'nodemailer';
import { DomainRestrictedTransport, LogTransport, SmtpTransport, type CreateTransport, type MailTransport } from './mail/transport.ts';
import { purgeOldConsultations } from './routes/assistant.ts';

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

// AI assistant: say whether it is on, and keep questions and answers only for
// the retention period, if one is set (AI_RETENTION_DAYS).
app.log.info(
  {
    enabled: configuredProvider(config) !== null,
    provider: config.ai.provider,
    model: config.ai.provider === 'local' ? `${config.ai.local.model} @ ${config.ai.local.url}` : config.ai.model,
    retentionDays: config.ai.retentionDays,
  },
  'AI assistant',
);
const purgeAi = () => {
  const removed = purgeOldConsultations(db, config.ai.retentionDays);
  if (removed > 0) app.log.info({ removed }, 'old assistant consultations deleted');
};
purgeAi();
setInterval(purgeAi, 24 * 60 * 60 * 1000).unref();

// Mail: deliver the outbox every 30 s. One run at a time, so a slow relay
// cannot make two runs send the same message.
let transport: MailTransport;
if (config.smtp.host) {
  if (!config.smtp.from) throw new Error('SMTP_HOST is set but MAIL_FROM is missing');
  transport = new SmtpTransport(config.smtp, nodemailer.createTransport as unknown as CreateTransport);
  app.log.info({ host: config.smtp.host, port: config.smtp.port, from: config.smtp.from }, 'mail goes out through SMTP');
} else {
  transport = new LogTransport((msg) => app.log.info(msg));
  app.log.warn('no SMTP_HOST: emails are written to this log, not sent');
}
if (config.mailAllowedDomains.length > 0) {
  transport = new DomainRestrictedTransport(transport, config.mailAllowedDomains, (msg) => app.log.warn(msg));
  app.log.info({ domains: config.mailAllowedDomains }, 'mail is delivered only to these domains');
}
let delivering = false;
setInterval(async () => {
  if (delivering) return;
  delivering = true;
  try {
    await processOutbox(db, transport, (msg, err) => app.log.error({ err }, msg));
  } finally {
    delivering = false;
  }
}, 30_000).unref();

// Session and inactivity reminders, checked every 5 minutes (src/reminders.ts).
// Their emails go through the outbox above.
const push = configuredPush(config, (msg, err) => app.log.warn({ err }, msg));
app.log.info({ enabled: config.reminders.enabled, push: push !== null }, 'reminders');
if (config.reminders.enabled) {
  let reminding = false;
  setInterval(async () => {
    if (reminding) return;
    reminding = true;
    try {
      const sent = await runReminders(db, { appUrl: config.appUrl, push });
      if (sent.session + sent.inactivity + sent.flight > 0) app.log.info(sent, 'reminders sent');
    } catch (err) {
      app.log.error({ err }, 'reminders failed');
    } finally {
      reminding = false;
    }
  }, 5 * 60 * 1000).unref();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    db.close();
    process.exit(0);
  });
}

await app.listen({ port: config.port, host: config.host });
