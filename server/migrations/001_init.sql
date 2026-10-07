-- Initial schema. Shapes mirror the client types in ../types.ts; nested
-- structures the client already treats as opaque are stored as JSON text.
-- All timestamps are Unix epoch milliseconds, as in the client.

CREATE TABLE users (
  id                   TEXT PRIMARY KEY,
  role                 TEXT NOT NULL CHECK (role IN ('patient', 'therapist', 'manager', 'superadmin')),
  username             TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email                TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash        TEXT NOT NULL,
  patient_code         TEXT UNIQUE,
  therapist_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  manager_id           TEXT REFERENCES users(id) ON DELETE SET NULL,
  consent_given        INTEGER NOT NULL DEFAULT 0,
  consent_metadata     TEXT,                          -- JSON InformedConsentMetadata
  assistant_name       TEXT,
  notification_prefs   TEXT,                          -- JSON NotificationPreferences
  onboarding_enabled   INTEGER NOT NULL DEFAULT 1,
  onboarding_done      TEXT NOT NULL DEFAULT '[]',    -- JSON string[]: completed tours
  sent_follow_ups      TEXT NOT NULL DEFAULT '[]',    -- JSON string[]
  last_login_at        INTEGER,
  last_assessment_at   INTEGER,
  last_reminder_at     INTEGER,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL
);
CREATE INDEX users_therapist ON users(therapist_id);
CREATE INDEX users_manager ON users(manager_id);

CREATE TABLE sessions (
  token_hash   TEXT PRIMARY KEY,                      -- sha256 of the cookie token
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE qpvii_results (
  id                 INTEGER PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp          INTEGER NOT NULL,                -- the client's logical key for a result
  form_name          TEXT NOT NULL,
  form_date          TEXT NOT NULL,
  evaluation_type    TEXT CHECK (evaluation_type IN ('pre', 'post')),
  original_timestamp INTEGER,
  scores             TEXT NOT NULL,                   -- JSON QPVIIScores
  answers            TEXT NOT NULL,                   -- JSON QPVIIAnswers
  UNIQUE (user_id, timestamp)
);

CREATE TABLE exposure_progress (
  id                       INTEGER PRIMARY KEY,
  user_id                  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qpvii_timestamp          INTEGER,
  original_qpvii_timestamp INTEGER,
  is_review                INTEGER NOT NULL DEFAULT 0,
  video_sequence           TEXT NOT NULL,             -- JSON string[]
  current_video_index      INTEGER NOT NULL,
  completed_video_ids      TEXT NOT NULL,             -- JSON string[]
  discomfort_ratings       TEXT NOT NULL,             -- JSON VideoDiscomfortRating[]
  explanation_shown        INTEGER NOT NULL DEFAULT 0,
  program_completed        INTEGER NOT NULL DEFAULT 0,
  review_completed         INTEGER NOT NULL DEFAULT 0,
  last_updated             INTEGER NOT NULL,
  UNIQUE (user_id, qpvii_timestamp)
);

CREATE TABLE ai_consultations (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL,
  query     TEXT NOT NULL,
  response  TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
CREATE INDEX ai_consultations_user ON ai_consultations(user_id, timestamp);

CREATE TABLE emails (
  id         TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  status     TEXT NOT NULL,
  timestamp  INTEGER NOT NULL
);
CREATE INDEX emails_patient ON emails(patient_id, timestamp);

CREATE TABLE feedback (
  id        TEXT PRIMARY KEY,
  user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  username  TEXT NOT NULL,
  user_type TEXT NOT NULL,
  type      TEXT NOT NULL,
  rating    INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment   TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'new',
  timestamp INTEGER NOT NULL
);

CREATE TABLE audit_log (
  id        INTEGER PRIMARY KEY,
  at        INTEGER NOT NULL,
  actor_id  TEXT,
  action    TEXT NOT NULL,
  target_id TEXT,
  ip        TEXT
);
CREATE INDEX audit_log_at ON audit_log(at);
