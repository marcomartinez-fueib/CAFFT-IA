import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { checkAndSendInactivityReminder, sendAdherenceRemindersToAllInactive } from '../services/dataStore.ts';
import { NotificationService } from '../services/notificationService.ts';

const INACTIVITY_THRESHOLD_DAYS = 5;

/**
 * Records inactivity reminders when someone logs in. The server decides who is
 * inactive and enforces a gap between reminders; the emails are still only
 * recorded, not sent (docs/backend/PLAN.md, phase 5).
 */
export const ReminderCheck: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (!currentUser) return;

        const subject = t('aiChat.reminder.emailSubject');
        // Left with its {username} placeholder: the server fills it in per patient.
        const bodyTemplate = t('aiChat.reminder.emailBody');

        // A patient logging in: check their own inactivity.
        if (currentUser.role === 'patient') {
            checkAndSendInactivityReminder(currentUser.id, INACTIVITY_THRESHOLD_DAYS, subject, bodyTemplate).then(sent => {
                if (sent && NotificationService.canSendNotification(currentUser, 'reminders')) {
                    NotificationService.sendNotification(
                        t('profile.notificationTypes.reminders'),
                        t('aiChat.reminder.webappMessage', { username: currentUser.username, days: INACTIVITY_THRESHOLD_DAYS })
                    );
                }
            });
        }

        // A therapist logging in: check all their patients at once.
        if (currentUser.role === 'therapist') {
            void sendAdherenceRemindersToAllInactive(currentUser.id, INACTIVITY_THRESHOLD_DAYS, subject, bodyTemplate);
        }
    }, [currentUser, t]);

    return null;
};
