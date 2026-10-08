import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';
import { processOutbox } from '../src/mail/outbox.ts';
import { GraphTransport, LogTransport } from '../src/mail/transport.ts';
import type { Db } from '../src/db.ts';

const post = (app: FastifyInstance, url: string, payload: object, cookie?: string) =>
  app.inject({ method: 'POST', url, headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}) }, payload });

/** Delivers the outbox and returns the token from the last link sent. */
async function deliverAndGetToken(db: Db): Promise<{ token: string; mail: LogTransport['sent'][number] }> {
  const transport = new LogTransport(() => {});
  await processOutbox(db, transport);
  const mail = transport.sent.at(-1)!;
  const token = /#\/reset-password\/([A-Za-z0-9_-]+)/.exec(mail.body)![1];
  return { token, mail };
}

test('password reset: request, email link, set password, single use', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'patient', 'oblidadis');
  const oldSession = await login(app, 'oblidadis');

  // Unknown address: same answer, nothing sent.
  assert.equal((await post(app, '/auth/password-reset', { email: 'ningu@example.test' })).statusCode, 204);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM outbound_mail').get()!.n, 0);

  assert.equal((await post(app, '/auth/password-reset', { email: 'OBLIDADIS@example.test', language: 'es' })).statusCode, 204);
  const { token, mail } = await deliverAndGetToken(db);
  assert.equal(mail.to, 'oblidadis@example.test');
  assert.match(mail.subject, /restablece/);
  assert.ok(mail.body.includes('http://localhost:3000/cafft/#/reset-password/'));

  const confirm = (password: string) => post(app, '/auth/password-reset/confirm', { token, password });
  assert.equal((await confirm('curta')).json().error, 'auth.passwordMinLengthError');
  assert.equal((await confirm('una-nova-de-trinca')).statusCode, 204);
  assert.equal((await confirm('una-altra-de-trinca')).json().error, 'auth.invalidOrExpiredTokenError');

  await login(app, 'oblidadis', 'una-nova-de-trinca');
  assert.equal((await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie: oldSession } })).statusCode, 401);
});

test('an expired reset link is refused', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'patient', 'tard');
  await post(app, '/auth/password-reset', { email: 'tard@example.test' });
  const { token } = await deliverAndGetToken(db);
  db.prepare('UPDATE password_tokens SET expires_at = ?').run(Date.now() - 1);
  const res = await post(app, '/auth/password-reset/confirm', { token, password: 'massa-tard-ja' });
  assert.equal(res.json().error, 'auth.invalidOrExpiredTokenError');
});

test('a user created without a password is invited by email', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'therapist', 'ter');
  const cookie = await login(app, 'ter');

  const res = await post(app, '/users', { role: 'patient', username: 'convidat', email: 'convidat@example.test', language: 'ca' }, cookie);
  assert.equal(res.statusCode, 201);
  assert.equal(res.json().invitationSent, true);
  const patientId = res.json().user.id;

  const { token, mail } = await deliverAndGetToken(db);
  assert.equal(mail.subject, 'Benvingut/da a CAFFT');
  assert.ok(mail.body.includes("El teu nom d'usuari és: convidat"));
  assert.ok(mail.body.includes('ter t\'ha creat un compte'));

  // The therapist sees the invitation in the history, without the link.
  const history = db.prepare('SELECT type, body FROM emails WHERE patient_id = ?').get(patientId) as { type: string; body: string };
  assert.equal(history.type, 'invitation');
  assert.ok(!history.body.includes(token));

  assert.equal((await post(app, '/auth/password-reset/confirm', { token, password: 'la-meva-clau' })).statusCode, 204);
  await login(app, 'convidat', 'la-meva-clau');
});

test('resending an invitation invalidates the previous link', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'therapist', 'ter');
  const res = await post(app, '/users', { role: 'patient', username: 'pac1', email: 'pac1@example.test' }, await login(app, 'ter'));
  assert.equal(res.statusCode, 201);
  const { token: first } = await deliverAndGetToken(db);

  const again = await post(app, `/users/${res.json().user.id}/invite`, {}, await login(app, 'ter'));
  assert.equal(again.statusCode, 204);
  const { token: second } = await deliverAndGetToken(db);
  assert.notEqual(first, second);

  assert.equal((await post(app, '/auth/password-reset/confirm', { token: first, password: 'primer-enllac' })).statusCode, 400);
  assert.equal((await post(app, '/auth/password-reset/confirm', { token: second, password: 'segon-enllac' })).statusCode, 204);

  // Someone else's patient: not visible, so 404.
  await seedUser(db, 'therapist', 'altre');
  const foreign = await post(app, `/users/${res.json().user.id}/invite`, {}, await login(app, 'altre'));
  assert.equal(foreign.statusCode, 404);
});

test('reminder emails go only to patients who accepted notifications', async () => {
  const { app, db } = await makeApp();
  const ter = await seedUser(db, 'therapist', 'ter');
  const yes = await seedUser(db, 'patient', 'si');
  const no = await seedUser(db, 'patient', 'no');
  const prefs = (enabled: boolean) =>
    JSON.stringify({ enabled, reminders: true, newTasks: true, followUp: true, general: true, frequency: 'daily', startTime: '09:00', endTime: '21:00' });
  db.prepare('UPDATE users SET therapist_id = ?, notification_prefs = ? WHERE id = ?').run(ter.id, prefs(true), yes.id);
  db.prepare('UPDATE users SET therapist_id = ?, notification_prefs = ? WHERE id = ?').run(ter.id, prefs(false), no.id);
  const cookie = await login(app, 'ter');

  for (const p of [yes, no]) {
    await post(app, '/emails', { id: `r-${p.id}`, patientId: p.id, type: 'reminder', subject: 'Hola', body: 'Ens trobem a faltar', status: 'sent', timestamp: 1 }, cookie);
  }
  const transport = new LogTransport(() => {});
  await processOutbox(db, transport);
  assert.deepEqual(transport.sent.map((m) => m.to), ['si@example.test']);
  // Both are in the history.
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM emails WHERE type = 'reminder'").get()!.n, 2);
});

test('the outbox retries with backoff and eventually gives up', async () => {
  const { db } = await makeApp();
  db.prepare("INSERT INTO outbound_mail (to_address, subject, body, kind, created_at, next_attempt_at) VALUES ('x@example.test', 's', 'b', 'reminder', 0, 0)").run();
  const failing = { send: async () => { throw new Error('Graph is down'); } };

  for (let attempt = 1; attempt <= 6; attempt++) {
    db.prepare('UPDATE outbound_mail SET next_attempt_at = 0').run(); // pretend the backoff elapsed
    await processOutbox(db, failing);
    const row = db.prepare('SELECT attempts, failed_at, last_error, next_attempt_at FROM outbound_mail').get() as {
      attempts: number; failed_at: number | null; last_error: string; next_attempt_at: number;
    };
    assert.equal(row.attempts, attempt);
    assert.equal(row.last_error, 'Graph is down');
    if (attempt < 6) {
      assert.equal(row.failed_at, null);
      assert.ok(row.next_attempt_at > Date.now());
    } else {
      assert.ok(row.failed_at);
    }
  }
  // Given up: never picked again.
  assert.equal(await processOutbox(db, new LogTransport(() => {})), 0);
});

test('GraphTransport: client-credentials token, cached, and the sendMail call', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fakeFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('/oauth2/')) return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 });
    return new Response(null, { status: 202 });
  }) as unknown as typeof fetch;

  const graph = new GraphTransport({ tenantId: 'tid', clientId: 'cid', clientSecret: 'sec', sender: 'no-reply@fueib.org' }, fakeFetch);
  await graph.send({ to: 'a@example.test', subject: 'S', body: 'B' });
  await graph.send({ to: 'b@example.test', subject: 'S', body: 'B' });

  assert.equal(calls.filter((c) => c.url.includes('/oauth2/')).length, 1); // token reused
  assert.equal(calls[0].url, 'https://login.microsoftonline.com/tid/oauth2/v2.0/token');
  assert.ok(String(calls[0].init.body).includes('grant_type=client_credentials'));

  const send = calls[1];
  assert.equal(send.url, 'https://graph.microsoft.com/v1.0/users/no-reply%40fueib.org/sendMail');
  assert.equal((send.init.headers as Record<string, string>).Authorization, 'Bearer tok');
  const payload = JSON.parse(String(send.init.body));
  assert.deepEqual(payload.message.toRecipients, [{ emailAddress: { address: 'a@example.test' } }]);
  assert.equal(payload.saveToSentItems, false);
});

test('GraphTransport surfaces Graph errors so the outbox retries', async () => {
  const fakeFetch = (async (url: string) =>
    url.includes('/oauth2/')
      ? new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 })
      : new Response('{"error":{"code":"ErrorAccessDenied"}}', { status: 403 })) as unknown as typeof fetch;
  const graph = new GraphTransport({ tenantId: 't', clientId: 'c', clientSecret: 's', sender: 'x@fueib.org' }, fakeFetch);
  await assert.rejects(graph.send({ to: 'a@example.test', subject: 'S', body: 'B' }), /403.*ErrorAccessDenied/);
});
