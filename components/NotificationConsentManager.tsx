import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useReminders } from '../hooks/useReminders.ts';
import { needsNotificationConsent, needsTreatmentConsent } from '../consent.ts';
import { NotificationConsentModal } from './NotificationConsentModal.tsx';
import { enablePush } from '../services/push.ts';

/**
 * Asks a patient once whether they want reminders, and again when the text
 * of that consent changes. Accepting also offers notifications on this
 * device, which the browser asks about separately.
 */
export const NotificationConsentManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { turnOn, decline } = useReminders();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'patient' || needsTreatmentConsent(currentUser)) return;
    if (currentUser.notificationPreferences && !needsNotificationConsent(currentUser)) return;
    const timer = setTimeout(() => setShowModal(true), 1500);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleAccept = async () => {
    setShowModal(false);
    if (await turnOn()) await enablePush().catch(() => undefined);
  };

  const handleDecline = async () => {
    setShowModal(false);
    await decline();
  };

  return <NotificationConsentModal isOpen={showModal} onAccept={handleAccept} onDecline={handleDecline} />;
};
