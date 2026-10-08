-- Real email delivery (phase 5).

-- Outbox: business changes enqueue mail in the same transaction; a worker in
-- the API process delivers it and retries with backoff. A Microsoft Graph
-- outage therefore delays mail instead of failing the request or losing it.
CREATE TABLE outbound_mail (
  id              INTEGER PRIMARY KEY,
  to_address      TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  kind            TEXT NOT NULL,                 -- 'password_reset' | 'invitation' | 'reminder'
  created_at      INTEGER NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL,
  sent_at         INTEGER,
  failed_at       INTEGER,                       -- gave up after the last retry
  last_error      TEXT
);
CREATE INDEX outbound_mail_due ON outbound_mail(next_attempt_at) WHERE sent_at IS NULL AND failed_at IS NULL;

-- Single-use links to set a password: 'reset' (forgot password, 1 hour) and
-- 'invite' (new account, 7 days). Only the sha256 of the token is stored.
CREATE TABLE password_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose    TEXT NOT NULL CHECK (purpose IN ('reset', 'invite')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX password_tokens_user ON password_tokens(user_id);
