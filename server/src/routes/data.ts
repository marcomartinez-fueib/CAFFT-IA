import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../app.ts';
import { canWriteClinical, visibleUser, visibleUsers } from '../access.ts';
import { transaction } from '../db.ts';
import { consultationsFor, emailsFor, lastActivityAt, progressFor, qpviiFor } from '../records.ts';
import { toApiUser } from '../users.ts';
import * as S from '../schemas.ts';

const NOT_FOUND = { error: 'notFound' };
const FORBIDDEN = { error: 'forbidden' };

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
    reply.header('Cache-Control', 'no-store');
    return {
      users: users.map(toApiUser),
      qpvii: qpviiFor(db, ids),
      progress: progressFor(db, ids),
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
        }
      });
      return reply.code(204).send();
    },
  );

  /**
   * Inactivity reminders: for each visible patient (or just those listed),
   * record a reminder if they have been inactive for `thresholdDays` and have
   * not had one in the last `minGapDays`. Replaces the client-side
   * checkAndSendInactivityReminder / sendAdherenceRemindersToAllInactive.
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

        transaction(db, () => {
          db.prepare("INSERT INTO emails (id, patient_id, type, subject, body, status, timestamp) VALUES (?, ?, 'reminder', ?, ?, 'sent', ?)").run(
            `rem_${now}_${patient.id}`,
            patient.id,
            subject,
            bodyTemplate.replaceAll('{username}', patient.username),
            now,
          );
          db.prepare('UPDATE users SET last_reminder_at = ?, updated_at = ? WHERE id = ?').run(now, now, patient.id);
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

  app.post<{ Body: { id: string; username: string; type: string; rating: number; comment: string } }>(
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
            comment: S.shortText(5000),
          },
        },
      },
    },
    async (req, reply) => {
      const b = req.body;
      const user = req.user;
      // Identity comes from the session, never from the body.
      const userType = !user ? 'guest' : user.role === 'therapist' ? 'therapist' : 'patient';
      db.prepare(
        "INSERT OR IGNORE INTO feedback (id, user_id, username, user_type, type, rating, comment, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)",
      ).run(b.id, user?.id ?? null, user ? user.username : b.username, userType, b.type, b.rating, b.comment, Date.now());
      return reply.code(204).send();
    },
  );
}
