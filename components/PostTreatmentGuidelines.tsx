
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { SectionCard } from './SectionCard';

export const PostTreatmentGuidelines: React.FC = () => {
  const { t } = useLanguage();

  // Array of the specific instruction item keys
  const instructionItemKeys = [
    'postTreatment.instructionItem1',
    'postTreatment.instructionItem2',
    'postTreatment.instructionItem3',
    'postTreatment.instructionItem4',
    'postTreatment.instructionItem5',
    'postTreatment.instructionItem6',
    'postTreatment.instructionItem8',
  ];

  return (
    <SectionCard title={t('postTreatment.sessionTitle')} className="mt-10 bg-amber-50 border-amber-200">
      <h3 className="text-xl font-semibold text-sky-700 mt-2 mb-3">
        {t('postTreatment.instructionsTitle')}
      </h3>
      <p className="mb-4 text-sm italic text-gray-700">{t('postTreatment.introQuestion')}</p>
      
      <ul className="list-disc list-inside space-y-2 pl-4 mb-6 text-gray-700 text-sm">
        {instructionItemKeys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-gray-600 leading-relaxed">
        {t('postTreatment.nervousnessAdvice')}
      </p>
    </SectionCard>
  );
};
