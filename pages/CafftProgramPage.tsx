import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';

export const CafftProgramPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('cafftProgram.title')} />
      <p className="text-lg text-gray-600 mb-8">{t('cafftProgram.introduction')}</p>

      <SectionCard title={t('cafftProgram.specificInfo.title')}>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-sky-600 mb-2">{t('cafftProgram.specificInfo.whatIsCAFFT')}</h3>
            <p>{t('cafftProgram.specificInfo.whatIsCAFFT_desc')}</p>
            {/* Image removed */}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-sky-600 mb-2">{t('cafftProgram.specificInfo.howItWorks')}</h3>
            <p>{t('cafftProgram.specificInfo.howItWorks_desc')}</p>
             {/* Image removed */}
          </div>
           <div>
            <h3 className="text-xl font-semibold text-sky-600 mb-2">{t('cafftProgram.specificInfo.onlineInterview')}</h3>
            <p>{t('cafftProgram.specificInfo.onlineInterview')}</p>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              to="/scientific-foundation"
              className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 ease-in-out"
            >
              {t('cafftProgram.linkToScientificFoundation')}
            </Link>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};