-- The session planner and the reminders the server sends by itself.
--
-- A plan is the patient's week: the days and the hour of each session, e.g.
-- [{"day":1,"time":"18:00"},{"day":4,"time":"18:00"}] (day 0 = Sunday), in the
-- clinic's time zone (Europe/Madrid). It holds until the programme ends.

CREATE TABLE session_plans (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slots      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Every reminder sent, so none goes twice: `key` is the local date of the
-- session ('2027-01-18') or, for inactivity, of the day it was sent; for the
-- question about the real flight, the date of the flight.
CREATE TABLE reminders_sent (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL CHECK (kind IN ('session', 'inactivity', 'flight')),
  key     TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, key)
);

-- Browsers that receive push notifications (Web Push). A subscription the
-- push service reports as gone is deleted.
CREATE TABLE push_subscriptions (
  endpoint   TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX push_subscriptions_user ON push_subscriptions(user_id);

-- For the «stop these reminders» link in every reminder email: it works
-- without logging in, so it carries a secret of its own.
ALTER TABLE users ADD COLUMN unsubscribe_token TEXT;
CREATE UNIQUE INDEX users_unsubscribe_token ON users(unsubscribe_token);

-- The version of the notification consent each user accepted, kept on the
-- user (like the treatment one) so the app can ask again when the text changes.
ALTER TABLE users ADD COLUMN notification_consent_version TEXT;
UPDATE users SET notification_consent_version = (
  SELECT version FROM consents c WHERE c.user_id = users.id AND c.kind = 'notifications' AND c.withdrawn_at IS NULL
  ORDER BY accepted_at DESC LIMIT 1
);
