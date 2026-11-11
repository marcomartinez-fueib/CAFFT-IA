
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { useOnboarding } from '../hooks/useOnboarding';
import { Sparkles } from 'lucide-react';
import { getQPVIIResultsForUser, getUserExposureProgress } from '../services/dataStore';
import { HelpVideoPlayer } from '../components/HelpVideoPlayer';

export const CafftIntroPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { startTour, hasCompletedTour } = useOnboarding();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !hasCompletedTour) {
        // Wait for notification consent to be resolved before auto-starting the tour.
        // The NotificationConsentManager modal appears on the same page and they would
        // overlap if the tour started immediately. Once the modal is dismissed,
        // updateUser() creates a new currentUser reference, re-triggering this effect.
        if (!currentUser.notificationPreferences) return;

        const autoStartKey = `cafft_onboarding_autostart_done_${currentUser.id}`;
        if (localStorage.getItem(autoStartKey) === 'true') return;

        localStorage.setItem(autoStartKey, 'true');
        const timer = setTimeout(() => {
            startTour();
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [currentUser, hasCompletedTour, startTour]);

  useEffect(() => {
    if (currentUser) {
        const userResults = getQPVIIResultsForUser(currentUser.id);
        const hasCompletedProgram = userResults.some(r => {
            const progress = getUserExposureProgress(currentUser.id, r.timestamp);
            return progress?.programCompleted === true;
        });

        if (hasCompletedProgram) {
            navigate('/celebration', { replace: true });
        }
    }
  }, [currentUser, navigate]);

  const handleProceed = () => {
    navigate('/qpvii-evaluation');
  };

  const welcomeMessage = currentUser 
    ? t('cafftIntroPage.welcomeMessage', { username: currentUser.username }) 
    : t('cafftIntroPage.title');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('cafftIntroPage.title')} />
      
      <SectionCard className="rounded-xl shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {welcomeMessage}
        </h2>
        <p className="mb-6 text-gray-700 leading-relaxed">
          {t('cafftIntroPage.explanationText')}
        </p>

        <div className="my-8">
          <h3 className="text-xl font-semibold text-uib-blue mb-4">
            {t('cafftIntroPage.videoTitle')}
          </h3>
          <HelpVideoPlayer id="P01" className="max-w-2xl mx-auto" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
            onClick={handleProceed}
            className="flex-grow flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue transition-colors"
            >
            {t('cafftIntroPage.proceedButton')}
            </button>
            <button
            onClick={() => startTour('patient')}
            className="flex justify-center items-center py-3 px-6 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue transition-colors"
            >
            <Sparkles className="w-5 h-5 mr-2 text-uib-blue" />
            {t('onboarding.startManual')}
            </button>
        </div>
      </SectionCard>

    </div>
  );
};