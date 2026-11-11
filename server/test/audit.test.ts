import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { auditCsv } from '../src/auditExport.ts';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';

function as(app: FastifyInstance, cookie: string) {
  return (method: 'GET' | 'POST', url: string, payload?: object) =>
    app.inject({ method, url, headers: { cookie, origin: ORIGIN }, ...(payload ? { payload } : {}) });
}

test('staff access to clinical data is recorded, a patient reading their own is not', async () => {
  const { app, db } = await makeApp();
  const T = await seedUser(db, 'therapist', 'ter');
  const P = await seedUser(db, 'patient', 'pac');
  const Q = await seedUser(db, 'patient', 'altre');
  db.prepare('UPDATE users SET therapist_id = ? WHERE id = ?').run(T.id, P.id);
  const therapist = as(app, await login(app, 'ter'));
  const patient = as(app, await login(app, 'pac'));

  await therapist('GET', '/sync');
  await patient('GET', '/sync');
  assert.equal((await therapist('POST', '/audit/access', { action: 'clinical.view', patientIds: [P.id] })).statusCode, 204);
  assert.equal((await therapist('POST', '/audit/access', { action: 'clinical.export', patientIds: [P.id] })).statusCode, 204);
  // Not their patient, and patients cannot write to the log.
  assert.equal((await therapist('POST', '/audit/access', { action: 'clinical.view', patientIds: [Q.id] })).statusCode, 404);
  assert.equal((await patient('POST', '/audit/access', { action: 'clinical.view', patientIds: [P.id] })).statusCode, 403);

  const rows = db.prepare("SELECT actor_id, action, detail FROM audit_log WHERE action LIKE 'clinical.%' ORDER BY id").all().map((r) => ({ ...r }));
  assert.deepEqual(rows, [
    { actor_id: T.id, action: 'clinical.read', detail: JSON.stringify({ patients: [P.id] }) },
    { actor_id: T.id, action: 'clinical.view', detail: JSON.stringify({ patients: [P.id] }) },
    { actor_id: T.id, action: 'clinical.export', detail: JSON.stringify({ patients: [P.id] }) },
  ]);

  const csv = auditCsv(db, 0).trim().split('\n');
  assert.equal(csv[0], 'data_utc,usuari,rol,accio,sobre,ip,pacients');
  assert.ok(csv.some((l) => /,ter,therapist,clinical\.view,,[^,]*,pac$/.test(l)), csv.join('\n'));
});
