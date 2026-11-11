import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { migrate, openDb } from '../src/db.ts';
import { CONSENT_VERSIONS } from '../src/consents.ts';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';

function as(app: FastifyInstance, cookie: string) {
  return (method: 'GET' | 'POST' | 'PUT', url: string, payload?: object) =>
    app.inject({ method, url, headers: { cookie, origin: ORIGIN }, ...(payload ? { payload } : {}) });
}

const SCORES = { malestarGeneral: 1, subPreparatius: 2, subVicari: 3, subVol: 4, total: 10 };
const METADATA = { dob: '1990-01-01', gender: 'female', occupation: 'PDI', source: 'web', studentsPresence: false };

test('a patient registered from the panel must accept the consent before any clinical data', async () => {
  const { app, db } = await makeApp();
  const T = await seedUser(db, 'therapist', 'ter');
  const P = await seedUser(db, 'patient', 'pac', 'correct-horse', { consent: false });
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T.id, P.id);
  const patient = as(app, await login(app, 'pac'));
  const result = { userId: P.id, timestamp: 1, formName: 'x', date: 'x', scores: SCORES, answers: {} };

  assert.equal((await patient('GET', '/auth/me')).json().user.treatmentConsent, undefined);
  const refused = await patient('PUT', '/qpvii', result);
  assert.equal(refused.statusCode, 403);
  assert.equal(refused.json().error, 'consent.required');

  // A page showing an older text cannot record acceptance.
  assert.equal((await patient('POST', '/me/consents', { kind: 'treatment', version: 'old' })).statusCode, 409);

  const accepted = await patient('POST', '/me/consents', { kind: 'treatment', version: CONSENT_VERSIONS.treatment, language: 'ca', informedConsentMetadata: METADATA });
  assert.equal(accepted.statusCode, 200);
  assert.equal(accepted.json().user.treatmentConsent.version, CONSENT_VERSIONS.treatment);
  assert.deepEqual(accepted.json().user.informedConsentMetadata, METADATA);
  assert.equal((await patient('PUT', '/qpvii', result)).statusCode, 204);

  const row = db.prepare('SELECT kind, version, language FROM consents WHERE user_id = ?').get(P.id);
  assert.deepEqual({ ...row }, { kind: 'treatment', version: CONSENT_VERSIONS.treatment, language: 'ca' });
  assert.ok(db.prepare("SELECT 1 FROM audit_log WHERE action = 'consent.accept.treatment' AND actor_id = ?").get(P.id));
});

test('staff creating a patient no longer marks them as consenting', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'therapist', 'ter');
  const therapist = as(app, await login(app, 'ter'));
  const res = await therapist('POST', '/users', { role: 'patient', username: 'nova', email: 'nova@example.test' });
  assert.equal(res.statusCode, 201, res.body);
  const row = db.prepare("SELECT consent_given, treatment_consent_version FROM users WHERE username = 'nova'").get();
  assert.deepEqual({ ...row }, { consent_given: 0, treatment_consent_version: null });
});

test('self-registration records the version of the text the form showed', async () => {
  const { app, db } = await makeApp();
  const register = (payload: object) => app.inject({ method: 'POST', url: '/auth/register', headers: { origin: ORIGIN }, payload });
  const base = { username: 'nou', email: 'nou@example.test', password: 'llarga-prou', consent: true, informedConsentMetadata: METADATA };

  assert.equal((await register({ ...base, consentVersion: 'old' })).statusCode, 409);
  const ok = await register({ ...base, consentVersion: CONSENT_VERSIONS.treatment, language: 'es' });
  assert.equal(ok.statusCode, 201);
  assert.equal(ok.json().user.treatmentConsent.version, CONSENT_VERSIONS.treatment);
  assert.equal(db.prepare("SELECT language FROM consents WHERE kind = 'treatment'").get()!.language, 'es');
});

test('the notification consent can be withdrawn; reminders stop and the history keeps it', async () => {
  const { app, db } = await makeApp();
  const P = await seedUser(db, 'patient', 'pac');
  db.prepare('UPDATE users SET notification_prefs = ? WHERE id = ?').run(JSON.stringify({ enabled: true, reminders: true }), P.id);
  const patient = as(app, await login(app, 'pac'));

  await patient('POST', '/me/consents', { kind: 'notifications', version: CONSENT_VERSIONS.notifications });
  const res = await patient('POST', '/me/consents/withdraw', { kind: 'notifications' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().user.notificationPreferences.enabled, false);
  const row = db.prepare("SELECT withdrawn_at FROM consents WHERE kind = 'notifications'").get()!;
  assert.ok(Number(row.withdrawn_at) > 0);
  assert.equal((await patient('POST', '/me/consents/withdraw', { kind: 'treatment' })).statusCode, 400);
});

test('migration 007: only patients who saw the form keep a (pre-versioning) consent', () => {
  const db = openDb(':memory:', { migrate: false });
  db.exec('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)');
  const dir = join(import.meta.dirname, '..', 'migrations');
  for (const file of readdirSync(dir).filter((f) => /^00[1-6]_/.test(f)).sort()) {
    db.exec(readFileSync(join(dir, file), 'utf8'));
    db.prepare('INSERT INTO schema_migrations VALUES (?, 0)').run(Number.parseInt(file, 10));
  }
  const insert = db.prepare(
    `INSERT INTO users (id, role, username, email, password_hash, consent_given, consent_metadata, notification_prefs, created_at, updated_at)
     VALUES (?, 'patient', ?, ?, 'x', 1, ?, ?, 100, 100)`,
  );
  insert.run('self', 'self', 'self@x', JSON.stringify(METADATA), JSON.stringify({ enabled: true, consentDate: 500 }));
  insert.run('panel', 'panel', 'panel@x', null, null);

  migrate(db);

  const users = db.prepare('SELECT id, consent_given, treatment_consent_version FROM users ORDER BY id').all().map((r) => ({ ...r }));
  assert.deepEqual(users, [
    { id: 'panel', consent_given: 0, treatment_consent_version: null },
    { id: 'self', consent_given: 1, treatment_consent_version: 'pre-2026-11' },
  ]);
  const notif = db.prepare("SELECT user_id, accepted_at FROM consents WHERE kind = 'notifications'").all().map((r) => ({ ...r }));
  assert.deepEqual(notif, [{ user_id: 'self', accepted_at: 500 }]);
});

// Changing a consent text must ask everyone again, which means bumping its
// version in consent.ts. If this fails because you edited a text: bump the
// version there, then update the pinned hash below to the new one.
test('consent texts are pinned to their version', () => {
  const source = readFileSync(join(import.meta.dirname, '..', '..', 'data', 'translations.ts'), 'utf8');
  const hashOf = (keys: string[]) => {
    const lines = source.split('\n').filter((line) => keys.some((k) => line.trimStart().startsWith(`${k}:`)));
    assert.ok(lines.length >= keys.length * 3, `expected ${keys.join(', ')} in CA, ES and EN`);
    return createHash('sha256').update(lines.map((l) => l.trim()).join('\n')).digest('hex').slice(0, 16);
  };
  const PINNED = {
    treatment: { version: '2026-11', hash: '8ff0ab9b5da1392a' },
    notifications: { version: '2026-11', hash: 'ecd789a6c9213915' },
  };
  assert.deepEqual(
    { treatment: { version: CONSENT_VERSIONS.treatment, hash: hashOf(['consentText', 'legalText']) },
      notifications: { version: CONSENT_VERSIONS.notifications, hash: hashOf(['notificationConsentPrompt', 'notificationConsentExplain', 'notificationPrivacyNote']) } },
    PINNED,
  );
});
