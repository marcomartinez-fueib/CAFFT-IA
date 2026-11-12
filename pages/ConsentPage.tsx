import React from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { ConsentForm } from '../components/ConsentForm.tsx';

/**
 * Shown instead of any patient page until the patient has accepted the
 * current informed consent (consent.ts), when the text has changed since they
 * accepted it. New patients see it as the first step of the welcome.
 */
export const ConsentPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <PageTitle title={t('consentGate.title')} />
      <SectionCard>
        <p className="text-gray-700 mb-6">
          {t(currentUser?.treatmentConsent ? 'consentGate.introUpdated' : 'consentGate.intro')}
        </p>
        <ConsentForm />
      </SectionCard>
    </div>
  );
};
