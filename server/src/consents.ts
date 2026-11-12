import type { Db } from './db.ts';
import { transaction } from './db.ts';
import { CONSENT_VERSIONS, type ConsentKind } from './consentVersions.ts';

export { CONSENT_VERSIONS, type ConsentKind };

/**
 * Records that the user accepted the current version of a consent text. For
 * the treatment consent it also marks the user as consenting, which the
 * clinical routes require of patients.
 */
export function recordConsent(db: Db, userId: string, kind: ConsentKind, language: string | null, metadata?: unknown): void {
  const now = Date.now();
  const version = CONSENT_VERSIONS[kind];
  transaction(db, () => {
    db.prepare('INSERT INTO consents (user_id, kind, version, accepted_at, language) VALUES (?, ?, ?, ?, ?)').run(userId, kind, version, now, language);
    if (kind === 'notifications') {
      db.prepare('UPDATE users SET notification_consent_version = ?, updated_at = ? WHERE id = ?').run(version, now, userId);
    }
    if (kind === 'treatment') {
      db.prepare(
        `UPDATE users SET consent_given = 1, treatment_consent_version = ?, treatment_consent_at = ?,
           consent_metadata = COALESCE(?, consent_metadata), updated_at = ? WHERE id = ?`,
      ).run(version, now, metadata === undefined ? null : JSON.stringify(metadata), now, userId);
    }
  });
}

/** Withdraws the notification consent: reminders stop, the history keeps the date. */
export function withdrawNotificationConsent(db: Db, userId: string, prefsJson: string | null): void {
  const now = Date.now();
  const prefs = prefsJson ? JSON.parse(prefsJson) : null;
  transaction(db, () => {
    db.prepare("UPDATE consents SET withdrawn_at = ? WHERE user_id = ? AND kind = 'notifications' AND withdrawn_at IS NULL").run(now, userId);
    db.prepare('UPDATE users SET notification_consent_version = NULL, updated_at = ? WHERE id = ?').run(now, userId);
    if (prefs) {
      prefs.enabled = false;
      db.prepare('UPDATE users SET notification_prefs = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(prefs), now, userId);
    }
  });
}

/** A patient may use the clinical features only with the current treatment consent. */
export function hasCurrentTreatmentConsent(user: { role: string; treatment_consent_version: string | null }): boolean {
  return user.role !== 'patient' || user.treatment_consent_version === CONSENT_VERSIONS.treatment;
}
