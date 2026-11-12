import { test } from 'node:test';
import assert from 'node:assert/strict';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';
import { recordConsent, withdrawNotificationConsent } from '../src/consents.ts';
import { runReminders, type PushSender } from '../src/reminders.ts';
import { zonedTime } from '../src/sessionPlan.ts';
import type { Db } from '../src/db.ts';

const APP = 'https://pausat.uib.es/cafft/';
const PREFS = JSON.stringify({ enabled: true, reminders: true, newTasks: true, followUp: true, general: true, frequency: 'daily', startTime: '09:00', endTime: '21:00' });
// Monday 18 January 2027, in Madrid.
const at = (time: string, date = '2027-01-18') => zonedTime(date, time);

async function setup() {
  const { app, db } = await makeApp({ pushSender: null });
  const P = await seedUser(db, 'patient', 'pac');
  recordConsent(db, P.id, 'notifications', 'ca');
  db.prepare('UPDATE users SET notification_prefs = ? WHERE id = ?').run(PREFS, P.id);
  // Monday and Thursday at 18:00.
  db.prepare('INSERT INTO session_plans (user_id, slots, created_at, updated_at) VALUES (?, ?, 0, 0)').run(
    P.id,
    JSON.stringify([{ day: 1, time: '18:00' }, { day: 4, time: '18:00' }]),
  );
  return { app, db, P };
}

const outbox = (db: Db) => db.prepare("SELECT to_address, subject, body FROM outbound_mail WHERE kind = 'reminder' ORDER BY id").all() as { to_address: string; subject: string; body: string }[];

function session(db: Db, userId: string, when: number) {
  db.prepare("INSERT INTO exposure_sessions (id, user_id, qpvii_timestamp, is_review, started_at, last_activity_at) VALUES (?, ?, 1, 0, ?, ?)").run(
    `s${when}`, userId, when, when,
  );
}

test('the session reminder goes two hours before, once, without clinical data', async () => {
  const { db, P } = await setup();
  assert.deepEqual(await runReminders(db, { now: at('15:55'), appUrl: APP }), { session: 0, inactivity: 0, flight: 0 });
  assert.deepEqual(await runReminders(db, { now: at('16:00'), appUrl: APP }), { session: 1, inactivity: 0, flight: 0 });
  assert.deepEqual(await runReminders(db, { now: at('16:05'), appUrl: APP }), { session: 0, inactivity: 0, flight: 0 });

  const [mail] = outbox(db);
  assert.equal(mail.to_address, P.email);
  assert.equal(mail.subject, 'CAFFT: té una sessió avui a les 18:00');
  assert.match(mail.body, /Té programada una sessió del CAFFT avui a les 18:00/);
  assert.match(mail.body, /#\/reminders-off\/[\w-]{20,}/);
  assert.doesNotMatch(mail.body, /QPV|malestar|ansietat/i);
  // The therapist sees it in the patient's history.
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM emails WHERE patient_id = ? AND type = 'reminder'").get(P.id) as { n: number }).n, 1);
});

test('no session reminder after a session that day, on other days, or once the session has started', async () => {
  const { db, P } = await setup();
  assert.equal((await runReminders(db, { now: at('18:30'), appUrl: APP })).session, 0); // too late
  assert.equal((await runReminders(db, { now: at('16:00', '2027-01-19'), appUrl: APP })).session, 0); // Tuesday
  session(db, P.id, at('09:00', '2027-01-21'));
  assert.equal((await runReminders(db, { now: at('16:00', '2027-01-21'), appUrl: APP })).session, 0); // already done
});

test('nothing without the notification consent, with reminders off, or after the programme', async () => {
  const { db, P } = await setup();
  withdrawNotificationConsent(db, P.id, PREFS);
  assert.equal((await runReminders(db, { now: at('16:00'), appUrl: APP })).session, 0);

  recordConsent(db, P.id, 'notifications', 'ca');
  db.prepare('UPDATE users SET notification_prefs = ? WHERE id = ?').run(JSON.stringify({ ...JSON.parse(PREFS), reminders: false }), P.id);
  assert.equal((await runReminders(db, { now: at('16:00'), appUrl: APP })).session, 0);

  // An older notification text does not count either.
  db.prepare("UPDATE users SET notification_prefs = ?, notification_consent_version = 'pre-2026-11' WHERE id = ?").run(PREFS, P.id);
  assert.equal((await runReminders(db, { now: at('16:00'), appUrl: APP })).session, 0);

  recordConsent(db, P.id, 'notifications', 'ca');
  db.prepare(
    `INSERT INTO exposure_progress (user_id, qpvii_timestamp, is_review, video_sequence, current_video_index, completed_video_ids,
       discomfort_ratings, explanation_shown, program_completed, review_completed, last_updated)
     VALUES (?, 1, 0, '[]', 0, '[]', '[]', 1, 1, 0, 0)`,
  ).run(P.id);
  assert.equal((await runReminders(db, { now: at('16:00'), appUrl: APP })).session, 0);
});

test('the inactivity reminder: after two days without a session, in the daytime, every two days at most', async () => {
  const { db, P } = await setup();
  db.prepare('DELETE FROM session_plans').run();
  assert.equal((await runReminders(db, { now: at('12:00'), appUrl: APP })).inactivity, 0); // never started

  session(db, P.id, at('18:00', '2027-01-15'));
  assert.equal((await runReminders(db, { now: at('12:00', '2027-01-17'), appUrl: APP })).inactivity, 0); // < 2 days
  assert.equal((await runReminders(db, { now: at('09:00', '2027-01-18'), appUrl: APP })).inactivity, 0); // too early
  assert.equal((await runReminders(db, { now: at('10:00', '2027-01-18'), appUrl: APP })).inactivity, 1);
  assert.equal((await runReminders(db, { now: at('12:00', '2027-01-19'), appUrl: APP })).inactivity, 0); // < 2 days since
  assert.equal((await runReminders(db, { now: at('10:00', '2027-01-20'), appUrl: APP })).inactivity, 1);
  assert.match(outbox(db)[0].subject, /quan li vagi bé/);
});

test('a planned day speaks of the session, not of the days without one', async () => {
  const { db, P } = await setup();
  session(db, P.id, at('18:00', '2027-01-14'));
  assert.deepEqual(await runReminders(db, { now: at('12:00'), appUrl: APP }), { session: 0, inactivity: 0, flight: 0 });
  assert.deepEqual(await runReminders(db, { now: at('16:00'), appUrl: APP }), { session: 1, inactivity: 0, flight: 0 });
});

test('reminders also go by push; a subscription the browser dropped is deleted', async () => {
  const { db, P } = await setup();
  const insert = db.prepare('INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, 0)');
  insert.run('https://push.example/a', P.id, 'k', 'a');
  insert.run('https://push.example/gone', P.id, 'k', 'a');
  const received: { endpoint: string; body: string }[] = [];
  const push: PushSender = {
    async send(sub, message) {
      received.push({ endpoint: sub.endpoint, body: message.body });
      return sub.endpoint.endsWith('gone') ? 'gone' : 'ok';
    },
  };
  await runReminders(db, { now: at('16:00'), appUrl: APP, push });
  assert.deepEqual(received.map((r) => r.body), ['Té programada una sessió del CAFFT avui a les 18:00.', 'Té programada una sessió del CAFFT avui a les 18:00.']);
  assert.deepEqual(db.prepare('SELECT endpoint FROM push_subscriptions').all().map((r) => (r as { endpoint: string }).endpoint), ['https://push.example/a']);
});

test('the link in the email turns reminders off without logging in', async () => {
  const { app, db, P } = await setup();
  await runReminders(db, { now: at('16:00'), appUrl: APP });
  const token = outbox(db)[0].body.match(/reminders-off\/([\w-]+)/)![1];
  const off = (t: string) => app.inject({ method: 'POST', url: '/reminders/off', headers: { origin: ORIGIN }, payload: { token: t } });

  assert.equal((await off('x'.repeat(32))).statusCode, 404);
  assert.equal((await off(token)).statusCode, 200);
  assert.ok((db.prepare("SELECT withdrawn_at FROM consents WHERE user_id = ? AND kind = 'notifications'").get(P.id) as { withdrawn_at: number }).withdrawn_at > 0);
  assert.equal((await runReminders(db, { now: at('16:00', '2027-01-21'), appUrl: APP })).session, 0);
});

test('the patient saves a plan, which only they write and their therapist sees', async () => {
  const { app, db, P } = await setup();
  const T = await seedUser(db, 'therapist', 'ter');
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T.id, P.id);
  const as = (cookie: string) => (method: 'PUT' | 'GET', url: string, payload?: object) =>
    app.inject({ method, url, headers: { cookie, origin: ORIGIN }, ...(payload ? { payload } : {}) });
  const patient = as(await login(app, 'pac'));
  const therapist = as(await login(app, 'ter'));

  const res = await patient('PUT', '/session-plan', { slots: [{ day: 4, time: '19:30' }, { day: 2, time: '10:00' }] });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json().plan.slots, [{ day: 2, time: '10:00' }, { day: 4, time: '19:30' }]);
  assert.equal((await patient('PUT', '/session-plan', { slots: [{ day: 2, time: '25:00' }] })).statusCode, 400);
  assert.equal((await patient('PUT', '/session-plan', { slots: [{ day: 2, time: '10:00' }, { day: 2, time: '11:00' }] })).statusCode, 400);
  assert.equal((await therapist('PUT', '/session-plan', { slots: [{ day: 2, time: '10:00' }] })).statusCode, 403);
  assert.deepEqual((await therapist('GET', '/sync')).json().sessionPlans[0].slots, [{ day: 2, time: '10:00' }, { day: 4, time: '19:30' }]);
});
