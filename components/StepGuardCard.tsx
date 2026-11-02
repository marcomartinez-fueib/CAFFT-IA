import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from './PageTitle';
import { SectionCard } from './SectionCard';

/** Shown instead of a page whose previous step (the QPV-II) is not done yet. */
export const StepGuardCard: React.FC<{ pageTitle: string }> = ({ pageTitle }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <PageTitle title={pageTitle} />
      <SectionCard>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">{t('stepGuard.title')}</h2>
        <p className="text-gray-700 mb-6">{t('stepGuard.needsQpvii')}</p>
        <button
          onClick={() => navigate('/qpvii-evaluation')}
          className="w-full sm:w-auto py-3 px-6 rounded-lg shadow-sm text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue"
        >
          {t('stepGuard.goToQpvii')}
        </button>
      </SectionCard>
    </div>
  );
};
