import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { getUserExposureProgress, saveUserExposureProgress, getQPVIIResultsForUser } from '../utils/localStorageDB';
import { UserExposureProgress } from '../types';

// Star Icon SVG
const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.116 3.986 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.986c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
  </svg>
);

const CheckListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export const CelebrationPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [completedSessionTimestamp, setCompletedSessionTimestamp] = useState<number | null>(null);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }
    
    setIsLoading(true);
    const timestampFromState = (location.state as { qpviiTimestamp?: number })?.qpviiTimestamp;

    if (timestampFromState !== undefined) {
      // User has just finished, and the timestamp is passed in state.
      setCompletedSessionTimestamp(timestampFromState);
      const progress = getUserExposureProgress(currentUser.id, timestampFromState);
      
      // Mark as complete ONLY if it's not already marked.
      if (progress && !progress.programCompleted) {
        saveUserExposureProgress(
          currentUser.id,
          timestampFromState,
          progress.videoSequence,
          progress.currentVideoIndex,
          progress.completedVideoIds,
          progress.discomfortRatings,
          progress.explanationShown,
          true // Explicitly set programCompleted to true
        );
      }
      setIsLoading(false);
    } else {
      // User is visiting later. Find their latest completed session.
      const userResults = getQPVIIResultsForUser(currentUser.id);
      const completedProgress = userResults
        .map(r => getUserExposureProgress(currentUser.id, r.timestamp))
        .filter((p): p is UserExposureProgress => !!p && p.programCompleted === true)
        .sort((a, b) => (b.qpviiTimestamp || 0) - (a.qpviiTimestamp || 0));

      if (completedProgress.length > 0) {
        setCompletedSessionTimestamp(completedProgress[0].qpviiTimestamp);
      } else {
        // If they land here without a completed program, redirect them home.
        navigate('/', { replace: true });
      }
      setIsLoading(false);
    }
  }, [currentUser, location, navigate]);

  if (isLoading || !currentUser) {
    return <p className="text-center p-8">{t('auth.loading')}</p>;
  }

  if (!completedSessionTimestamp) {
    // This state can be hit briefly before redirect or if something is wrong.
    return <p className="text-center p-8">{t('auth.loading')}</p>; 
  }
  
  const checklistItems = [
    'lastSession.checklistItem1', 'lastSession.checklistItem2', 'lastSession.checklistItem3', 'lastSession.checklistItem4',
    'lastSession.checklistItem5', 'lastSession.checklistItem6', 'lastSession.checklistItem7', 'lastSession.checklistItem8',
  ];

  const InstructionsModal = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ease-in-out"
      onClick={() => setIsInstructionsModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800">
            {t('lastSession.header')}
          </h2>
          <button
            onClick={() => setIsInstructionsModalOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={t('helpModal.closeButton')}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <SectionCard>
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
          <SectionCard title={t('lastSession.finalAdviceTitle')} className="mt-6 bg-amber-50 border-amber-200">
            <p>{t('lastSession.finalAdviceText')}</p>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageTitle title={t('celebration.pageTitle')} className="text-center !border-green-500" />
      
      <SectionCard className="text-center bg-gradient-to-br from-green-50 to-sky-50 shadow-2xl rounded-xl p-8 sm:p-12">
        <div className="flex justify-center mb-6">
          <StarIcon className="w-20 h-20 text-yellow-400" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-green-600 mb-4">
          {t('celebration.congratulations', { username: currentUser.username })}
        </h2>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
          {t('celebration.messageBody')}
        </p>

        <div className="my-10 space-y-8 text-left max-w-xl mx-auto">
          <div>
            <h3 className="text-xl font-semibold text-sky-700 mb-3">{t('celebration.achievementsHeader')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>{t('celebration.achievement1')}</li>
              <li>{t('celebration.achievement2')}</li>
              <li>{t('celebration.achievement3')}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-sky-700 mb-3">{t('celebration.nextStepsHeader')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>{t('celebration.nextStep1')}</li>
              <li>{t('celebration.nextStep2')}</li>
              <li>{t('celebration.nextStep3')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto py-3 px-6 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
          >
            {t('celebration.returnHomeButton')}
          </Link>
          <button
            onClick={() => setIsInstructionsModalOpen(true)}
            className="w-full sm:w-auto py-3 px-6 border border-green-500 text-green-700 rounded-lg shadow-sm text-base font-medium hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-colors"
          >
            {t('celebration.viewFlightInstructionsButton')}
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full sm:w-auto py-3 px-6 border border-red-500 text-red-600 rounded-lg shadow-sm text-base font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors"
          >
            {t('celebration.logoutButton')}
          </button>
        </div>
      </SectionCard>

      {isInstructionsModalOpen && <InstructionsModal />}
    </div>
  );
};