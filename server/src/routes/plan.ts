import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../app.ts';
import { hasCurrentTreatmentConsent, withdrawNotificationConsent } from '../consents.ts';
import { audit } from '../audit.ts';
import { normalizeSlots, type PlanSlot } from '../sessionPlan.ts';
import { pushTo, type PushSender } from '../reminders.ts';
import type { UserRow } from '../users.ts';

const FORBIDDEN = { error: 'forbidden' };
const CONSENT_REQUIRED = { error: 'consent.required' };

const slotsSchema = {
  type: 'array',
  minItems: 1,
  maxItems: 7,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['day', 'time'],
    properties: { day: { type: 'integer', minimum: 0, maximum: 6 }, time: { type: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' } },
  },
} as const;

/** The patient's own session plan and push subscriptions. */
export async function planRoutes(app: FastifyInstance, opts: { push: PushSender | null }): Promise<void> {
  const { db, config } = app;
  app.addHook('preHandler', requireAuth);

  app.put<{ Body: { slots: PlanSlot[] } }>(
    '/session-plan',
    { schema: { body: { type: 'object', additionalProperties: false, required: ['slots'], properties: { slots: slotsSchema } } } },
    async (req, reply) => {
      const user = req.user!;
      if (user.role !== 'patient') return reply.code(403).send(FORBIDDEN);
      if (!hasCurrentTreatmentConsent(user)) return reply.code(403).send(CONSENT_REQUIRED);
      const slots = normalizeSlots(req.body.slots);
      if (!slots) return reply.code(400).send({ error: 'plan.invalid' });
      const now = Date.now();
      db.prepare(
        `INSERT INTO session_plans (user_id, slots, created_at, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET slots = excluded.slots, updated_at = excluded.updated_at`,
      ).run(user.id, JSON.stringify(slots), now, now);
      return { plan: { userId: user.id, slots, updatedAt: now } };
    },
  );

  app.delete('/session-plan', async (req, reply) => {
    db.prepare('DELETE FROM session_plans WHERE user_id = ?').run(req.user!.id);
    return reply.code(204).send();
  });

  // The browser needs the public VAPID key to subscribe; 404 while push is off.
  app.get('/push/key', async (_req, reply) => {
    if (!config.reminders.push) return reply.code(404).send({ error: 'push.disabled' });
    return { publicKey: config.reminders.push.publicKey };
  });

  app.put<{ Body: { endpoint: string; keys: { p256dh: string; auth: string } } }>(
    '/push/subscription',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['endpoint', 'keys'],
          properties: {
            endpoint: { type: 'string', pattern: '^https://', maxLength: 1000 },
            keys: {
              type: 'object',
              additionalProperties: false,
              required: ['p256dh', 'auth'],
              properties: { p256dh: { type: 'string', maxLength: 200 }, auth: { type: 'string', maxLength: 100 } },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      if (user.role !== 'patient') return reply.code(403).send(FORBIDDEN);
      const { endpoint, keys } = req.body;
      // A browser belongs to whoever subscribed it last.
      db.prepare(
        `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
      ).run(endpoint, user.id, keys.p256dh, keys.auth, Date.now());
      return reply.code(204).send();
    },
  );

  app.delete<{ Body: { endpoint: string } }>(
    '/push/subscription',
    { schema: { body: { type: 'object', additionalProperties: false, required: ['endpoint'], properties: { endpoint: { type: 'string', maxLength: 1000 } } } } },
    async (req, reply) => {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?').run(req.body.endpoint, req.user!.id);
      return reply.code(204).send();
    },
  );

  // «Send me a test notification» in the profile, to see that it arrives.
  app.post('/push/test', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (!opts.push) return reply.code(404).send({ error: 'push.disabled' });
    const lang = (req.headers['accept-language'] ?? '').slice(0, 2);
    const body = { ca: 'Les notificacions del CAFFT funcionen.', es: 'Las notificaciones del CAFFT funcionan.', en: 'CAFFT notifications are working.' }[lang] ?? 'Les notificacions del CAFFT funcionen.';
    await pushTo(db, opts.push, req.user!.id, { title: 'CAFFT', body, url: config.appUrl });
    return reply.code(204).send();
  });
}

/** The «turn reminders off» link of every reminder email: no login, the token is the key. */
export async function reminderLinkRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app;
  app.post<{ Body: { token: string } }>(
    '/reminders/off',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: { body: { type: 'object', additionalProperties: false, required: ['token'], properties: { token: { type: 'string', minLength: 20, maxLength: 64 } } } },
    },
    async (req, reply) => {
      const user = db.prepare('SELECT * FROM users WHERE unsubscribe_token = ?').get(req.body.token) as unknown as UserRow | undefined;
      if (!user) return reply.code(404).send({ error: 'notFound' });
      withdrawNotificationConsent(db, user.id, user.notification_prefs);
      db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(user.id);
      audit(db, { actorId: user.id, action: 'consent.withdraw.notifications', targetId: user.id, ip: req.ip, detail: { via: 'email link' } });
      return { ok: true };
    },
  );
}
