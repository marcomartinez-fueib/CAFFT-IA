import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import type { Config } from './config.ts';
import type { Db } from './db.ts';
import { resolveSession, SESSION_COOKIE } from './sessions.ts';
import type { UserRow } from './users.ts';
import { healthRoutes } from './routes/health.ts';
import { authRoutes } from './routes/auth.ts';
import { meRoutes, userRoutes } from './routes/users.ts';
import { dataRoutes, feedbackRoutes } from './routes/data.ts';

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    config: Config;
  }
  interface FastifyRequest {
    user: UserRow | null;
    sessionToken: string | null;
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function buildApp(config: Config, db: Db): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.logger ? {
      // Bodies carry health data and passwords: never log them, and keep
      // cookies out of the request log.
      serializers: {
        req: (req: FastifyRequest) => ({ method: req.method, url: req.url, remoteAddress: req.ip }),
      },
    } : false,
    // Only nginx can reach the API, and it sets X-Forwarded-For to the real
    // client address (see docs/deploy/docker/cafft.conf).
    trustProxy: true,
    bodyLimit: 1024 * 1024,
    // Reject unknown properties instead of silently stripping them, so a
    // client sending e.g. `role` gets a 400 rather than a quiet success.
    ajv: { customOptions: { removeAdditional: false } },
  });

  app.decorate('db', db);
  app.decorate('config', config);
  app.decorateRequest('user', null);
  app.decorateRequest('sessionToken', null);

  await app.register(cookie);
  // Global limits are off; individual routes opt in via `config.rateLimit`.
  await app.register(rateLimit, { global: false });

  // CSRF: the session cookie is SameSite=Strict, and on top of that any
  // request that changes state while carrying a session must come from the
  // app's own origin.
  app.addHook('onRequest', async (req, reply) => {
    if (SAFE_METHODS.has(req.method)) return;
    const origin = req.headers.origin;
    const hasSession = Boolean(req.cookies[SESSION_COOKIE]);
    if (origin ? origin !== config.publicOrigin : hasSession) {
      return reply.code(403).send({ error: 'forbiddenOrigin' });
    }
  });

  app.addHook('onRequest', async (req) => {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) return;
    const user = resolveSession(db, token, config.sessionTtlMs);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }
  });

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(meRoutes, { prefix: '/me' });
  await app.register(dataRoutes);
  await app.register(feedbackRoutes, { prefix: '/feedback' });

  return app;
}

/** preHandler for routes that need a logged-in user. */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!req.user) {
    return reply.code(401).send({ error: 'unauthenticated' });
  }
}
