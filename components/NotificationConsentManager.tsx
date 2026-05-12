
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useOnboarding } from '../hooks/useOnboarding.tsx';
import { NotificationConsentModal } from './NotificationConsentModal.tsx';
import { NotificationService } from '../services/notificationService.ts';

export const NotificationConsentManager: React.FC = () => {
  const { currentUser, updateUser } = useAuth();
  const { startTour } = useOnboarding();
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

  const launchOnboarding = () => {
    // Small delay so the modal exit animation finishes before the tour overlay appears
    setTimeout(() => {
      startTour('patient', currentUser?.id, false);
    }, 300);
  };

  const handleAccept = async () => {
    const permission = await NotificationService.requestPermission();
    
    // Even if permission is denied, we record that they made a choice (enabled: false if denied)
    const initialPrefs = NotificationService.getDefaultPreferences();
    initialPrefs.enabled = permission === 'granted';
    if (initialPrefs.enabled) {
        initialPrefs.consentDate = Date.now();
    }

    await updateUser({ notificationPreferences: initialPrefs });
    setShowModal(false);
    
    if (permission === 'granted') {
        NotificationService.sendNotification(
            'CAFFT 5.1',
            'Notificacions activades amb èxit. Gràcies per la teva confiança!'
        );
    }

    launchOnboarding();
  };

  const handleDecline = async () => {
    // Record that they declined by setting default (enabled: false)
    const initialPrefs = NotificationService.getDefaultPreferences();
    initialPrefs.enabled = false;
    await updateUser({ notificationPreferences: initialPrefs });
    setShowModal(false);

    launchOnboarding();
  };

  return <NotificationConsentModal isOpen={showModal} onAccept={handleAccept} onDecline={handleDecline} />;
};
