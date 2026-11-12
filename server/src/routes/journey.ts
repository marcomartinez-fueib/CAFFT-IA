import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../app.ts';
import { hasCurrentTreatmentConsent } from '../consents.ts';
import { findUserById, toApiUser } from '../users.ts';
import * as S from '../schemas.ts';

const FORBIDDEN = { error: 'forbidden' };
const CONSENT_REQUIRED = { error: 'consent.required' };
const DATE = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } as const;

/** The patient journey (fita 5): QPV-II drafts, the welcome, and the real flight. */
export async function journeyRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app;
  app.addHook('preHandler', requireAuth);

  // Only the patient themself, with the current consent: these are clinical.
  app.addHook('preHandler', async (req, reply) => {
    if (req.user!.role !== 'patient') return reply.code(403).send(FORBIDDEN);
    if (!hasCurrentTreatmentConsent(req.user!)) return reply.code(403).send(CONSENT_REQUIRED);
  });

  // The QPV-II as it is being answered; PUT /qpvii deletes it when submitted.
  app.put<{ Body: { answers: Record<string, number | null>; startedAt: number } }>(
    '/qpvii-draft',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['answers', 'startedAt'],
          properties: {
            answers: { type: 'object', maxProperties: 64, additionalProperties: { type: ['integer', 'null'], minimum: 0, maximum: 100 } },
            startedAt: S.timestamp,
          },
        },
      },
    },
    async (req, reply) => {
      db.prepare(
        `INSERT INTO qpvii_drafts (user_id, answers, started_at, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET answers = excluded.answers, updated_at = excluded.updated_at`,
      ).run(req.user!.id, JSON.stringify(req.body.answers), req.body.startedAt, Date.now());
      return reply.code(204).send();
    },
  );

  app.delete('/qpvii-draft', async (req, reply) => {
    db.prepare('DELETE FROM qpvii_drafts WHERE user_id = ?').run(req.user!.id);
    return reply.code(204).send();
  });

  app.post('/me/welcome-completed', async (req) => {
    db.prepare('UPDATE users SET welcome_completed_at = COALESCE(welcome_completed_at, ?), updated_at = ? WHERE id = ?').run(Date.now(), Date.now(), req.user!.id);
    return { user: toApiUser(findUserById(db, req.user!.id)!) };
  });

  // When they expect to fly: the day after, they are asked how it went.
  app.put<{ Body: { date: string | null } }>(
    '/me/flight-date',
    { schema: { body: { type: 'object', additionalProperties: false, required: ['date'], properties: { date: { anyOf: [DATE, { type: 'null' }] } } } } },
    async (req) => {
      db.prepare('UPDATE users SET planned_flight_date = ?, updated_at = ? WHERE id = ?').run(req.body.date, Date.now(), req.user!.id);
      return { user: toApiUser(findUserById(db, req.user!.id)!) };
    },
  );

  app.put<{ Body: { flew: boolean; flightDate?: string; maxAnxiety?: number; comment?: string } }>(
    '/flight-report',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['flew'],
          properties: {
            flew: { type: 'boolean' },
            flightDate: DATE,
            maxAnxiety: { type: 'integer', minimum: 1, maximum: 9 },
            comment: S.shortText(4000),
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      const now = Date.now();
      db.prepare(
        `INSERT INTO flight_reports (user_id, flew, flight_date, max_anxiety, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET flew = excluded.flew, flight_date = excluded.flight_date, max_anxiety = excluded.max_anxiety,
           comment = excluded.comment, updated_at = excluded.updated_at`,
      ).run(req.user!.id, b.flew ? 1 : 0, b.flightDate ?? null, b.maxAnxiety ?? null, b.comment ?? null, now, now);
      return reply.code(204).send();
    },
  );
}
