import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';

function as(app: FastifyInstance, cookie: string) {
  return (method: 'GET' | 'POST' | 'PUT', url: string, payload?: object) =>
    app.inject({ method, url, headers: { cookie, origin: ORIGIN }, ...(payload ? { payload } : {}) });
}

const SCORES = { malestarGeneral: 1, subPreparatius: 2, subVicari: 3, subVol: 4, total: 10 };

async function setup() {
  const { app, db } = await makeApp();
  const T = await seedUser(db, 'therapist', 'ter');
  const P = await seedUser(db, 'patient', 'pac');
  const Q = await seedUser(db, 'patient', 'altre');
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T.id, P.id);
  return { app, db, T, P, Q, patient: as(app, await login(app, 'pac')), therapist: as(app, await login(app, 'ter')) };
}

test('QPV-II upsert is idempotent and stamps the assessment date', async () => {
  const { patient, P } = await setup();
  const result = { userId: P.id, timestamp: 1_700_000_000_000, formName: 'Pre', date: '2026-10-07', scores: SCORES, answers: { 1: 3, 2: null } };

  assert.equal((await patient('PUT', '/qpvii', result)).statusCode, 204);
  assert.equal((await patient('PUT', '/qpvii', result)).statusCode, 204); // retry

  const sync = (await patient('GET', '/sync')).json();
  assert.equal(sync.qpvii.length, 1);
  assert.deepEqual(sync.qpvii[0].answers, { 1: 3, 2: null });
  assert.equal(sync.qpvii[0].evaluationType, 'pre');
  assert.equal(sync.users[0].lastAssessmentDate, result.timestamp);
});

test('only the patient writes their clinical data', async () => {
  const { therapist, patient, P, Q } = await setup();
  const result = { userId: P.id, timestamp: 1, formName: 'x', date: 'x', scores: SCORES, answers: {} };
  assert.equal((await therapist('PUT', '/qpvii', result)).statusCode, 403);
  assert.equal((await patient('PUT', '/qpvii', { ...result, userId: Q.id })).statusCode, 403);
  assert.equal((await patient('PUT', '/qpvii', { ...result, scores: { total: 'lots' } })).statusCode, 400);
});

test('exposure progress upserts, including the null-timestamp record', async () => {
  const { patient, P } = await setup();
  const base = {
    userId: P.id,
    qpviiTimestamp: 42,
    videoSequence: ['ev001', 'ev002'],
    currentVideoIndex: 0,
    completedVideoIds: [],
    discomfortRatings: [],
    explanationShown: false,
    programCompleted: false,
    isReview: false,
    reviewCompleted: false,
    lastUpdated: 1000,
  };
  await patient('PUT', '/exposure', base);
  await patient('PUT', '/exposure', {
    ...base,
    currentVideoIndex: 1,
    completedVideoIds: ['ev001'],
    discomfortRatings: [{ id: 'ev001', rating: 2, qpviiTimestamp: 42, videoTimestamp: 1100 }],
    lastUpdated: 1100,
  });
  await patient('PUT', '/exposure', { ...base, qpviiTimestamp: null });
  await patient('PUT', '/exposure', { ...base, qpviiTimestamp: null, currentVideoIndex: 1 });

  const progress = (await patient('GET', '/sync')).json().progress;
  assert.equal(progress.length, 2);
  const main = progress.find((p: { qpviiTimestamp: number | null }) => p.qpviiTimestamp === 42);
  assert.equal(main.currentVideoIndex, 1);
  assert.deepEqual(main.completedVideoIds, ['ev001']);
  assert.equal(main.discomfortRatings[0].rating, 2);
  assert.equal(progress.find((p: { qpviiTimestamp: number | null }) => p.qpviiTimestamp === null).currentVideoIndex, 1);
});

test('emails: therapist for own patients; a sent reminder stamps the patient', async () => {
  const { therapist, patient, P, Q } = await setup();
  const email = { id: 'e1', patientId: P.id, type: 'reminder', subject: 's', body: 'b', status: 'sent', timestamp: 5000 };
  assert.equal((await therapist('POST', '/emails', email)).statusCode, 204);
  assert.equal((await therapist('POST', '/emails', { ...email, id: 'e2', patientId: Q.id })).statusCode, 404);

  const sync = (await patient('GET', '/sync')).json();
  assert.equal(sync.emails.length, 1);
  assert.equal(sync.users[0].lastReminderSentDate, 5000);
});

test('inactivity reminders go to inactive patients once per gap', async () => {
  const { therapist, db, P } = await setup();
  const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
  db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(tenDaysAgo, P.id);

  const body = { thresholdDays: 5, subject: 'Hola', bodyTemplate: 'Hola {username}' };
  assert.deepEqual((await therapist('POST', '/reminders/inactivity', body)).json().sent, [P.id]);
  assert.deepEqual((await therapist('POST', '/reminders/inactivity', body)).json().sent, []);
  assert.equal(db.prepare('SELECT body FROM emails').get()!.body, 'Hola pac');
});

test('AI consultations: own only, retries ignored, username from the account', async () => {
  const { patient, therapist, P } = await setup();
  const c = { id: 'c1', userId: P.id, userName: 'spoofed', userRole: 'therapist', query: 'q', response: 'r', timestamp: 1 };
  assert.equal((await patient('POST', '/ai-consultations', c)).statusCode, 204);
  assert.equal((await patient('POST', '/ai-consultations', c)).statusCode, 204);
  assert.equal((await therapist('POST', '/ai-consultations', { ...c, id: 'c2' })).statusCode, 403);

  const [stored] = (await therapist('GET', '/sync')).json().consultations;
  assert.deepEqual([stored.userName, stored.userRole], ['pac', 'patient']);
});

test('feedback is public and identity comes from the session', async () => {
  const { app, patient } = await setup();
  const guest = await app.inject({
    method: 'POST',
    url: '/feedback',
    headers: { origin: ORIGIN },
    payload: { id: 'f1', username: 'Anònim', type: 'testimonial', rating: 5, comment: 'Molt bé' },
  });
  assert.equal(guest.statusCode, 204);
  await patient('POST', '/feedback', { id: 'f2', username: 'someone-else', type: 'testimonial', rating: 4, comment: 'Bé' });

  const list = (await app.inject({ method: 'GET', url: '/feedback/testimonials' })).json().testimonials;
  assert.deepEqual(
    list.map((t: { username: string; userType: string }) => [t.username, t.userType]).sort(),
    [['Anònim', 'guest'], ['pac', 'patient']],
  );
});

test('data routes require a session', async () => {
  const { app } = await makeApp();
  assert.equal((await app.inject({ method: 'GET', url: '/sync' })).statusCode, 401);
  assert.equal((await app.inject({ method: 'GET', url: '/users/x' })).statusCode, 404); // no GET route; DELETE etc. are guarded
  assert.equal((await app.inject({ method: 'DELETE', url: '/users/x' })).statusCode, 401);
});
