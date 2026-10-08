import type { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth } from '../app.ts';
import { audit } from '../audit.ts';
import { hashPassword, MIN_PASSWORD_LENGTH, verifyAgainstDummy, verifyPassword } from '../passwords.ts';
import { createSession, deleteOtherSessions, deleteSession, SESSION_COOKIE } from '../sessions.ts';
import { createUser, findUserByUsername, toApiUser, type UserRow } from '../users.ts';
import { transaction } from '../db.ts';
import { enqueueMail } from '../mail/outbox.ts';
import { asLang, LANGS, passwordResetMail, setPasswordLink } from '../mail/templates.ts';
import { consumePasswordToken, issuePasswordToken } from '../passwordTokens.ts';

// Error values are the client's translation keys (data/translations.ts), so
// the UI can show them as it does today.
const ERR = {
  invalidCredentials: 'auth.invalidCredentialsError',
  usernameTaken: 'auth.usernameTakenError',
  emailTaken: 'auth.emailTakenError',
  consentRequired: 'auth.consentRequiredError',
  passwordTooShort: 'auth.passwordMinLengthError',
  changePassword: 'auth.changePasswordError',
  tooManyAttempts: 'auth.tooManyAttemptsError',
  invalidToken: 'auth.invalidOrExpiredTokenError',
} as const;

// Per-account lockout, on top of the per-IP rate limit, so that a password
// guesser spreading attempts across many IPs still hits a wall. In memory is
// enough: there is a single API process, and a restart merely resets counters.
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; lockedUntil: number }>();

function isLockedOut(username: string): boolean {
  const entry = failures.get(username.toLowerCase());
  return entry !== undefined && entry.lockedUntil > Date.now();
}

function recordFailure(username: string): void {
  const key = username.toLowerCase();
  const entry = failures.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILURES) {
    entry.count = 0;
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  failures.set(key, entry);
}

const LOGIN_RATE_LIMIT = { max: 10, timeWindow: '1 minute' };

const usernameSchema = { type: 'string', minLength: 3, maxLength: 64, pattern: '^[A-Za-z0-9._-]+$' };
const passwordSchema = { type: 'string', minLength: 1, maxLength: 256 };
const emailSchema = { type: 'string', format: 'email', maxLength: 254 };

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const { db, config } = app;

  function setSessionCookie(reply: FastifyReply, token: string): void {
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'strict',
      path: config.cookiePath,
      maxAge: Math.floor(config.sessionTtlMs / 1000),
    });
  }

  function clearSessionCookie(reply: FastifyReply): void {
    reply.clearCookie(SESSION_COOKIE, { path: config.cookiePath });
  }

  app.post<{ Body: { username: string; password: string } }>(
    '/login',
    {
      config: { rateLimit: LOGIN_RATE_LIMIT },
      schema: {
        body: {
          type: 'object',
          required: ['username', 'password'],
          additionalProperties: false,
          properties: { username: { type: 'string', maxLength: 64 }, password: passwordSchema },
        },
      },
    },
    async (req, reply) => {
      const { username, password } = req.body;

      if (isLockedOut(username)) {
        return reply.code(429).send({ error: ERR.tooManyAttempts });
      }

      const user = findUserByUsername(db, username);
      const ok = user ? await verifyPassword(password, user.password_hash) : await verifyAgainstDummy(password);

      if (!user || !ok) {
        recordFailure(username);
        audit(db, { actorId: user?.id ?? null, action: 'login.failed', ip: req.ip });
        return reply.code(401).send({ error: ERR.invalidCredentials });
      }

      failures.delete(username.toLowerCase());
      const now = Date.now();
      db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now, now, user.id);
      setSessionCookie(reply, createSession(db, user.id, config.sessionTtlMs));
      audit(db, { actorId: user.id, action: 'login', ip: req.ip });

      return { user: toApiUser({ ...user, last_login_at: now }) };
    },
  );

  app.post('/logout', async (req, reply) => {
    if (req.sessionToken) {
      deleteSession(db, req.sessionToken);
      audit(db, { actorId: req.user!.id, action: 'logout', ip: req.ip });
    }
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  app.get('/me', { preHandler: requireAuth }, async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    return { user: toApiUser(req.user!) };
  });

  // Target of nginx's auth_request for the Gemini proxy: only the status matters.
  app.get('/check', async (req, reply) => {
    return reply.code(req.user ? 204 : 401).header('Cache-Control', 'no-store').send();
  });

  app.post<{
    Body: { username: string; email: string; password: string; consent: boolean; informedConsentMetadata?: unknown };
  }>(
    '/register',
    {
      config: { rateLimit: LOGIN_RATE_LIMIT },
      schema: {
        body: {
          type: 'object',
          required: ['username', 'email', 'password', 'consent'],
          additionalProperties: false,
          properties: {
            username: usernameSchema,
            email: emailSchema,
            password: passwordSchema,
            consent: { type: 'boolean' },
            informedConsentMetadata: {
              type: 'object',
              additionalProperties: false,
              properties: {
                dob: { type: 'string', maxLength: 32 },
                gender: { type: 'string', maxLength: 64 },
                occupation: { type: 'string', maxLength: 128 },
                source: { type: 'string', maxLength: 256 },
                studentsPresence: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { username, email, password, consent, informedConsentMetadata } = req.body;
      if (!consent) return reply.code(400).send({ error: ERR.consentRequired });
      if (password.length < MIN_PASSWORD_LENGTH) return reply.code(400).send({ error: ERR.passwordTooShort });

      // Self-registration only ever creates patients; staff accounts are
      // created by a manager or superadmin.
      const result = createUser(db, {
        role: 'patient',
        username,
        email,
        passwordHash: await hashPassword(password),
        consentGiven: true,
        consentMetadata: informedConsentMetadata,
      });
      if (!result.ok) {
        return reply.code(409).send({ error: result.conflict === 'username' ? ERR.usernameTaken : ERR.emailTaken });
      }

      audit(db, { actorId: result.user.id, action: 'register', targetId: result.user.id, ip: req.ip });
      return reply.code(201).send({ user: toApiUser(result.user) });
    },
  );

  app.post<{ Body: { currentPassword: string; newPassword: string } }>(
    '/change-password',
    {
      preHandler: requireAuth,
      config: { rateLimit: LOGIN_RATE_LIMIT },
      schema: {
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          additionalProperties: false,
          properties: { currentPassword: passwordSchema, newPassword: passwordSchema },
        },
      },
    },
    async (req, reply) => {
      const user = req.user!;
      const { currentPassword, newPassword } = req.body;

      if (newPassword.length < MIN_PASSWORD_LENGTH) return reply.code(400).send({ error: ERR.passwordTooShort });
      if (!(await verifyPassword(currentPassword, user.password_hash))) {
        audit(db, { actorId: user.id, action: 'password.change.failed', ip: req.ip });
        return reply.code(400).send({ error: ERR.changePassword });
      }

      db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?').run(
        await hashPassword(newPassword),
        Date.now(),
        user.id,
      );
      // Anyone else holding a session for this account loses it.
      deleteOtherSessions(db, user.id, req.sessionToken!);
      audit(db, { actorId: user.id, action: 'password.change', ip: req.ip });

      return reply.code(204).send();
    },
  );

  // Always 204, whether or not the address belongs to an account, so the
  // endpoint cannot be used to find out who is registered.
  app.post<{ Body: { email: string; language?: string } }>(
    '/password-reset',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          additionalProperties: false,
          properties: { email: { type: 'string', maxLength: 254 }, language: { enum: [...LANGS] } },
        },
      },
    },
    async (req, reply) => {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.body.email.trim()) as unknown as UserRow | undefined;
      if (user) {
        transaction(db, () => {
          const token = issuePasswordToken(db, user.id, 'reset');
          const mail = passwordResetMail(asLang(req.body.language), user.username, setPasswordLink(config.appUrl, token));
          enqueueMail(db, { to: user.email, ...mail, kind: 'password_reset' });
          audit(db, { actorId: null, action: 'password.reset.requested', targetId: user.id, ip: req.ip });
        });
      }
      return reply.code(204).send();
    },
  );

  // Completes both a password reset and an invitation: the link is the same kind.
  app.post<{ Body: { token: string; password: string } }>(
    '/password-reset/confirm',
    {
      config: { rateLimit: LOGIN_RATE_LIMIT },
      schema: {
        body: {
          type: 'object',
          required: ['token', 'password'],
          additionalProperties: false,
          properties: { token: { type: 'string', minLength: 1, maxLength: 128 }, password: passwordSchema },
        },
      },
    },
    async (req, reply) => {
      const { token, password } = req.body;
      if (password.length < MIN_PASSWORD_LENGTH) return reply.code(400).send({ error: ERR.passwordTooShort });
      const passwordHash = await hashPassword(password);

      const result = transaction(db, () => {
        const claim = consumePasswordToken(db, token);
        if (!claim) return null;
        db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?').run(passwordHash, Date.now(), claim.userId);
        // Whoever held a session with the old password is logged out.
        deleteOtherSessions(db, claim.userId);
        audit(db, { actorId: claim.userId, action: claim.purpose === 'invite' ? 'invitation.accepted' : 'password.reset', ip: req.ip });
        return claim;
      });
      if (!result) return reply.code(400).send({ error: ERR.invalidToken });
      return reply.code(204).send();
    },
  );
}
