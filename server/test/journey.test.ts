import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';
import { recordConsent } from '../src/consents.ts';
import { runReminders } from '../src/reminders.ts';
import { zonedTime } from '../src/sessionPlan.ts';

function as(app: FastifyInstance, cookie: string) {
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: object) =>
    app.inject({ method, url, headers: { cookie, origin: ORIGIN }, ...(payload ? { payload } : {}) });
}

const SCORES = { malestarGeneral: 1, subPreparatius: 2, subVicari: 3, subVol: 4, total: 10 };

async function setup() {
  const { app, db } = await makeApp();
  const T = await seedUser(db, 'therapist', 'ter');
  const P = await seedUser(db, 'patient', 'pac');
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T.id, P.id);
  return { app, db, P, patient: as(app, await login(app, 'pac')), therapist: as(app, await login(app, 'ter')) };
}

test('the QPV-II draft is kept until the questionnaire is submitted, and only the patient sees it', async () => {
  const { patient, therapist, P } = await setup();
  assert.equal((await patient('PUT', '/qpvii-draft', { answers: { 1: 3, 2: null }, startedAt: 1000 })).statusCode, 204);
  assert.equal((await patient('PUT', '/qpvii-draft', { answers: { 1: 3, 2: 5 }, startedAt: 1000 })).statusCode, 204);
  assert.deepEqual((await patient('GET', '/sync')).json().qpviiDraft.answers, { 1: 3, 2: 5 });
  assert.equal((await therapist('GET', '/sync')).json().qpviiDraft, null);
  assert.equal((await therapist('PUT', '/qpvii-draft', { answers: {}, startedAt: 1 })).statusCode, 403);

  const result = { userId: P.id, timestamp: 2000, formName: 'Pre', date: '2027-01-18', scores: SCORES, answers: { 1: 3, 2: 5 } };
  assert.equal((await patient('PUT', '/qpvii', result)).statusCode, 204);
  assert.equal((await patient('GET', '/sync')).json().qpviiDraft, null);
});

test('the welcome is marked completed once', async () => {
  const { patient } = await setup();
  const first = (await patient('POST', '/me/welcome-completed')).json().user.welcomeCompletedAt;
  assert.ok(first > 0);
  assert.equal((await patient('POST', '/me/welcome-completed')).json().user.welcomeCompletedAt, first);
});

test('the flight: the patient plans it, is asked the day after, and reports it', async () => {
  const { db, P, patient, therapist } = await setup();
  recordConsent(db, P.id, 'notifications', 'ca');
  db.prepare('UPDATE users SET notification_prefs = ? WHERE id = ?').run(JSON.stringify({ enabled: true, reminders: true }), P.id);
  // The programme is over: the session reminders stop, the flight question does not.
  db.prepare(
    `INSERT INTO exposure_progress (user_id, qpvii_timestamp, is_review, video_sequence, current_video_index, completed_video_ids,
       discomfort_ratings, explanation_shown, program_completed, review_completed, last_updated)
     VALUES (?, 1, 0, '[]', 0, '[]', '[]', 1, 1, 0, 0)`,
  ).run(P.id);

  assert.equal((await patient('PUT', '/me/flight-date', { date: '2027-03-20' })).json().user.plannedFlightDate, '2027-03-20');
  assert.equal((await patient('PUT', '/me/flight-date', { date: '20-03-2027' })).statusCode, 400);

  const at = (date: string, time: string) => zonedTime(date, time);
  assert.equal((await runReminders(db, { now: at('2027-03-20', '12:00'), appUrl: 'https://x/cafft/' })).flight, 0); // the day itself
  assert.equal((await runReminders(db, { now: at('2027-03-21', '12:00'), appUrl: 'https://x/cafft/' })).flight, 1);
  assert.equal((await runReminders(db, { now: at('2027-03-22', '12:00'), appUrl: 'https://x/cafft/' })).flight, 0); // once
  const mail = db.prepare("SELECT subject, body FROM outbound_mail WHERE kind = 'reminder'").get() as { subject: string; body: string };
  assert.equal(mail.subject, 'CAFFT: com ha anat el vol?');
  assert.match(mail.body, /https:\/\/x\/cafft\/#\/flight-report/);

  const report = { flew: true, flightDate: '2027-03-20', maxAnxiety: 4, comment: 'Millor del que esperava' };
  assert.equal((await patient('PUT', '/flight-report', report)).statusCode, 204);
  assert.equal((await patient('PUT', '/flight-report', { ...report, maxAnxiety: 10 })).statusCode, 400);
  assert.deepEqual((await therapist('GET', '/sync')).json().flightReports.map(({ updatedAt, ...r }: { updatedAt: number }) => r), [{ userId: P.id, ...report }]);
});

test('the welcome email goes in the language chosen at registration', async () => {
  const { app, db } = await makeApp();
  await seedUser(db, 'therapist', 'ter');
  const therapist = as(app, await login(app, 'ter'));
  const res = await therapist('POST', '/users', { role: 'patient', username: 'nou', email: 'nou@example.test', language: 'es' });
  assert.equal(res.json().user.language, 'es');
  const mail = db.prepare('SELECT subject, body FROM outbound_mail').get() as { subject: string; body: string };
  assert.equal(mail.subject, 'Bienvenido/a al CAFFT');
  assert.match(mail.body, /La persona que le acompañará en el programa es ter/);
});

test('the funnel: one pseudonymised row per patient with each step', async () => {
  const { db, P, patient, therapist } = await setup();
  const code = (db.prepare('SELECT patient_code FROM users WHERE id = ?').get(P.id) as { patient_code: string }).patient_code;
  await patient('POST', '/me/welcome-completed');
  await patient('PUT', '/session-plan', { slots: [{ day: 1, time: '18:00' }] });
  await patient('PUT', '/qpvii', { userId: P.id, timestamp: Date.now(), formName: 'Pre', date: '2027-01-18', scores: SCORES, answers: {} });
  const day = 24 * 60 * 60 * 1000;
  const insert = db.prepare("INSERT INTO exposure_sessions (id, user_id, qpvii_timestamp, is_review, started_at, last_activity_at) VALUES (?, ?, 1, 0, ?, ?)");
  const t0 = Date.now();
  for (const [i, at] of [t0, t0 + day, t0 + 5 * day].entries()) insert.run(`s${i}`, P.id, at, at);

  assert.equal((await patient('GET', '/funnel')).statusCode, 403);
  const [row] = (await therapist('GET', '/funnel')).json().rows;
  assert.equal(row.patient_code, code);
  assert.equal(JSON.stringify(row).includes(P.id) || JSON.stringify(row).includes('pac'), false);
  assert.equal(row.account_activated, 'yes');
  assert.equal(row.welcome_completed, 'yes');
  assert.equal(row.planned_at_welcome, 'yes');
  assert.equal(row.sessions, 3);
  assert.equal(row.sessions_within_2_days_of_previous_pct, 50);
  assert.equal(row.first_session_within_7_days, 'yes');
  assert.equal(row.hierarchy_completed, 'no');
  assert.ok(db.prepare("SELECT 1 FROM audit_log WHERE action = 'clinical.export'").get());
});
