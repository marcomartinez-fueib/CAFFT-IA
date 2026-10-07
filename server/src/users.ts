import { randomBytes, randomUUID } from 'node:crypto';
import type { Db } from './db.ts';
import type { StoredUser } from '../../types.ts';

export type Role = StoredUser['role'];

export interface UserRow {
  id: string;
  role: Role;
  username: string;
  email: string;
  password_hash: string;
  patient_code: string | null;
  therapist_id: string | null;
  manager_id: string | null;
  consent_given: number;
  consent_metadata: string | null;
  assistant_name: string | null;
  notification_prefs: string | null;
  onboarding_enabled: number;
  onboarding_done: string;
  sent_follow_ups: string;
  last_login_at: number | null;
  last_assessment_at: number | null;
  last_reminder_at: number | null;
  must_change_password: number;
  created_at: number;
  updated_at: number;
}

/**
 * The user as the client sees it: the StoredUser shape from ../types.ts minus
 * the password hash, plus server-only flags. Absent values are omitted rather
 * than sent as null, as the client's optional fields expect.
 */
export type ApiUser = Omit<StoredUser, 'hashedPassword'> & {
  mustChangePassword: boolean;
  onboardingCompleted: string[];
};

export function toApiUser(row: UserRow): ApiUser {
  const user: ApiUser = {
    id: row.id,
    role: row.role,
    username: row.username,
    email: row.email,
    consentGiven: row.consent_given === 1,
    onboardingEnabled: row.onboarding_enabled === 1,
    onboardingCompleted: JSON.parse(row.onboarding_done),
    sentFollowUps: JSON.parse(row.sent_follow_ups),
    mustChangePassword: row.must_change_password === 1,
  };
  if (row.patient_code) user.patientCode = row.patient_code;
  if (row.therapist_id) user.therapistId = row.therapist_id;
  if (row.manager_id) user.managerId = row.manager_id;
  if (row.consent_metadata) user.informedConsentMetadata = JSON.parse(row.consent_metadata);
  if (row.assistant_name) user.assistantName = row.assistant_name;
  if (row.notification_prefs) user.notificationPreferences = JSON.parse(row.notification_prefs);
  if (row.last_login_at) user.lastLoginDate = row.last_login_at;
  if (row.last_assessment_at) user.lastAssessmentDate = row.last_assessment_at;
  if (row.last_reminder_at) user.lastReminderSentDate = row.last_reminder_at;
  return user;
}

export function findUserById(db: Db, id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow | undefined;
}

export function findUserByUsername(db: Db, username: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as unknown as UserRow | undefined;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I

/** `P-XXXXXX`, unique among existing users. */
function generatePatientCode(db: Db): string {
  for (;;) {
    const bytes = randomBytes(6);
    const code = 'P-' + Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    if (!db.prepare('SELECT 1 FROM users WHERE patient_code = ?').get(code)) return code;
  }
}

export interface NewUser {
  role: Role;
  username: string;
  email: string;
  passwordHash: string;
  consentGiven?: boolean;
  consentMetadata?: unknown;
  therapistId?: string;
  managerId?: string;
  mustChangePassword?: boolean;
}

export type CreateUserResult =
  | { ok: true; user: UserRow }
  | { ok: false; conflict: 'username' | 'email' };

export function createUser(db: Db, input: NewUser): CreateUserResult {
  if (findUserByUsername(db, input.username)) return { ok: false, conflict: 'username' };
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(input.email)) return { ok: false, conflict: 'email' };

  const now = Date.now();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, role, username, email, password_hash, patient_code, therapist_id, manager_id,
                        consent_given, consent_metadata, must_change_password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.role,
    input.username,
    input.email,
    input.passwordHash,
    input.role === 'patient' ? generatePatientCode(db) : null,
    input.therapistId ?? null,
    input.managerId ?? null,
    input.consentGiven ? 1 : 0,
    input.consentMetadata === undefined ? null : JSON.stringify(input.consentMetadata),
    input.mustChangePassword ? 1 : 0,
    now,
    now,
  );
  return { ok: true, user: findUserById(db, id)! };
}
