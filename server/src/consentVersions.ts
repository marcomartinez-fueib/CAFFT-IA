/**
 * Versions of the consent texts in force. A patient must have accepted the
 * current version to use the app; changing a text means bumping its version
 * here, which asks every patient again (server/test/consent.test.ts fails if
 * a text changes without it). Shared by the app (through ../../consent.ts)
 * and the API.
 *
 *   treatment       informedConsent.consentText + legalText
 *   notifications   the notification consent dialog (since 2026-12: email
 *                   reminders and optional push, src/reminders.ts)
 */
export const CONSENT_VERSIONS = {
  treatment: '2026-11',
  notifications: '2026-12',
} as const;

export type ConsentKind = keyof typeof CONSENT_VERSIONS;

/** True for a patient whose reminders are on under an older notification text: ask again. */
export function needsNotificationConsent(user: { role: string; notificationConsentVersion?: string; notificationPreferences?: { enabled?: boolean } } | null | undefined): boolean {
  return !!user && user.role === 'patient' && !!user.notificationPreferences?.enabled && user.notificationConsentVersion !== CONSENT_VERSIONS.notifications;
}

/** True for a patient who has not accepted the current informed consent. */
export function needsTreatmentConsent(user: { role: string; treatmentConsent?: { version: string } } | null | undefined): boolean {
  return !!user && user.role === 'patient' && user.treatmentConsent?.version !== CONSENT_VERSIONS.treatment;
}
