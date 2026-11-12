import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../app.ts';
import { canWriteClinical, visibleUser, visibleUsers } from '../access.ts';
import { hasCurrentTreatmentConsent } from '../consents.ts';
import { transaction } from '../db.ts';
import { audit } from '../audit.ts';
import { funnelRows } from '../funnel.ts';
import { consultationsFor, emailsFor, flightReportsFor, helpVideoViewsFor, lastActivityAt, plansFor, progressFor, qpviiDraftFor, qpviiFor, sessionsFor } from '../records.ts';
import { toApiUser, type UserRow } from '../users.ts';
import { enqueueMail } from '../mail/outbox.ts';
import { feedbackMail } from '../mail/templates.ts';
import * as S from '../schemas.ts';

/**
 * Reminder emails go only to patients who said yes in the notification
 * consent dialog and have not switched reminders off. Everyone else's
 * reminders are still recorded in their history, just not delivered.
 */
function wantsReminderEmails(patient: UserRow): boolean {
  if (!patient.notification_prefs) return false;
  const prefs = JSON.parse(patient.notification_prefs) as { enabled?: boolean; reminders?: boolean };
  return prefs.enabled === true && prefs.reminders !== false;
}

const NOT_FOUND = { error: 'notFound' };
const FORBIDDEN = { error: 'forbidden' };
// A patient must accept the current informed consent before any clinical data
// of theirs is stored (consent.ts); the app shows the consent screen first.
const CONSENT_REQUIRED = { error: 'consent.required' };

export async function dataRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app;
  app.addHook('preHandler', requireAuth);

  /**
   * Everything the caller may see, in one response. The client keeps it in
   * memory and reads from there (services/dataStore.ts), so pages stay
   * synchronous. At CAFFT's scale (a few hundred users at most) this is a
   * small payload even for a superadmin.
   */
  app.get('/sync', async (req, reply) => {
    const users = visibleUsers(db, req.user!);
    const ids = users.map((u) => u.id);
    // Staff loading their patients' clinical data is an access to health
    // data: record whose. (A patient loading their own data is not.)
    const patientIds = users.filter((u) => u.role === 'patient' && u.id !== req.user!.id).map((u) => u.id);
    if (req.user!.role !== 'patient' && patientIds.length > 0) {
      audit(db, { actorId: req.user!.id, action: 'clinical.read', ip: req.ip, detail: { patients: patientIds } });
    }
    reply.header('Cache-Control', 'no-store');
    return {
      users: users.map(toApiUser),
      qpvii: qpviiFor(db, ids),
      progress: progressFor(db, ids),
      sessions: sessionsFor(db, ids),
      helpVideoViews: helpVideoViewsFor(db, ids),
      sessionPlans: plansFor(db, ids),
      flightReports: flightReportsFor(db, ids),
      // Only the patient's own half-answered questionnaire.
      qpviiDraft: req.user!.role === 'patient' ? qpviiDraftFor(db, req.user!.id) : null,
      consultations: consultationsFor(db, ids),
      emails: emailsFor(db, ids),
    };
  });

  // Upsert keyed on (userId, timestamp), so a client retrying after a lost
  // response cannot create duplicates.
  app.put<{
    Body: {
      userId: string;
      timestamp: number;
      formName: string;
      date: string;
      scores: object;
      answers: object;
      evaluationType?: 'pre' | 'post';
      originalQpviiTimestamp?: number;
    };
  }>(
    '/qpvii',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['userId', 'timestamp', 'formName', 'date', 'scores', 'answers'],
          properties: {
            userId: S.uuid,
            timestamp: S.timestamp,
            formName: S.shortText(200),
            date: S.shortText(32),
            scores: S.qpviiScores,
            answers: S.qpviiAnswers,
            evaluationType: { enum: ['pre', 'post'] },
            originalQpviiTimestamp: S.timestamp,
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      if (!canWriteClinical(req.user!, b.userId)) return reply.code(403).send(FORBIDDEN);
      if (!hasCurrentTreatmentConsent(req.user!)) return reply.code(403).send(CONSENT_REQUIRED);
      if (!visibleUser(db, req.user!, b.userId)) return reply.code(404).send(NOT_FOUND);

      transaction(db, () => {
        db.prepare(
          `INSERT INTO qpvii_results (user_id, timestamp, form_name, form_date, evaluation_type, original_timestamp, scores, answers)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (user_id, timestamp) DO UPDATE SET
             form_name = excluded.form_name, form_date = excluded.form_date, evaluation_type = excluded.evaluation_type,
             original_timestamp = excluded.original_timestamp, scores = excluded.scores, answers = excluded.answers`,
        ).run(
          b.userId,
          b.timestamp,
          b.formName,
          b.date,
          b.evaluationType ?? 'pre',
          b.originalQpviiTimestamp ?? null,
          JSON.stringify(b.scores),
          JSON.stringify(b.answers),
        );
        db.prepare('UPDATE users SET last_assessment_at = MAX(COALESCE(last_assessment_at, 0), ?), updated_at = ? WHERE id = ?').run(
          b.timestamp,
          Date.now(),
          b.userId,
        );
        // The questionnaire is in: the half-answered copy is no longer needed.
        db.prepare('DELETE FROM qpvii_drafts WHERE user_id = ?').run(b.userId);
      });
      return reply.code(204).send();
    },
  );

  // The client merges with the previous record before sending (it always did,
  // in localStorageDB.ts), so this replaces the whole row.
  app.put<{
    Body: {
      userId: string;
      qpviiTimestamp: number | null;
      videoSequence: string[];
      currentVideoIndex: number;
      completedVideoIds: string[];
      discomfortRatings: object[];
      explanationShown: boolean;
      programCompleted: boolean;
      isReview: boolean;
      reviewCompleted: boolean;
      originalQpviiTimestamp?: number;
      lastUpdated: number;
    };
  }>(
    '/exposure',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: [
            'userId', 'qpviiTimestamp', 'videoSequence', 'currentVideoIndex', 'completedVideoIds', 'discomfortRatings',
            'explanationShown', 'programCompleted', 'isReview', 'reviewCompleted', 'lastUpdated',
          ],
          properties: {
            userId: S.uuid,
            qpviiTimestamp: { type: ['integer', 'null'], minimum: 0 },
            videoSequence: S.idList(100),
            currentVideoIndex: { type: 'integer', minimum: 0 },
            completedVideoIds: S.idList(100),
            discomfortRatings: S.discomfortRatings,
            explanationShown: { type: 'boolean' },
            programCompleted: { type: 'boolean' },
            isReview: { type: 'boolean' },
            reviewCompleted: { type: 'boolean' },
            originalQpviiTimestamp: S.timestamp,
            lastUpdated: S.timestamp,
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      if (!canWriteClinical(req.user!, b.userId)) return reply.code(403).send(FORBIDDEN);
      if (!hasCurrentTreatmentConsent(req.user!)) return reply.code(403).send(CONSENT_REQUIRED);
      if (!visibleUser(db, req.user!, b.userId)) return reply.code(404).send(NOT_FOUND);

      const values = [
        b.originalQpviiTimestamp ?? null,
        b.isReview ? 1 : 0,
        JSON.stringify(b.videoSequence),
        b.currentVideoIndex,
        JSON.stringify(b.completedVideoIds),
        JSON.stringify(b.discomfortRatings),
        b.explanationShown ? 1 : 0,
        b.programCompleted ? 1 : 0,
        b.reviewCompleted ? 1 : 0,
        b.lastUpdated,
      ];
      // `IS` rather than `=`, and no ON CONFLICT: qpvii_timestamp may be NULL,
      // and NULLs never collide under a UNIQUE constraint.
      transaction(db, () => {
        const updated = db
          .prepare(
            `UPDATE exposure_progress SET original_qpvii_timestamp = ?, is_review = ?, video_sequence = ?, current_video_index = ?,
               completed_video_ids = ?, discomfort_ratings = ?, explanation_shown = ?, program_completed = ?,
               review_completed = ?, last_updated = ?
             WHERE user_id = ? AND qpvii_timestamp IS ?`,
          )
          .run(...values, b.userId, b.qpviiTimestamp);
        if (updated.changes === 0) {
          db.prepare(
            `INSERT INTO exposure_progress (original_qpvii_timestamp, is_review, video_sequence, current_video_index,
               completed_video_ids, discomfort_ratings, explanation_shown, program_completed, review_completed, last_updated,
               user_id, qpvii_timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(...values, b.userId, b.qpviiTimestamp);
        }
      });
      return reply.code(204).send();
    },
  );

  // Upsert keyed on the client-generated id. A session never changes owner:
  // the update only applies when the stored row is the same user's.
  app.put<{
    Body: {
      id: string;
      userId: string;
      qpviiTimestamp: number | null;
      isReview: boolean;
      startedAt: number;
      lastActivityAt: number;
      endedAt?: number;
      endReason?: 'pause' | 'completed';
    };
  }>(
    '/exposure-sessions',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'userId', 'qpviiTimestamp', 'isReview', 'startedAt', 'lastActivityAt'],
          properties: {
            id: S.uuid,
            userId: S.uuid,
            qpviiTimestamp: { type: ['integer', 'null'], minimum: 0 },
            isReview: { type: 'boolean' },
            startedAt: S.timestamp,
            lastActivityAt: S.timestamp,
            endedAt: S.timestamp,
            endReason: { enum: ['pause', 'completed'] },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      if (!canWriteClinical(req.user!, b.userId)) return reply.code(403).send(FORBIDDEN);
      if (!hasCurrentTreatmentConsent(req.user!)) return reply.code(403).send(CONSENT_REQUIRED);
      if (!visibleUser(db, req.user!, b.userId)) return reply.code(404).send(NOT_FOUND);

      const written = db
        .prepare(
          `INSERT INTO exposure_sessions (id, user_id, qpvii_timestamp, is_review, started_at, last_activity_at, ended_at, end_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             qpvii_timestamp = excluded.qpvii_timestamp, is_review = excluded.is_review, started_at = excluded.started_at,
             last_activity_at = excluded.last_activity_at, ended_at = excluded.ended_at, end_reason = excluded.end_reason
           WHERE exposure_sessions.user_id = excluded.user_id`,
        )
        .run(
          b.id,
          b.userId,
          b.qpviiTimestamp,
          b.isReview ? 1 : 0,
          b.startedAt,
          b.lastActivityAt,
          b.endedAt ?? null,
          b.endReason ?? null,
        );
      if (written.changes === 0) return reply.code(403).send(FORBIDDEN);
      return reply.code(204).send();
    },
  );

  // One viewing of a help video by the patient themself, sent when it starts,
  // ends or is closed. The row keeps the furthest point reached, the first
  // completion and whether the latest viewing stopped early; a viewing counts
  // once however many times it is reported (`newView` only on the first).
  app.put<{
    Body: { videoId: string; versionId: string; at: number; percent: number; completed: boolean; newView: boolean };
  }>(
    '/help-video-views',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['videoId', 'versionId', 'at', 'percent', 'completed', 'newView'],
          properties: {
            videoId: { type: 'string', pattern: '^[PT][0-9]{2}$' },
            versionId: { type: 'string', pattern: '^[PT][0-9]{2}c?$' },
            at: S.timestamp,
            percent: { type: 'integer', minimum: 0, maximum: 100 },
            completed: { type: 'boolean' },
            newView: { type: 'boolean' },
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      const user = req.user!;
      if (user.role !== 'patient') return reply.code(403).send(FORBIDDEN);
      if (!hasCurrentTreatmentConsent(user)) return reply.code(403).send(CONSENT_REQUIRED);
      if (!b.versionId.startsWith(b.videoId)) return reply.code(400).send({ error: 'badRequest' });

      db.prepare(
        `INSERT INTO help_video_views (user_id, video_id, version_id, first_at, last_at, views, max_percent, completed_at, closed_early)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
         ON CONFLICT (user_id, video_id) DO UPDATE SET
           version_id = excluded.version_id,
           last_at = MAX(help_video_views.last_at, excluded.last_at),
           views = help_video_views.views + ?,
           max_percent = MAX(help_video_views.max_percent, excluded.max_percent),
           completed_at = COALESCE(help_video_views.completed_at, excluded.completed_at),
           closed_early = excluded.closed_early`,
      ).run(user.id, b.videoId, b.versionId, b.at, b.at, b.percent, b.completed ? b.at : null, b.completed ? 0 : 1, b.newView ? 1 : 0);
      return reply.code(204).send();
    },
  );

  // The pilot's funnel, pseudonymised (src/funnel.ts), for the patients the
  // caller may see. Exporting it is an access to health data: recorded.
  app.get('/funnel', async (req, reply) => {
    if (req.user!.role === 'patient') return reply.code(403).send(FORBIDDEN);
    const ids = visibleUsers(db, req.user!).filter((u) => u.role === 'patient' && u.is_test_account !== 1).map((u) => u.id);
    audit(db, { actorId: req.user!.id, action: 'clinical.export', ip: req.ip, detail: { kind: 'funnel', patients: ids.length } });
    reply.header('Cache-Control', 'no-store');
    return { rows: funnelRows(db, ids) };
  });

  // What the server cannot see by itself: a therapist opening a patient's
  // card, or exporting data to a file (the export is built in the browser
  // from data already loaded). Only for patients the caller may see.
  app.post<{ Body: { action: 'clinical.view' | 'clinical.export'; patientIds: string[] } }>(
    '/audit/access',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['action', 'patientIds'],
          properties: {
            action: { enum: ['clinical.view', 'clinical.export'] },
            patientIds: { type: 'array', minItems: 1, maxItems: 5000, items: S.uuid },
          },
        },
      },
    },
    async (req, reply) => {
      const { action, patientIds } = req.body;
      if (req.user!.role === 'patient') return reply.code(403).send(FORBIDDEN);
      if (!patientIds.every((id) => visibleUser(db, req.user!, id))) return reply.code(404).send(NOT_FOUND);
      audit(db, { actorId: req.user!.id, action, ip: req.ip, detail: { patients: patientIds } });
      return reply.code(204).send();
    },
  );

  // Ids are generated by the client; INSERT OR IGNORE makes retries harmless.
  app.post<{ Body: { id: string; userId: string; userRole: 'patient' | 'therapist'; query: string; response: string; timestamp: number } }>(
    '/ai-consultations',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'userId', 'userRole', 'query', 'response', 'timestamp'],
          properties: {
            id: S.uuid,
            userId: S.uuid,
            userName: S.shortText(64), // accepted for shape compatibility; the stored username is authoritative
            userRole: { enum: ['patient', 'therapist'] },
            query: S.shortText(20_000),
            response: S.shortText(100_000),
            timestamp: S.timestamp,
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      if (b.userId !== req.user!.id) return reply.code(403).send(FORBIDDEN);
      if (!hasCurrentTreatmentConsent(req.user!)) return reply.code(403).send(CONSENT_REQUIRED);
      db.prepare(
        'INSERT OR IGNORE INTO ai_consultations (id, user_id, user_role, query, response, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(b.id, b.userId, req.user!.role === 'patient' ? 'patient' : 'therapist', b.query, b.response, b.timestamp);
      return reply.code(204).send();
    },
  );

  // Emails are still only recorded, not sent (see docs/backend/PLAN.md, phase 5).
  app.post<{
    Body: { id: string; patientId: string; type: string; subject: string; body: string; status: 'generated' | 'sent'; timestamp: number };
  }>(
    '/emails',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'patientId', 'type', 'subject', 'body', 'status', 'timestamp'],
          properties: {
            id: S.uuid,
            patientId: S.uuid,
            type: { enum: ['invitation', 'reminder', 'follow_up', 'reinforcement'] },
            subject: S.shortText(500),
            body: S.shortText(20_000),
            status: { enum: ['generated', 'sent'] },
            timestamp: S.timestamp,
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      const patient = visibleUser(db, req.user!, b.patientId);
      if (!patient || patient.role !== 'patient') return reply.code(404).send(NOT_FOUND);

      transaction(db, () => {
        const inserted = db
          .prepare('INSERT OR IGNORE INTO emails (id, patient_id, type, subject, body, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(b.id, b.patientId, b.type, b.subject, b.body, b.status, b.timestamp);
        if (inserted.changes > 0 && b.type === 'reminder' && b.status === 'sent') {
          db.prepare('UPDATE users SET last_reminder_at = ?, updated_at = ? WHERE id = ?').run(b.timestamp, Date.now(), b.patientId);
          if (wantsReminderEmails(patient)) enqueueMail(db, { to: patient.email, subject: b.subject, body: b.body, kind: 'reminder' });
        }
      });
      return reply.code(204).send();
    },
  );

  /**
   * Inactivity reminders: for each visible patient (or just those listed),
   * record a reminder if they have been inactive for `thresholdDays` and have
   * not had one in the last `minGapDays`: the therapist's «send reminders»
   * button (sendAdherenceRemindersToAllInactive). The automatic reminders
   * are src/reminders.ts.
   * `{username}` in the body is replaced per patient.
   */
  app.post<{ Body: { patientIds?: string[]; thresholdDays: number; minGapDays?: number; subject: string; bodyTemplate: string } }>(
    '/reminders/inactivity',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['thresholdDays', 'subject', 'bodyTemplate'],
          properties: {
            patientIds: S.idList(1000),
            thresholdDays: { type: 'integer', minimum: 1, maximum: 365 },
            minGapDays: { type: 'integer', minimum: 0, maximum: 365 },
            subject: S.shortText(500),
            bodyTemplate: S.shortText(20_000),
          },
        },
      },
    },
    async (req) => {
      const { thresholdDays, subject, bodyTemplate } = req.body;
      const minGapMs = (req.body.minGapDays ?? 5) * 24 * 60 * 60 * 1000;
      const wanted = req.body.patientIds ? new Set(req.body.patientIds) : null;
      const now = Date.now();

      const sent: string[] = [];
      for (const patient of visibleUsers(db, req.user!)) {
        if (patient.role !== 'patient' || (wanted && !wanted.has(patient.id))) continue;
        if (patient.last_reminder_at && now - patient.last_reminder_at < minGapMs) continue;

        const lastActivity = lastActivityAt(db, patient.id);
        if (lastActivity === null) continue;
        if (Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000)) < thresholdDays) continue;

        const body = bodyTemplate.replaceAll('{username}', patient.username);
        transaction(db, () => {
          db.prepare("INSERT INTO emails (id, patient_id, type, subject, body, status, timestamp) VALUES (?, ?, 'reminder', ?, ?, 'sent', ?)").run(
            `rem_${now}_${patient.id}`,
            patient.id,
            subject,
            body,
            now,
          );
          db.prepare('UPDATE users SET last_reminder_at = ?, updated_at = ? WHERE id = ?').run(now, now, patient.id);
          if (wantsReminderEmails(patient)) enqueueMail(db, { to: patient.email, subject, body, kind: 'reminder' });
        });
        sent.push(patient.id);
      }
      return { sent };
    },
  );
}

/** Feedback is public: the feedback page works without logging in. */
export async function feedbackRoutes(app: FastifyInstance): Promise<void> {
  const { db } = app;

  // Only the latest testimonials, and nothing that identifies a user beyond
  // the display name they submitted with.
  app.get('/testimonials', async () => {
    const rows = db
      .prepare(
        `SELECT id, username, user_type, type, rating, comment, timestamp, status FROM feedback
         WHERE type = 'testimonial' ORDER BY timestamp DESC LIMIT 5`,
      )
      .all() as unknown as {
      id: string;
      username: string;
      user_type: string;
      type: string;
      rating: number;
      comment: string;
      timestamp: number;
      status: string;
    }[];
    return {
      testimonials: rows.map((r) => ({
        id: r.id,
        userId: '',
        username: r.username,
        userType: r.user_type,
        type: r.type,
        rating: r.rating,
        comment: r.comment,
        timestamp: r.timestamp,
        status: r.status,
      })),
    };
  });

  app.post<{
    Body: {
      id: string;
      username: string;
      type: string;
      rating: number;
      comment: string;
      contact?: string;
      page?: string;
      language?: string;
      viewport?: string;
    };
  }>(
    '/',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'username', 'type', 'rating', 'comment'],
          properties: {
            id: S.uuid,
            username: S.shortText(64),
            type: { enum: ['bug', 'improvement', 'testimonial', 'other'] },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', minLength: 1, maxLength: 5000, pattern: '\\S' },
            contact: { anyOf: [S.email, { const: '' }] },
            page: S.shortText(200),
            language: S.shortText(8),
            viewport: S.shortText(20),
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      const user = req.user;
      // Identity comes from the session, never from the body.
      const userType = !user ? 'guest' : user.role === 'therapist' ? 'therapist' : 'patient';
      const username = user ? user.username : b.username;
      const userAgent = req.headers['user-agent']?.slice(0, 500) ?? null;
      const now = Date.now();
      transaction(db, () => {
        const { changes } = db
          .prepare(
            `INSERT OR IGNORE INTO feedback
               (id, user_id, username, user_type, type, rating, comment, status, timestamp, page, contact, language, user_agent, viewport)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?)`,
          )
          .run(b.id, user?.id ?? null, username, userType, b.type, b.rating, b.comment, now,
            b.page || null, b.contact || null, b.language || null, userAgent, b.viewport || null);
        // A retried submission (same id) is stored and mailed only once.
        if (changes === 0 || !app.config.feedbackTo) return;
        const mail = feedbackMail({
          type: b.type,
          rating: b.rating,
          comment: b.comment,
          username,
          userType: user?.role ?? 'guest',
          contact: b.contact || null,
          page: b.page || null,
          language: b.language || null,
          userAgent,
          viewport: b.viewport || null,
          at: new Date(now),
        });
        enqueueMail(db, { to: app.config.feedbackTo, ...mail, kind: 'feedback' });
      });
      return reply.code(204).send();
    },
  );
}
