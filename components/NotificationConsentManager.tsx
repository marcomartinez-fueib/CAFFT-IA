
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { NotificationConsentModal } from './NotificationConsentModal.tsx';
import { NotificationService } from '../services/notificationService.ts';

export const NotificationConsentManager: React.FC = () => {
  const { currentUser, updateUser, acceptConsent } = useAuth();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only show to logged in patients who haven't set their preferences yet
    if (currentUser && currentUser.role === 'patient' && !currentUser.notificationPreferences) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handleAccept = async () => {
    const permission = await NotificationService.requestPermission();
    
    // Even if permission is denied, we record that they made a choice (enabled: false if denied)
    const initialPrefs = NotificationService.getDefaultPreferences();
    initialPrefs.enabled = permission === 'granted';
    if (initialPrefs.enabled) {
        initialPrefs.consentDate = Date.now();
    }

    await updateUser({ notificationPreferences: initialPrefs });
    // The acceptance, with the version of the text, goes to the consent record.
    if (initialPrefs.enabled) await acceptConsent('notifications');
    setShowModal(false);
    
    if (permission === 'granted') {
        NotificationService.sendNotification(
            'CAFFT 5.1',
            t('profile.notificationsEnabledMessage')
        );
    }
  };

  const handleDecline = async () => {
    // Record that they declined by setting default (enabled: false)
    const initialPrefs = NotificationService.getDefaultPreferences();
    initialPrefs.enabled = false;
    await updateUser({ notificationPreferences: initialPrefs });
    setShowModal(false);
  };

  return <NotificationConsentModal isOpen={showModal} onAccept={handleAccept} onDecline={handleDecline} />;
};
