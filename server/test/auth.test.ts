import { test } from 'node:test';
import assert from 'node:assert/strict';
import { login, makeApp, ORIGIN, seedUser, sessionCookie } from './helpers.ts';

test('login sets an HttpOnly, Strict session cookie and never returns the hash', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'therapist', 'terapeuta1');

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { origin: ORIGIN },
    payload: { username: 'TERAPEUTA1', password: 'correct-horse' }, // usernames are case-insensitive
  });

  assert.equal(res.statusCode, 200);
  const cookie = res.cookies.find((c) => c.name === 'cafft_session')!;
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, 'Strict');
  assert.equal(cookie.path, '/cafft');
  assert.equal(cookie.secure, true);

  const body = res.json();
  assert.equal(body.user.role, 'therapist');
  assert.ok(body.user.lastLoginDate);
  assert.ok(!JSON.stringify(body).includes('scrypt'));
});

test('wrong password and unknown user give the same 401', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'patient', 'pacient1');

  for (const username of ['pacient1', 'nobody']) {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      headers: { origin: ORIGIN },
      payload: { username, password: 'wrong-password' },
    });
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.json(), { error: 'auth.invalidCredentialsError' });
  }
});

test('an account locks after 5 failures, even with the right password', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'patient', 'lockme');

  const attempt = (password: string) =>
    app.inject({ method: 'POST', url: '/auth/login', headers: { origin: ORIGIN }, payload: { username: 'lockme', password } });

  for (let i = 0; i < 5; i++) assert.equal((await attempt('nope')).statusCode, 401);
  const res = await attempt('correct-horse');
  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.json(), { error: 'auth.tooManyAttemptsError' });
});

test('/auth/me and /auth/check follow the session; logout revokes it', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'patient', 'pacient2');

  assert.equal((await app.inject({ method: 'GET', url: '/auth/me' })).statusCode, 401);
  assert.equal((await app.inject({ method: 'GET', url: '/auth/check' })).statusCode, 401);

  const cookie = await login(app, 'pacient2');
  const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.username, 'pacient2');
  assert.match(me.json().user.patientCode, /^P-[A-Z2-9]{6}$/);
  assert.equal((await app.inject({ method: 'GET', url: '/auth/check', headers: { cookie } })).statusCode, 204);

  const out = await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie, origin: ORIGIN } });
  assert.equal(out.statusCode, 204);
  assert.equal((await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } })).statusCode, 401);
});

test('state-changing requests with a session must come from the app origin', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'patient', 'pacient3');
  const cookie = await login(app, 'pacient3');

  const foreign = await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie, origin: 'https://evil.example' } });
  assert.equal(foreign.statusCode, 403);
  const missing = await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie } });
  assert.equal(missing.statusCode, 403);

  // The session survived both attempts.
  assert.equal((await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } })).statusCode, 200);
});

test('register creates a patient, rejects duplicates, and requires consent', async () => {
  const { app } = await makeApp();
  const register = (payload: object) =>
    app.inject({ method: 'POST', url: '/auth/register', headers: { origin: ORIGIN }, payload });

  const ok = await register({ username: 'nou', email: 'nou@example.test', password: 'llarga-prou', consent: true });
  assert.equal(ok.statusCode, 201);
  assert.equal(ok.json().user.role, 'patient');

  const dupUser = await register({ username: 'NOU', email: 'altre@example.test', password: 'llarga-prou', consent: true });
  assert.deepEqual([dupUser.statusCode, dupUser.json().error], [409, 'auth.usernameTakenError']);
  const dupEmail = await register({ username: 'altre', email: 'NOU@example.test', password: 'llarga-prou', consent: true });
  assert.deepEqual([dupEmail.statusCode, dupEmail.json().error], [409, 'auth.emailTakenError']);

  const noConsent = await register({ username: 'x1x', email: 'x@example.test', password: 'llarga-prou', consent: false });
  assert.equal(noConsent.json().error, 'auth.consentRequiredError');
  const short = await register({ username: 'x2x', email: 'y@example.test', password: 'curta', consent: true });
  assert.equal(short.json().error, 'auth.passwordMinLengthError');

  // Clients cannot pick their own role.
  const role = await register({ username: 'x3x', email: 'z@example.test', password: 'llarga-prou', consent: true, role: 'superadmin' });
  assert.equal(role.statusCode, 400);

  const badEmail = await register({ username: 'x4x', email: 'no-es-un-email', password: 'llarga-prou', consent: true });
  assert.equal(badEmail.statusCode, 400);
});

test('change-password requires the current one and revokes other sessions', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'patient', 'pacient4');
  const here = await login(app, 'pacient4');
  const elsewhere = await login(app, 'pacient4');

  const change = (currentPassword: string) =>
    app.inject({
      method: 'POST',
      url: '/auth/change-password',
      headers: { cookie: here, origin: ORIGIN },
      payload: { currentPassword, newPassword: 'una-de-nova' },
    });

  assert.equal((await change('wrong')).statusCode, 400);
  assert.equal((await change('correct-horse')).statusCode, 204);

  assert.equal((await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie: here } })).statusCode, 200);
  assert.equal((await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie: elsewhere } })).statusCode, 401);

  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { origin: ORIGIN },
    payload: { username: 'pacient4', password: 'una-de-nova' },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(sessionCookie(res));
});

test('every login, failure and logout is audited', async () => {
  const { app, db } = await makeApp();
  const user = await seedUser(db, 'patient', 'pacient5');
  await app.inject({ method: 'POST', url: '/auth/login', headers: { origin: ORIGIN }, payload: { username: 'pacient5', password: 'bad' } });
  const cookie = await login(app, 'pacient5');
  await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie, origin: ORIGIN } });

  const actions = db.prepare('SELECT action FROM audit_log WHERE actor_id = ? ORDER BY id').all(user.id).map((r) => r.action);
  assert.deepEqual(actions, ['login.failed', 'login', 'logout']);
});
