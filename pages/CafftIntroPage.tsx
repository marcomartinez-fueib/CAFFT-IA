
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { useOnboarding } from '../hooks/useOnboarding';
import { Sparkles } from 'lucide-react';
import { getQPVIIResultsForUser, getUserExposureProgress } from '../utils/localStorageDB';

const CAFFT_VIDEO_EMBED_ID = "jeVD9fmMYHE"; // YouTube Video ID

// SVG Icons
const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
  </svg>
);

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const CafftIntroPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { startTour, hasCompletedTour } = useOnboarding();
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser && !hasCompletedTour) {
        const autoStartKey = `cafft_onboarding_autostart_done_${currentUser.id}`;
        if (localStorage.getItem(autoStartKey) === 'true') return;

        localStorage.setItem(autoStartKey, 'true');
        const timer = setTimeout(() => {
            startTour();
        }, 1500);
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

  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

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
          {/* Video Preview */}
          <div 
            className="relative aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg shadow-xl overflow-hidden cursor-pointer group"
            onClick={openVideoModal}
          >
            <img 
              src={`https://img.youtube.com/vi/${CAFFT_VIDEO_EMBED_ID}/mqdefault.jpg`} 
              alt={t('cafftIntroPage.videoTitle')}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 group-hover:bg-opacity-20">
              <PlayIcon className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300" />
            </div>
          </div>
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

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeVideoModal}>
          <div 
            className="relative bg-white p-2 rounded-xl shadow-2xl w-full max-w-3xl aspect-video"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
          >
            <button
              onClick={closeVideoModal}
              className="absolute -top-3 -right-3 sm:top-2 sm:right-2 z-10 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-uib-blue"
              aria-label="Close video"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="w-full h-full bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${CAFFT_VIDEO_EMBED_ID}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};