import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';
import type { Db } from '../src/db.ts';

/**
 *   manager M ── therapist T1 ── patient P1
 *             └─ therapist T2 ── patient P2
 *   therapist T3 (no manager) ── patient P3
 *   superadmin S
 */
async function world() {
  const { app, db } = await makeApp();
  const S = await seedUser(db, 'superadmin', 'super');
  const M = await seedUser(db, 'manager', 'manager');
  const T1 = await seedUser(db, 'therapist', 'ter1');
  const T2 = await seedUser(db, 'therapist', 'ter2');
  const T3 = await seedUser(db, 'therapist', 'ter3');
  const P1 = await seedUser(db, 'patient', 'pac1');
  const P2 = await seedUser(db, 'patient', 'pac2');
  const P3 = await seedUser(db, 'patient', 'pac3');
  db.prepare('UPDATE users SET manager_id = ? WHERE id IN (?, ?)').run(M.id, T1.id, T2.id);
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T1.id, P1.id);
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T2.id, P2.id);
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T3.id, P3.id);
  return { app, db, S, M, T1, T2, T3, P1, P2, P3 };
}

function client(app: FastifyInstance, cookie: string) {
  const send = (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, payload?: object) =>
    app.inject({ method, url, headers: { cookie, origin: ORIGIN }, ...(payload ? { payload } : {}) });
  return {
    get: (url: string) => send('GET', url),
    post: (url: string, payload: object = {}) => send('POST', url, payload),
    put: (url: string, payload: object) => send('PUT', url, payload),
    patch: (url: string, payload: object) => send('PATCH', url, payload),
    del: (url: string) => send('DELETE', url),
  };
}

async function visibleUsernames(app: FastifyInstance, username: string): Promise<string[]> {
  const res = await client(app, await login(app, username)).get('/sync');
  assert.equal(res.statusCode, 200);
  return res.json().users.map((u: { username: string }) => u.username).sort();
}

test('/sync shows each role exactly the users it may see', async () => {
  const { app } = await world();
  assert.deepEqual(await visibleUsernames(app, 'pac1'), ['pac1']);
  assert.deepEqual(await visibleUsernames(app, 'ter1'), ['pac1', 'ter1']);
  assert.deepEqual(await visibleUsernames(app, 'manager'), ['manager', 'pac1', 'pac2', 'ter1', 'ter2']);
  assert.deepEqual((await visibleUsernames(app, 'super')).length, 8);
});

test('/sync only returns clinical data of visible users', async () => {
  const { app, db, P1, P3 } = await world();
  for (const p of [P1, P3]) {
    db.prepare(
      "INSERT INTO qpvii_results (user_id, timestamp, form_name, form_date, scores, answers) VALUES (?, 1, 'x', 'x', '{}', '{}')",
    ).run(p.id);
  }
  const res = await client(app, await login(app, 'ter1')).get('/sync');
  assert.deepEqual(res.json().qpvii.map((q: { userId: string }) => q.userId), [P1.id]);
});

test('who may create whom', async () => {
  const { app, db, T1, T3, M } = await world();
  const as = async (u: string) => client(app, await login(app, u));
  const body = (role: string, name: string, extra: object = {}) => ({
    role,
    username: name,
    email: `${name}@example.test`,
    password: 'llarga-prou',
    ...extra,
  });

  // A therapist's new patient is theirs, whatever the body says.
  const t1 = await as('ter1');
  const created = await t1.post('/users', body('patient', 'nou1', { therapistId: T3.id }));
  assert.equal(created.statusCode, 201);
  assert.equal(created.json().user.therapistId, T1.id);
  assert.match(created.json().user.patientCode, /^P-/);
  assert.equal((await t1.post('/users', body('therapist', 'nou2'))).statusCode, 403);

  const m = await as('manager');
  const ther = await m.post('/users', body('therapist', 'nou3'));
  assert.equal(ther.json().user.managerId, M.id);
  assert.equal((await m.post('/users', body('patient', 'nou4'))).statusCode, 403);

  assert.equal((await (await as('pac1')).post('/users', body('patient', 'nou5'))).statusCode, 403);

  const s = await as('super');
  assert.equal((await s.post('/users', body('manager', 'nou6'))).statusCode, 201);
  // Assignments must point at a user with the right role.
  assert.equal((await s.post('/users', body('patient', 'nou7', { therapistId: M.id }))).statusCode, 400);
  assert.equal((await s.post('/users', body('patient', 'nou8', { therapistId: T3.id }))).json().user.therapistId, T3.id);

  const dup = await s.post('/users', body('patient', 'NOU1'));
  assert.deepEqual([dup.statusCode, dup.json().error], [409, 'auth.usernameTakenError']);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action LIKE 'user.create.%'").get()!.n, 4);
});

test('delete: own patients only, with their clinical data', async () => {
  const { app, db, P1, P2, S } = await world();
  db.prepare(
    "INSERT INTO qpvii_results (user_id, timestamp, form_name, form_date, scores, answers) VALUES (?, 1, 'x', 'x', '{}', '{}')",
  ).run(P1.id);

  const t1 = client(app, await login(app, 'ter1'));
  assert.equal((await t1.del(`/users/${P2.id}`)).statusCode, 404); // not visible: indistinguishable from absent
  assert.equal((await t1.del(`/users/${P1.id}`)).statusCode, 204);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM qpvii_results').get()!.n, 0);

  const m = client(app, await login(app, 'manager'));
  assert.equal((await m.del(`/users/${P2.id}`)).statusCode, 403); // visible, but managers do not administer accounts

  const s = client(app, await login(app, 'super'));
  assert.equal((await s.del(`/users/${S.id}`)).statusCode, 403);
});

test('reset-password returns a working temporary password and logs the patient out', async () => {
  const { app, P1 } = await world();
  const patientCookie = await login(app, 'pac1');
  const res = await client(app, await login(app, 'ter1')).post(`/users/${P1.id}/reset-password`);
  assert.equal(res.statusCode, 200);
  const { temporaryPassword } = res.json();
  assert.equal(temporaryPassword.length, 10);

  assert.equal((await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie: patientCookie } })).statusCode, 401);
  await login(app, 'pac1', temporaryPassword);
});

test('PATCH /users/:id edits only your own preferences', async () => {
  const { app, P1 } = await world();
  const p1 = client(app, await login(app, 'pac1'));
  const ok = await p1.patch(`/users/${P1.id}`, { assistantName: 'Aina', sentFollowUps: ['week1'] });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.json().user.assistantName, 'Aina');
  assert.deepEqual(ok.json().user.sentFollowUps, ['week1']);

  assert.equal((await p1.patch(`/users/${P1.id}`, { role: 'superadmin' })).statusCode, 400);
  assert.equal((await p1.patch(`/users/${P1.id}`, { therapistId: 'x' })).statusCode, 400);

  const t1 = client(app, await login(app, 'ter1'));
  assert.equal((await t1.patch(`/users/${P1.id}`, { assistantName: 'X' })).statusCode, 403);
});

test('toggles: staff for users they see, patients only for themselves', async () => {
  const { app, P1, P2 } = await world();
  const t1 = client(app, await login(app, 'ter1'));
  const res = await t1.post(`/users/${P1.id}/toggle-notifications`);
  assert.equal(res.json().user.notificationPreferences.enabled, false); // default was enabled
  assert.equal((await t1.post(`/users/${P2.id}/toggle-notifications`)).statusCode, 404);

  const p1 = client(app, await login(app, 'pac1'));
  await p1.post('/me/onboarding/patient/complete');
  assert.deepEqual((await p1.get('/auth/me')).json().user.onboardingCompleted, ['patient']);

  // Disabling then re-enabling onboarding lets the tour run again.
  await t1.post(`/users/${P1.id}/toggle-onboarding`);
  const back = await t1.post(`/users/${P1.id}/toggle-onboarding`);
  assert.equal(back.json().user.onboardingEnabled, true);
  assert.deepEqual(back.json().user.onboardingCompleted, []);
});
