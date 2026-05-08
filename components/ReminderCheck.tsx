import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { checkAndSendInactivityReminder, getUsers, findUserById } from '../utils/localStorageDB.ts';
import { NotificationService } from '../services/notificationService.ts';

/**
 * Component that checks for patient inactivity and "sends" simulated reminders.
 */
export const ReminderCheck: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (!currentUser) return;

        const INACTIVITY_THRESHOLD_DAYS = 5;

        const processReminders = (userId: string) => {
            const subject = t('aiChat.reminder.emailSubject');
            const body = t('aiChat.reminder.emailBody', { username: currentUser.username });
            
            const sent = checkAndSendInactivityReminder(
                userId, 
                INACTIVITY_THRESHOLD_DAYS, 
                subject, 
                body
            );

            if (sent) {
                const user = findUserById(userId);
                if (user && NotificationService.canSendNotification(user as any, 'reminders')) {
                    NotificationService.sendNotification(
                        t('profile.notificationTypes.reminders'),
                        t('aiChat.reminder.webappMessage', { username: user.username, days: INACTIVITY_THRESHOLD_DAYS })
                    );
                }
            }
        };

        // If a patient logs in, check their own inactivity
        if (currentUser.role === 'patient') {
            processReminders(currentUser.id);
        }

        // If a therapist logs in, simulate a system-wide check
        if (currentUser.role === 'therapist') {
            const allUsers = getUsers();
            const patients = allUsers.filter(u => u.role === 'patient');
            patients.forEach(patient => processReminders(patient.id));
        }
    }, [currentUser, t]);

    return null;
};
