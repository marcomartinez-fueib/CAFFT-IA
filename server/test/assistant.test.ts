import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AiProvider, ChatMessage } from '../src/ai/provider.ts';
import { geminiProvider, readApiKey } from '../src/ai/provider.ts';
import { purgeOldConsultations } from '../src/routes/assistant.ts';
import { login, makeApp, ORIGIN, seedUser } from './helpers.ts';

function fakeProvider(reply: string[], seen: { system: string; messages: ChatMessage[] }[] = []): AiProvider {
  return {
    async *stream(request) {
      seen.push(request);
      for (const part of reply) yield part;
    },
  };
}

const conversation = { system: 'Ets l’assistent del CAFFT.', messages: [{ role: 'user', text: 'Com funciona?' }] };

test('the assistant answers through the API and records the question for the therapist', async () => {
  const seen: { system: string; messages: ChatMessage[] }[] = [];
  const { app, db } = await makeApp({ aiProvider: fakeProvider(['Hola, ', 'així.'], seen) });
  const P = await seedUser(db, 'patient', 'pac');
  const cookie = await login(app, 'pac');

  const res = await app.inject({ method: 'POST', url: '/ai/chat', headers: { cookie, origin: ORIGIN }, payload: conversation });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, 'Hola, així.');
  assert.equal(res.headers['x-accel-buffering'], 'no');
  assert.deepEqual(seen, [conversation]);

  const stored = db.prepare('SELECT user_id, user_role, query, response FROM ai_consultations').get();
  assert.deepEqual({ ...stored }, { user_id: P.id, user_role: 'patient', query: 'Com funciona?', response: 'Hola, així.' });
});

test('the assistant is refused when off, without consent, or without a session', async () => {
  const off = await makeApp({ aiProvider: null });
  await seedUser(off.db, 'patient', 'pac');
  const offCookie = await login(off.app, 'pac');
  const disabled = await off.app.inject({ method: 'POST', url: '/ai/chat', headers: { cookie: offCookie, origin: ORIGIN }, payload: conversation });
  assert.equal(disabled.statusCode, 503);
  assert.equal(disabled.json().error, 'ai.disabled');

  const on = await makeApp({ aiProvider: fakeProvider(['x']) });
  await seedUser(on.db, 'patient', 'nova', 'correct-horse', { consent: false });
  const novaCookie = await login(on.app, 'nova');
  const noConsent = await on.app.inject({ method: 'POST', url: '/ai/chat', headers: { cookie: novaCookie, origin: ORIGIN }, payload: conversation });
  assert.equal(noConsent.json().error, 'consent.required');
  assert.equal((await on.app.inject({ method: 'POST', url: '/ai/chat', headers: { origin: ORIGIN }, payload: conversation })).statusCode, 401);
});

test('a provider failure before any text is a 502 and nothing is stored', async () => {
  const failing: AiProvider = {
    // eslint-disable-next-line require-yield
    async *stream() {
      throw new Error('quota');
    },
  };
  const { app, db } = await makeApp({ aiProvider: failing });
  await seedUser(db, 'patient', 'pac');
  const cookie = await login(app, 'pac');
  const res = await app.inject({ method: 'POST', url: '/ai/chat', headers: { cookie, origin: ORIGIN }, payload: conversation });
  assert.equal(res.statusCode, 502);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ai_consultations').get()!.n, 0);
});

test('the Gemini provider sends the key server-side and reads the streamed reply', async () => {
  let sent: { url: string; init: RequestInit } | undefined;
  const sse = 'data: {"candidates":[{"content":{"parts":[{"text":"Bon"}]}}]}\n\ndata: {"candidates":[{"content":{"parts":[{"text":"dia"}]}}]}\n\n';
  const fakeFetch = (async (url: string, init: RequestInit) => {
    sent = { url, init };
    return new Response(sse, { status: 200 });
  }) as unknown as typeof fetch;
  const parts: string[] = [];
  for await (const p of geminiProvider('KEY', 'gemini-x', fakeFetch).stream(conversation as never)) parts.push(p);
  assert.deepEqual(parts, ['Bon', 'dia']);
  assert.match(sent!.url, /models\/gemini-x:streamGenerateContent\?alt=sse$/);
  assert.equal((sent!.init.headers as Record<string, string>)['x-goog-api-key'], 'KEY');
  const body = JSON.parse(String(sent!.init.body));
  assert.deepEqual(body.contents, [{ role: 'user', parts: [{ text: 'Com funciona?' }] }]);
  assert.equal(body.systemInstruction.parts[0].text, conversation.system);

  assert.equal(readApiKey('proxy_set_header X-Goog-Api-Key "AIzaABC";\n'), 'AIzaABC');
  assert.equal(readApiKey('AIzaDEF\n'), 'AIzaDEF');
});

test('questions and answers older than the retention period are deleted', async () => {
  const { db } = await makeApp();
  const P = await seedUser(db, 'patient', 'pac');
  const insert = db.prepare("INSERT INTO ai_consultations (id, user_id, user_role, query, response, timestamp) VALUES (?, ?, 'patient', 'q', 'r', ?)");
  insert.run('old', P.id, Date.now() - 40 * 24 * 60 * 60 * 1000);
  insert.run('new', P.id, Date.now());
  assert.equal(purgeOldConsultations(db, null), 0);
  assert.equal(purgeOldConsultations(db, 30), 1);
  assert.deepEqual(db.prepare('SELECT id FROM ai_consultations').all().map((r) => r.id), ['new']);
});

test('a busy model is retried and then the next one is used', async () => {
  const calls: string[] = [];
  const waits: number[] = [];
  const sse = 'data: {"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}\n\n';
  const fakeFetch = (async (url: string) => {
    const model = /models\/([^:]+):/.exec(url)![1];
    calls.push(model);
    return model === 'preview' ? new Response('busy', { status: 503 }) : new Response(sse, { status: 200 });
  }) as unknown as typeof fetch;
  const provider = geminiProvider('KEY', 'preview, stable', fakeFetch, async (ms) => { waits.push(ms); });

  const parts: string[] = [];
  for await (const p of provider.stream(conversation as never)) parts.push(p);
  assert.deepEqual(parts, ['ok']);
  assert.deepEqual(calls, ['preview', 'preview', 'preview', 'stable']);
  assert.deepEqual(waits, [1000, 3000]);
});

test('a wrong key is not retried', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    return new Response('bad key', { status: 403 });
  }) as unknown as typeof fetch;
  const provider = geminiProvider('KEY', 'a,b', fakeFetch, async () => {});
  await assert.rejects(async () => {
    for await (const _ of provider.stream(conversation as never)) void _;
  }, /\(a\) answered 403/);
  assert.equal(calls, 1);
});
