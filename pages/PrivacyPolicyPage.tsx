

import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';

export const PrivacyPolicyPage: React.FC = () => {
  const { t, language } = useLanguage(); 

  const getLocaleForDate = () => {
    switch(language) {
      case 'ca': return 'ca-ES';
      case 'es': return 'es-ES';
      case 'en': return 'en-US';
      default: return 'en-US'; 
    }
  };
  
  const currentDate = new Date().toLocaleDateString(getLocaleForDate(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('privacyPolicy.title')} />
      <SectionCard>
        <p className="text-sm text-gray-500 mb-6 italic">
          {t('privacyPolicy.lastUpdated', { date: currentDate })}
        </p>

        <p className="mb-4">{t('privacyPolicy.introduction')}</p>

        <h2 className="text-xl font-semibold text-sky-700 mt-6 mb-3">{t('privacyPolicy.dataCollectedHeader')}</h2>
        <p className="mb-2">{t('privacyPolicy.dataCollectedText')}</p>
        <ul className="list-disc list-inside space-y-1 mb-4 pl-4">
          <li>{t('privacyPolicy.username')}</li>
          <li>{t('privacyPolicy.emailAddress')}</li>
          <li>{t('privacyPolicy.hashedPassword')}</li>
          <li>{t('privacyPolicy.qpviiResults')}</li>
          <li>{t('privacyPolicy.consentStatus')}</li>
        </ul>

        <h2 className="text-xl font-semibold text-sky-700 mt-6 mb-3">{t('privacyPolicy.howDataUsedHeader')}</h2>
        <p className="mb-2">{t('privacyPolicy.howDataUsedText')}</p>
         <ul className="list-disc list-inside space-y-1 mb-4 pl-4">
            <li>{t('privacyPolicy.howDataUsedItem1')}</li>
            <li>{t('privacyPolicy.howDataUsedItem2')}</li>
            <li>{t('privacyPolicy.accountManagement')}</li>
        </ul>


        <h2 className="text-xl font-semibold text-sky-700 mt-6 mb-3">{t('privacyPolicy.dataStorageHeader')}</h2>
        <p className="mb-4">{t('privacyPolicy.dataStorageText')}</p>

        <h2 className="text-xl font-semibold text-sky-700 mt-6 mb-3">{t('privacyPolicy.userRightsHeader')}</h2>
        <p className="mb-4">{t('privacyPolicy.userRightsText')}</p>
         <p className="mb-4 text-sm">
            {t('privacyPolicy.userRightsGDPR')}
        </p>


        <h2 className="text-xl font-semibold text-sky-700 mt-6 mb-3">{t('privacyPolicy.securityHeader')}</h2>
        <p className="mb-4">{t('privacyPolicy.securityText')}</p>
        
        <p className="mt-4 mb-4 text-xs text-gray-500">
            {t('privacyPolicy.demoDisclaimer')}
        </p>

        <h2 className="text-xl font-semibold text-sky-700 mt-6 mb-3">{t('privacyPolicy.contactHeader')}</h2>
        <p>{t('privacyPolicy.contactText')}</p>
      </SectionCard>
    </div>
  );
};