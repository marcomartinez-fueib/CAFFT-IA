import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp } from './helpers.ts';

test('GET /health reports ok', async () => {
  const { app } = await makeApp();
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { status: 'ok' });
});

test('migrations create every table', async () => {
  const { db } = await makeApp();
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((r) => r.name);
  for (const t of ['users', 'sessions', 'qpvii_results', 'exposure_progress', 'ai_consultations', 'emails', 'feedback', 'audit_log']) {
    assert.ok(tables.includes(t), `missing table ${t}`);
  }
});
