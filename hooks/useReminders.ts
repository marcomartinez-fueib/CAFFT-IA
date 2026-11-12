import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { NotificationService } from '../services/notificationService';
import { CONSENT_VERSIONS } from '../consent';

/**
 * The patient's reminders (server/src/reminders.ts): on when they accepted the
 * current notification consent and did not switch reminders off. Turning them
 * on is accepting that consent; turning them off, withdrawing it.
 */
export function useReminders() {
  const { currentUser, updateUser, acceptConsent, withdrawNotificationConsent } = useAuth();
  const prefs = currentUser?.notificationPreferences;
  const on = !!prefs?.enabled && prefs.reminders !== false && currentUser?.notificationConsentVersion === CONSENT_VERSIONS.notifications;

  const turnOn = useCallback(async (): Promise<boolean> => {
    const next = { ...(prefs ?? NotificationService.getDefaultPreferences()), enabled: true, reminders: true, consentDate: Date.now() };
    if (!(await updateUser({ notificationPreferences: next }))) return false;
    return (await acceptConsent('notifications')).success;
  }, [prefs, updateUser, acceptConsent]);

  /** Declining the dialog records the choice, so it is not asked again. */
  const decline = useCallback(async (): Promise<boolean> => {
    const next = { ...(prefs ?? NotificationService.getDefaultPreferences()), enabled: false, consentDate: undefined };
    if (!(await updateUser({ notificationPreferences: next }))) return false;
    return currentUser?.notificationConsentVersion ? withdrawNotificationConsent() : true;
  }, [prefs, updateUser, withdrawNotificationConsent, currentUser?.notificationConsentVersion]);

  return { on, turnOn, decline };
}
