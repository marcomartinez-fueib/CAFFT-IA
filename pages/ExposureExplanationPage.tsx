

import React, { useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { QPVIIScores, UserExposureProgress } from '../types';
import { getUserExposureProgress, saveUserExposureProgress } from '../utils/localStorageDB';
import { EXPOSURE_EXPLANATION_VIDEO_URL_BASE } from '../constants';

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

export const ExposureExplanationPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { qpviiTimestamp, scores } = (location.state as { qpviiTimestamp?: number; scores?: QPVIIScores }) || {};

  if (!qpviiTimestamp || !scores || !currentUser) {
    // Should not happen if navigation is correct, but handle gracefully
    navigate('/qpvii-evaluation', { replace: true, state: { message: "Error: Missing data for exposure explanation."} });
    return null;
  }
  
  const [fallbackAttempted, setFallbackAttempted] = useState(0);
  const DEMO_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  const getLocalizedVideoUrl = useCallback((basePath: string): string => {
    if (fallbackAttempted >= 1) return DEMO_VIDEO_URL;
    return `${basePath}_${language}.mp4`;
  }, [language, fallbackAttempted]);

  const handleUseDemoVideo = () => {
    setVideoError(null);
    if (videoRef.current) {
        videoRef.current.src = DEMO_VIDEO_URL;
        videoRef.current.play().catch(e => console.warn("Video play failed:", e));
    }
  };

  const handleProceed = () => {
    const progress = getUserExposureProgress(currentUser.id, qpviiTimestamp);
    if (progress) {
      const updatedProgress: UserExposureProgress = {
        ...progress,
        explanationShown: true,
        lastUpdated: Date.now(),
      };
      saveUserExposureProgress(
        currentUser.id,
        qpviiTimestamp,
        updatedProgress.videoSequence,
        updatedProgress.currentVideoIndex,
        updatedProgress.completedVideoIds,
        updatedProgress.discomfortRatings,
        true // Explicitly set explanationShown to true
      );
    } else {
      console.warn("ExposureExplanationPage: No existing progress found, proceeding might lead to issues if ExposurePage doesn't initialize it.");
    }
    
    navigate('/exposure', { 
      state: { 
        qpviiTimestamp, 
        scores,
        fromExplanation: true 
      },
      replace: true
    });
  };

  const openVideoModal = () => {
      setVideoError(null);
      setIsVideoModalOpen(true);
  };
  const closeVideoModal = () => setIsVideoModalOpen(false);

  const sections = [
    { titleKey: 'exposureExplanation.section1Title', textKey: 'exposureExplanation.section1Text' },
    { 
      titleKey: 'exposureExplanation.section2Title', 
      subsections: [
        { subtitleKey: 'exposureExplanation.section2SubtitleHabituation', textKey: 'exposureExplanation.section2TextHabituation' },
        { subtitleKey: 'exposureExplanation.section2SubtitleExtinction', textKey: 'exposureExplanation.section2TextExtinction' },
        { subtitleKey: 'exposureExplanation.section2SubtitleInhibitory', textKey: 'exposureExplanation.section2TextInhibitory' },
      ]
    },
    { 
      titleKey: 'exposureExplanation.section3Title', 
      points: [
        'exposureExplanation.section3Point1Active',
        'exposureExplanation.section3Point2Stay',
        'exposureExplanation.section3Point3Rate',
        'exposureExplanation.section3Point4Repeat',
      ]
    },
    { 
      titleKey: 'exposureExplanation.section4Title', 
      texts: [
        'exposureExplanation.section4TextInitialAnxiety',
        'exposureExplanation.section4TextGradualDecrease',
        'exposureExplanation.section4TextTemporaryFluctuations',
      ]
    },
  ];

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageTitle title={t('exposureExplanation.pageTitle')} />
        <SectionCard className="prose-p:text-gray-800 prose-li:text-gray-800 prose-headings:text-sky-700">
          <p className="lead text-lg text-gray-700 mb-6">{t('exposureExplanation.introParagraph1')}</p>

          <div className="my-8 not-prose">
            <h3 className="text-xl font-semibold text-[#BA0C2F] mb-4">
              {t('exposureExplanation.videoTitle')}
            </h3>
            <div 
              className="relative aspect-video w-full max-w-lg mx-auto bg-slate-800 rounded-lg shadow-xl overflow-hidden cursor-pointer group border-2 border-slate-700"
              onClick={openVideoModal}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 group-hover:bg-opacity-20">
                <PlayIcon className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300" />
              </div>
               <div className="absolute bottom-0 left-0 p-4">
                  <p className="text-white font-semibold">{t('exposureExplanation.videoTitle')}</p>
              </div>
            </div>
          </div>

          {sections.map((section, idx) => (
            <div key={idx} className="mt-6 py-4 border-t border-slate-200 first:border-t-0 first:pt-0">
              <h2 className="text-2xl font-semibold text-sky-700 mb-3">{t(section.titleKey)}</h2>
              {section.textKey && <p className="text-gray-700 leading-relaxed mb-4">{t(section.textKey)}</p>}
              
              {section.subsections && section.subsections.map((sub, subIdx) => (
                <div key={subIdx} className="ml-4 mb-4">
                  <h3 className="text-xl font-medium text-sky-600 mb-1">{t(sub.subtitleKey)}</h3>
                  <p className="text-gray-700 leading-relaxed">{t(sub.textKey)}</p>
                </div>
              ))}

              {section.points && (
                <ul className="list-disc list-outside space-y-2 pl-5 mb-4 text-gray-700">
                  {section.points.map((pointKey, pointIdx) => (
                    <li key={pointIdx} className="leading-relaxed">{t(pointKey)}</li>
                  ))}
                </ul>
              )}

              {section.texts && section.texts.map((textKey, textIdx) => (
                <p key={textIdx} className="text-gray-700 leading-relaxed mb-3">{t(textKey)}</p>
              ))}
            </div>
          ))}

          <button
            onClick={handleProceed}
            className="mt-10 w-full sm:w-auto flex justify-center items-center py-3 px-8 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            {t('exposureExplanation.proceedButton')}
          </button>
        </SectionCard>
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeVideoModal}>
          <div 
            className="relative bg-white p-3 sm:p-4 rounded-xl shadow-2xl w-full max-w-2xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideoModal}
              className="absolute -top-3 -right-3 sm:top-2 sm:right-2 z-10 p-2 bg-white rounded-full text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#BA0C2F]"
              aria-label="Close video"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="w-full h-full bg-black rounded-lg overflow-hidden">
             {videoError ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-red-100 text-red-700 p-4 text-center">
                    <p className="font-bold text-lg">{t('exposure.videoLoadErrorTitle')}</p>
                    <p className="mt-2 text-sm">{t('exposure.videoLoadErrorBody')}</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button 
                            onClick={handleUseDemoVideo} 
                            className="px-5 py-2 bg-uib-blue text-white rounded-md text-xs font-bold hover:bg-[#004C8C] shadow-sm uppercase"
                        >
                            {t('exposure.testWithDemoVideoButton') || 'Provar amb Vídeo Demo'}
                        </button>
                        <button 
                            onClick={() => navigate('/exposure', { state: { qpviiTimestamp, scores } })} 
                            className="px-5 py-2 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 shadow-sm uppercase"
                        >
                            {t('exposure.simulateViewingButton') || 'Continuar sense vídeo'}
                        </button>
                    </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={getLocalizedVideoUrl(EXPOSURE_EXPLANATION_VIDEO_URL_BASE)}
                  controls
                  autoPlay
                  className="w-full h-full"
                  onError={(e) => {
                      console.error("Video load error:", e);
                      if (fallbackAttempted < 1) {
                        setFallbackAttempted(prev => prev + 1);
                        return;
                      }
                      setVideoError(t('exposure.videoLoadErrorBody'));
                  }}
                >
                  {t('exposure.videoTagNotSupported')}
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};