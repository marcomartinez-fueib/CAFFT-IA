import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { UserExposureProgress } from '../types';
import { getUserExposureProgress } from '../utils/localStorageDB';

const CheckListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const AirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


export const LastSessionPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState<UserExposureProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { qpviiTimestamp } = (location.state as { qpviiTimestamp?: number }) || {};

  useEffect(() => {
    if (!currentUser || qpviiTimestamp === undefined) {
      navigate('/cafft-intro', { replace: true });
      return;
    }

    const userProgress = getUserExposureProgress(currentUser.id, qpviiTimestamp);
    if (!userProgress) {
        console.error("Progress not found for the given timestamp.");
        navigate('/evolution', { replace: true });
        return;
    }
    
    setProgress(userProgress);
    setIsLoading(false);

  }, [currentUser, qpviiTimestamp, navigate]);

  const handleReview = () => {
    if (progress && !progress.reviewCompleted) {
        navigate('/review-selection', { 
            state: { qpviiTimestamp: progress.qpviiTimestamp }
        });
    }
  };

  const handleEvaluation = () => {
    if (progress) {
        navigate('/qpvii-evaluation', {
            state: {
                isPostExposureEval: true,
                originalQpviiTimestamp: progress.qpviiTimestamp
            }
        });
    }
  };

  if (isLoading || !progress) {
    return <div className="container mx-auto p-8 text-center">{t('auth.loading')}</div>;
  }

  const checklistItems = [
    'lastSession.checklistItem1', 'lastSession.checklistItem2', 'lastSession.checklistItem3', 'lastSession.checklistItem4',
    'lastSession.checklistItem5', 'lastSession.checklistItem6', 'lastSession.checklistItem7', 'lastSession.checklistItem8',
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <AirplaneIcon className="w-20 h-20 text-sky-500 mx-auto" />
        <PageTitle title={t('lastSession.pageTitle')} className="!border-sky-500" />
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">{t('lastSession.pageSubtitle')}</p>
      </div>

      <SectionCard title={t('lastSession.header')} titleClassName="text-center">
        <p className="text-center italic mb-6">{t('lastSession.intro')}</p>
        <ul className="space-y-3">
          {checklistItems.map((itemKey) => (
            <li key={itemKey} className="flex items-start p-3 bg-slate-50 rounded-lg">
              <CheckListIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>{t(itemKey)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={t('lastSession.finalAdviceTitle')} className="bg-amber-50 border-amber-200">
        <p>{t('lastSession.finalAdviceText')}</p>
      </SectionCard>

      <SectionCard title={t('lastSession.actionsTitle')} className="bg-slate-100">
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleReview}
            disabled={progress.reviewCompleted}
            title={progress.reviewCompleted ? t('lastSession.reviewDoneButtonTooltip') : t('lastSession.reviewButtonTooltip')}
            className={`w-full md:w-auto flex-1 text-center py-3 px-6 border rounded-lg shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                ${progress.reviewCompleted 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300' 
                    : 'bg-white text-sky-700 border-sky-600 hover:bg-sky-50 focus:ring-sky-500'
                }`}
          >
            {progress.reviewCompleted ? t('lastSession.reviewDoneButton') : t('lastSession.reviewButton')}
          </button>
          
          <button
            onClick={handleEvaluation}
            title={t('lastSession.evaluationButtonTooltip')}
            className="w-full md:w-auto flex-1 text-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            {t('lastSession.evaluationButton')}
          </button>
        </div>
      </SectionCard>
    </div>
  );
};
