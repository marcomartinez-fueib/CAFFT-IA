import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrate, openDb } from '../src/db.ts';
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

test('exposure sessions: upsert by id, visible to the therapist, never change owner', async () => {
  const { patient, therapist, app, db, P, Q } = await setup();
  const session = { id: 's1', userId: P.id, qpviiTimestamp: 42, isReview: false, startedAt: 1000, lastActivityAt: 1000 };
  assert.equal((await patient('PUT', '/exposure-sessions', session)).statusCode, 204);
  assert.equal(
    (await patient('PUT', '/exposure-sessions', { ...session, lastActivityAt: 2000, endedAt: 2000, endReason: 'pause' })).statusCode,
    204,
  );
  assert.equal((await therapist('PUT', '/exposure-sessions', session)).statusCode, 403);

  const [stored] = (await therapist('GET', '/sync')).json().sessions;
  assert.deepEqual(stored, { ...session, lastActivityAt: 2000, endedAt: 2000, endReason: 'pause' });

  // Another patient reusing the id cannot overwrite it.
  const other = as(app, await login(app, 'altre'));
  assert.equal((await other('PUT', '/exposure-sessions', { ...session, userId: Q.id })).statusCode, 403);
  assert.equal((await patient('GET', '/sync')).json().sessions[0].endReason, 'pause');
});

test('migration 005 rebuilds sessions from existing ratings', async () => {
  const db = openDb(':memory:', { migrate: false });
  db.exec('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)');
  const dir = join(import.meta.dirname, '..', 'migrations');
  for (const file of readdirSync(dir).filter((f) => /^00[1-4]_/.test(f)).sort()) {
    db.exec(readFileSync(join(dir, file), 'utf8'));
    db.prepare('INSERT INTO schema_migrations VALUES (?, 0)').run(Number.parseInt(file, 10));
  }
  const P = await seedUser(db, 'patient', 'pac', undefined, { consent: false }); // no consents table before 007
  const hour = 60 * 60 * 1000;
  const rating = (at: number) => ({ id: 'ev001', rating: 5, qpviiTimestamp: 42, videoTimestamp: at });
  const insert = db.prepare(
    `INSERT INTO exposure_progress (user_id, qpvii_timestamp, is_review, video_sequence, current_video_index,
       completed_video_ids, discomfort_ratings, last_updated) VALUES (?, ?, ?, '[]', 0, '[]', ?, 0)`,
  );
  // Two sittings a day apart (the second one with its ratings stored out of order), and an empty record.
  insert.run(P.id, 42, 0, JSON.stringify([rating(1 * hour), rating(1.5 * hour), rating(30 * hour), rating(29 * hour)]));
  insert.run(P.id, 43, 1, JSON.stringify([rating(50 * hour)]));
  insert.run(P.id, 44, 0, '[]');

  migrate(db);

  const rows = db
    .prepare('SELECT qpvii_timestamp, is_review, started_at, last_activity_at, ended_at, end_reason FROM exposure_sessions ORDER BY started_at')
    .all()
    .map((r) => ({ ...r }));
  assert.deepEqual(rows, [
    { qpvii_timestamp: 42, is_review: 0, started_at: 1 * hour, last_activity_at: 1.5 * hour, ended_at: 1.5 * hour, end_reason: null },
    { qpvii_timestamp: 42, is_review: 0, started_at: 29 * hour, last_activity_at: 30 * hour, ended_at: 30 * hour, end_reason: null },
    { qpvii_timestamp: 43, is_review: 1, started_at: 50 * hour, last_activity_at: 50 * hour, ended_at: 50 * hour, end_reason: null },
  ]);
});

test('help video views: one row per video, merged across viewings, seen by the therapist', async () => {
  const { patient, therapist, P } = await setup();
  const view = (body: object) => patient('PUT', '/help-video-views', { videoId: 'P06', versionId: 'P06', ...body });

  assert.equal((await view({ at: 1000, percent: 0, completed: false, newView: true })).statusCode, 204);
  assert.equal((await view({ at: 2000, percent: 100, completed: true, newView: false })).statusCode, 204);
  // A second viewing, of the screenshot version, closed half way.
  assert.equal((await view({ versionId: 'P06c', at: 3000, percent: 0, completed: false, newView: true })).statusCode, 204);
  assert.equal((await view({ versionId: 'P06c', at: 4000, percent: 50, completed: false, newView: false })).statusCode, 204);

  const [stored] = (await therapist('GET', '/sync')).json().helpVideoViews;
  assert.deepEqual(stored, {
    userId: P.id, videoId: 'P06', versionId: 'P06c', firstAt: 1000, lastAt: 4000,
    views: 2, maxPercent: 100, completedAt: 2000, closedEarly: true,
  });

  // Only a patient records their own viewings, of a version of that video.
  assert.equal((await therapist('PUT', '/help-video-views', { videoId: 'T01', versionId: 'T01', at: 1, percent: 0, completed: false, newView: true })).statusCode, 403);
  assert.equal((await view({ versionId: 'P07', at: 1, percent: 0, completed: false, newView: true })).statusCode, 400);
  assert.equal((await view({ videoId: '../x', at: 1, percent: 0, completed: false, newView: true })).statusCode, 400);
  assert.equal((await view({ at: 1, percent: 101, completed: false, newView: true })).statusCode, 400);
});

test('a user chooses the version of the help videos', async () => {
  const { app, P } = await setup();
  const cookie = await login(app, 'pac');
  const patch = (payload: object) => app.inject({ method: 'PATCH', url: `/users/${P.id}`, headers: { cookie, origin: ORIGIN }, payload });
  assert.equal((await patch({ helpVideoVariant: 'captures' })).json().user.helpVideoVariant, 'captures');
  assert.equal((await patch({ helpVideoVariant: 'other' })).statusCode, 400);
});
