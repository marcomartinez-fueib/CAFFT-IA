import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { translations } from '../data/translations.ts'; // Import translations

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);


export const UserGuidePage: React.FC = () => {
  const { t, language } = useLanguage(); // Destructure language

  const requirements = [
    t('userGuide.requirements.computer'),
    t('userGuide.requirements.headphones'),
    t('userGuide.requirements.skills'),
  ];
  
  // Directly access arrays from translations
  const langTranslations = translations[language].userGuide;
  const mostFrequentEffects = langTranslations.beforeUse.mostFrequent;
  const mostSeriousEffects = langTranslations.beforeUse.mostSerious;
  const doNotUseIf = langTranslations.beforeUse.doNotUseIf;
  const advantages = langTranslations.advantages.items;


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('userGuide.title')} />
       <p className="text-lg text-gray-600 mb-8">{t('userGuide.introduction')}</p>

      <SectionCard title={t('userGuide.requirements.title')}>
        <ul className="space-y-3">
          {requirements.map((item, index) => (
            <li key={index} className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {/* Image removed */}
      </SectionCard>

      <SectionCard title={t('userGuide.beforeUse.title')} titleClassName="!text-red-600 !border-red-200">
        <p className="mb-4">{t('userGuide.beforeUse.adverseEffects')}</p>
        
        <h3 className="text-lg font-semibold text-amber-700 mt-4 mb-2">ELS MÉS FREQÜENTS:</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          {Array.isArray(mostFrequentEffects) && mostFrequentEffects.map((item, index) => <li key={index}>{item}</li>)}
        </ul>

        <h3 className="text-lg font-semibold text-red-700 mt-4 mb-2">ELS MÉS GREUS:</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          {Array.isArray(mostSeriousEffects) && mostSeriousEffects.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
        
        <h3 className="text-lg font-semibold text-red-700 mt-6 mb-2">NO REALITZI EL CAFFT (Consulti abans):</h3>
         <ul className="space-y-2">
          {Array.isArray(doNotUseIf) && doNotUseIf.map((item, index) => (
            <li key={index} className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
      
      <SectionCard title={t('userGuide.howToUse.title')}>
        <p>{t('userGuide.howToUse.text')}</p>
      </SectionCard>

      <SectionCard title={t('userGuide.advantages.title')}>
        <ul className="space-y-3">
            {Array.isArray(advantages) && advantages.map((item, index) => (
                <li key={index} className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
                </li>
            ))}
        </ul>
      </SectionCard>
    </div>
  );
};