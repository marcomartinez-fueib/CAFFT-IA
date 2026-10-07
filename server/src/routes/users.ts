import { randomInt } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../app.ts';
import { audit } from '../audit.ts';
import { canAdminister, visibleUser } from '../access.ts';
import { transaction } from '../db.ts';
import { hashPassword, MIN_PASSWORD_LENGTH } from '../passwords.ts';
import { deleteOtherSessions } from '../sessions.ts';
import { createUser, findUserById, toApiUser, type Role } from '../users.ts';
import * as S from '../schemas.ts';

const ERR = {
  usernameTaken: 'auth.usernameTakenError',
  emailTaken: 'auth.emailTakenError',
  passwordTooShort: 'auth.passwordMinLengthError',
} as const;

const NOT_FOUND = { error: 'notFound' };
const FORBIDDEN = { error: 'forbidden' };

// Which roles each role may create. Therapists and managers always create
// under themselves; only superadmin picks the assignment.
const CREATABLE: Record<Role, Role[]> = {
  patient: [],
  therapist: ['patient'],
  manager: ['therapist'],
  superadmin: ['patient', 'therapist', 'manager', 'superadmin'],
};

const TEMP_PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function temporaryPassword(): string {
  return Array.from({ length: 10 }, () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]).join('');
}

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app;
  app.addHook('preHandler', requireAuth);

  app.post<{
    Body: { role: Role; username: string; email: string; password: string; therapistId?: string; managerId?: string };
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['role', 'username', 'email', 'password'],
          additionalProperties: false,
          properties: {
            role: { enum: ['patient', 'therapist', 'manager', 'superadmin'] },
            username: S.username,
            email: S.email,
            password: S.password,
            therapistId: S.uuid,
            managerId: S.uuid,
          },
        },
      },
    },
    async (req, reply) => {
      const actor = req.user!;
      const { role, username, email, password } = req.body;
      let { therapistId, managerId } = req.body;

      if (!CREATABLE[actor.role].includes(role)) return reply.code(403).send(FORBIDDEN);
      if (password.length < MIN_PASSWORD_LENGTH) return reply.code(400).send({ error: ERR.passwordTooShort });

      if (actor.role === 'therapist') therapistId = actor.id;
      if (actor.role === 'manager') managerId = actor.id;
      // Assignments only make sense for the matching role, and must point at
      // a user that actually has the role they are assigned as.
      if (role !== 'patient') therapistId = undefined;
      if (role !== 'therapist') managerId = undefined;
      if (therapistId && findUserById(db, therapistId)?.role !== 'therapist') return reply.code(400).send({ error: 'invalidTherapist' });
      if (managerId && findUserById(db, managerId)?.role !== 'manager') return reply.code(400).send({ error: 'invalidManager' });

      const result = createUser(db, {
        role,
        username,
        email,
        passwordHash: await hashPassword(password),
        consentGiven: true,
        therapistId,
        managerId,
      });
      if (!result.ok) {
        return reply.code(409).send({ error: result.conflict === 'username' ? ERR.usernameTaken : ERR.emailTaken });
      }
      audit(db, { actorId: actor.id, action: `user.create.${role}`, targetId: result.user.id, ip: req.ip });
      return reply.code(201).send({ user: toApiUser(result.user) });
    },
  );

  // Users edit only their own preferences. Everything that changes an
  // account's identity, role or assignment goes through dedicated routes.
  app.patch<{
    Params: { id: string };
    Body: { assistantName?: string; notificationPreferences?: object; sentFollowUps?: string[] };
  }>(
    '/:id',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          minProperties: 1,
          properties: {
            assistantName: S.shortText(64),
            notificationPreferences: S.notificationPreferences,
            sentFollowUps: S.idList(200),
          },
        },
      },
    },
    async (req, reply) => {
      const actor = req.user!;
      if (req.params.id !== actor.id) return reply.code(403).send(FORBIDDEN);

      const { assistantName, notificationPreferences, sentFollowUps } = req.body;
      const sets: string[] = [];
      const values: (string | number | null)[] = [];
      if (assistantName !== undefined) {
        sets.push('assistant_name = ?');
        values.push(assistantName || null);
      }
      if (notificationPreferences !== undefined) {
        sets.push('notification_prefs = ?');
        values.push(JSON.stringify(notificationPreferences));
      }
      if (sentFollowUps !== undefined) {
        sets.push('sent_follow_ups = ?');
        values.push(JSON.stringify(sentFollowUps));
      }
      sets.push('updated_at = ?');
      values.push(Date.now());

      db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values, actor.id);
      return { user: toApiUser(findUserById(db, actor.id)!) };
    },
  );

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const actor = req.user!;
    const target = visibleUser(db, actor, req.params.id);
    if (!target) return reply.code(404).send(NOT_FOUND);
    if (!canAdminister(actor, target)) return reply.code(403).send(FORBIDDEN);

    // Clinical data, sessions, logs and emails go with the user (ON DELETE
    // CASCADE). Patients of a deleted therapist, or therapists of a deleted
    // manager, are left unassigned (ON DELETE SET NULL), not deleted.
    transaction(db, () => {
      db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
      audit(db, { actorId: actor.id, action: `user.delete.${target.role}`, targetId: target.id, ip: req.ip });
    });
    return reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>('/:id/reset-password', async (req, reply) => {
    const actor = req.user!;
    const target = visibleUser(db, actor, req.params.id);
    if (!target) return reply.code(404).send(NOT_FOUND);
    if (!canAdminister(actor, target)) return reply.code(403).send(FORBIDDEN);

    const password = temporaryPassword();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(await hashPassword(password), Date.now(), target.id);
    // Whoever was logged in as this user with the old password is logged out.
    deleteOtherSessions(db, target.id);
    audit(db, { actorId: actor.id, action: 'password.reset', targetId: target.id, ip: req.ip });

    reply.header('Cache-Control', 'no-store');
    return { temporaryPassword: password };
  });

  // Staff switch these for the users they can see; anyone for themselves.
  for (const [path, column] of [
    ['toggle-notifications', 'notification_prefs'],
    ['toggle-onboarding', 'onboarding_enabled'],
  ] as const) {
    app.post<{ Params: { id: string } }>(`/:id/${path}`, async (req, reply) => {
      const actor = req.user!;
      const target = visibleUser(db, actor, req.params.id);
      if (!target) return reply.code(404).send(NOT_FOUND);
      if (actor.role === 'patient' && actor.id !== target.id) return reply.code(403).send(FORBIDDEN);

      const now = Date.now();
      if (column === 'notification_prefs') {
        // Same default as the client's toggleUserNotifications.
        const prefs = target.notification_prefs
          ? JSON.parse(target.notification_prefs)
          : { enabled: true, reminders: true, newTasks: true, followUp: true, general: true, frequency: 'daily', startTime: '09:00', endTime: '21:00' };
        prefs.enabled = !prefs.enabled;
        db.prepare('UPDATE users SET notification_prefs = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(prefs), now, target.id);
      } else {
        const enable = target.onboarding_enabled === 0;
        // Re-enabling lets the tours run again, as clearing the old
        // localStorage flag did.
        db.prepare(`UPDATE users SET onboarding_enabled = ?, ${enable ? "onboarding_done = '[]'," : ''} updated_at = ? WHERE id = ?`).run(
          enable ? 1 : 0,
          now,
          target.id,
        );
      }
      return { user: toApiUser(findUserById(db, target.id)!) };
    });
  }
}

export async function meRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app;
  app.addHook('preHandler', requireAuth);

  app.post<{ Params: { tour: string } }>(
    '/onboarding/:tour/complete',
    { schema: { params: { type: 'object', properties: { tour: { enum: ['patient', 'therapist'] } } } } },
    async (req) => {
      const user = req.user!;
      const done = new Set<string>(JSON.parse(user.onboarding_done));
      done.add(req.params.tour);
      db.prepare('UPDATE users SET onboarding_done = ?, updated_at = ? WHERE id = ?').run(JSON.stringify([...done]), Date.now(), user.id);
      return { user: toApiUser(findUserById(db, user.id)!) };
    },
  );
}
