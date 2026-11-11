-- Versioned consent: which text each user accepted, and when. Until now only
-- users.consent_given existed, with no date and no version of the text, and
-- patients registered by a therapist were stored as consenting without ever
-- seeing the consent (they never went through the registration form).

CREATE TABLE consents (
  id           INTEGER PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('treatment', 'notifications')),
  version      TEXT NOT NULL,                 -- consent.ts CONSENT_VERSIONS at the time
  accepted_at  INTEGER NOT NULL,
  withdrawn_at INTEGER,
  language     TEXT                           -- language the text was shown in
);
CREATE INDEX consents_user ON consents(user_id, kind);

-- Patients who registered themselves accepted the text in force before
-- versioning; they are asked again for the current version.
INSERT INTO consents (user_id, kind, version, accepted_at)
SELECT id, 'treatment', 'pre-2026-11', created_at FROM users
WHERE role = 'patient' AND consent_given = 1 AND consent_metadata IS NOT NULL;

-- Patients created from the panel never saw the consent.
UPDATE users SET consent_given = 0 WHERE role = 'patient' AND consent_metadata IS NULL;

-- Notification consent given in the app's dialog (it recorded the date).
INSERT INTO consents (user_id, kind, version, accepted_at)
SELECT id, 'notifications', 'pre-2026-11', json_extract(notification_prefs, '$.consentDate') FROM users
WHERE json_extract(notification_prefs, '$.consentDate') IS NOT NULL
  AND json_extract(notification_prefs, '$.enabled') = 1;

-- The current treatment consent of each user, kept on the user so every API
-- answer can say whether they must accept it again (the history is above).
ALTER TABLE users ADD COLUMN treatment_consent_version TEXT;
ALTER TABLE users ADD COLUMN treatment_consent_at INTEGER;
UPDATE users SET
  treatment_consent_version = (SELECT version FROM consents c WHERE c.user_id = users.id AND c.kind = 'treatment' ORDER BY accepted_at DESC LIMIT 1),
  treatment_consent_at = (SELECT accepted_at FROM consents c WHERE c.user_id = users.id AND c.kind = 'treatment' ORDER BY accepted_at DESC LIMIT 1);
