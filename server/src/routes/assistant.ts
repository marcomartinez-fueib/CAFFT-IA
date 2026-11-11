import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../app.ts';
import { hasCurrentTreatmentConsent } from '../consents.ts';
import type { AiProvider } from '../ai/provider.ts';
import * as S from '../schemas.ts';

/**
 * The AI assistant's conversation. The app sends the instructions and the
 * conversation without identifiers (no username, email or ids; therapists'
 * patients by their pseudonymous code); the API asks the model, passes the
 * reply on as it is written, and stores the question and answer for the
 * therapist (ai_consultations).
 */
/** Messages of the conversation sent to the model (the last ones). */
const MAX_HISTORY = 20;

export async function assistantRoutes(app: FastifyInstance, opts: { provider: AiProvider | null }): Promise<void> {
  const { db } = app;
  app.addHook('preHandler', requireAuth);

  app.post<{ Body: { system: string; messages: { role: 'user' | 'model'; text: string }[] } }>(
    '/chat',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute', keyGenerator: (req) => req.user?.id ?? req.ip } },
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['system', 'messages'],
          properties: {
            system: S.shortText(200_000),
            messages: {
              type: 'array',
              minItems: 1,
              maxItems: 60,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['role', 'text'],
                properties: { role: { enum: ['user', 'model'] }, text: S.shortText(20_000) },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      if (!opts.provider) return reply.code(503).send({ error: 'ai.disabled' });
      if (!hasCurrentTreatmentConsent(user)) return reply.code(403).send({ error: 'consent.required' });
      if (user.role !== 'patient' && user.role !== 'therapist') return reply.code(403).send({ error: 'forbidden' });
      const { system } = req.body;
      // The engine's context is shared by instructions, history and reply:
      // keep the end of the conversation.
      const messages = req.body.messages.slice(-MAX_HISTORY);
      const question = messages[messages.length - 1];
      if (question.role !== 'user') return reply.code(400).send({ error: 'ai.lastMessageNotUser' });

      // One JSON event per line, so the app learns at once that the model is
      // waking, can show it, and nginx never sees a minute of silence:
      //   {"type":"waiting"}  {"type":"text","text":"…"}  {"type":"error","code":"ai.unavailable"}
      reply.hijack();
      reply.raw.writeHead(200, {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store',
        // nginx would otherwise hold the reply until it is complete.
        'x-accel-buffering': 'no',
      });
      const send = (event: object) => reply.raw.write(`${JSON.stringify(event)}\n`);
      let answer = '';
      // Until the first words, say every 15 s that we are still waiting.
      const heartbeat = setInterval(() => answer === '' && send({ type: 'waiting' }), 15_000);
      try {
        for await (const text of opts.provider.stream({ system, messages }, { onWaiting: () => send({ type: 'waiting' }) })) {
          answer += text;
          send({ type: 'text', text });
        }
      } catch (err) {
        req.log.error({ err }, answer ? 'assistant: provider failed mid-reply' : 'assistant: provider failed');
        send({ type: 'error', code: 'ai.unavailable' });
      } finally {
        clearInterval(heartbeat);
        reply.raw.end();
      }
      if (answer) {
        db.prepare('INSERT INTO ai_consultations (id, user_id, user_role, query, response, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(
          randomUUID(),
          user.id,
          user.role,
          question.text,
          answer,
          Date.now(),
        );
      }
    },
  );
}

/** Deletes questions and answers older than the retention period, if one is set. */
export function purgeOldConsultations(db: FastifyInstance['db'], retentionDays: number | null): number {
  if (!retentionDays) return 0;
  return Number(db.prepare('DELETE FROM ai_consultations WHERE timestamp < ?').run(Date.now() - retentionDays * 24 * 60 * 60 * 1000).changes);
}
