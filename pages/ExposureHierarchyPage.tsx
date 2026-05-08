

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { ExposureVideo, QPVIIScores, ExposureSceneKey, QPVIIAnswers } from '../types';
import { EXPOSURE_VIDEOS } from '../constants';
import { getUserExposureProgress, saveUserExposureProgress } from '../utils/localStorageDB'; 
import { determineVideoSequence, calculatePhaseScores } from '../utils/exposureUtils';

// --- Icons for visual feedback ---
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-5.95Z" clipRule="evenodd" />
  </svg>
);

const PlayCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
  </svg>
);

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);


export const ExposureHierarchyPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [videoSequence, setVideoSequence] = useState<ExposureVideo[]>([]);
  const [qpviiTimestamp, setQpviiTimestamp] = useState<number | null>(null);
  const [qpviiScores, setQpviiScores] = useState<QPVIIScores | null>(null);
  const [qpviiAnswers, setQpviiAnswers] = useState<QPVIIAnswers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedVideoIdsInHierarchy, setCompletedVideoIdsInHierarchy] = useState<string[]>([]);
  const [currentVideoIndexInHierarchy, setCurrentVideoIndexInHierarchy] = useState<number>(0);


  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const state = location.state as { qpviiTimestamp: number, scores: QPVIIScores, answers: QPVIIAnswers };
    if (state && state.qpviiTimestamp && state.scores) {
      const currentQpviiTimestamp = state.qpviiTimestamp;
      setQpviiTimestamp(currentQpviiTimestamp);
      setQpviiScores(state.scores);
      setQpviiAnswers(state.answers);

      const progress = getUserExposureProgress(currentUser.id, currentQpviiTimestamp);
      
      // Calculate what the sequence SHOULD be with current logic (Phase-based Average)
      // Must use answers. If answers are missing (legacy data), it returns [] or generic.
      const freshSequence = determineVideoSequence(state.answers);

      if (progress) {
        // Check if exposure hasn't really started (index 0, no completed videos).
        // If so, we overwrite with fresh logic to correct any stale/legacy sequences (e.g. Sum-based).
        const hasStarted = progress.currentVideoIndex > 0 || (progress.completedVideoIds && progress.completedVideoIds.length > 0);

        if (!hasStarted) {
            setVideoSequence(freshSequence);
            // Persist the corrected sequence
            saveUserExposureProgress(
                currentUser.id,
                currentQpviiTimestamp,
                freshSequence.map(v => v.id),
                0,
                [],
                progress.discomfortRatings || [],
                progress.explanationShown,
                false
            );
        } else {
            // If started, we must respect the stored sequence to avoid breaking continuity
            if (progress.videoSequence && progress.videoSequence.length > 0) {
                const mappedSequence = progress.videoSequence.map(videoId => {
                    const videoDetails = EXPOSURE_VIDEOS.find(v => v.id === videoId);
                    // Ensure relatedArea is a valid ExposureSceneKey, provide a default if not.
                    const relatedAreaDefault: ExposureSceneKey = 'psychoed'; // Or any other suitable default
                    return videoDetails || { 
                        id: videoId, 
                        mp4Url: '', 
                        titleKey: 'exposureHierarchy.noVideosInSequence', 
                        descriptionKey: '', 
                        relatedArea: relatedAreaDefault, 
                        intensity: 0 
                    }; 
                });
                setVideoSequence(mappedSequence);
            } else {
                 // Fallback if progress exists but sequence is empty
                 setVideoSequence(freshSequence);
            }
        }
        setCompletedVideoIdsInHierarchy(progress.completedVideoIds || []);
        setCurrentVideoIndexInHierarchy(progress.currentVideoIndex || 0);
      } else {
        // New progress, use fresh sequence
        setVideoSequence(freshSequence);
        setCompletedVideoIdsInHierarchy([]); 
        setCurrentVideoIndexInHierarchy(0);
      }

    } else {
      // If essential state is missing, redirect
      navigate('/qpvii-evaluation', {state: {message: t("qpvii.allFieldsRequiredError") + " (missing state for hierarchy)"}});
    }
    setIsLoading(false);
  }, [currentUser, location, navigate, t]);

  const handleStartExposure = () => {
    if (qpviiTimestamp && qpviiScores) {
      // Pass answers as well if needed by ExposurePage (though it mostly uses stored sequence now)
      navigate('/exposure', { state: { qpviiTimestamp, scores: qpviiScores, answers: qpviiAnswers } });
    }
  };

  if (isLoading || !currentUser) {
    return <div className="container mx-auto p-8 text-center">{t('auth.loading')}</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('exposureHierarchy.pageTitle')} />
      <SectionCard>
        <p className="mb-6 text-gray-700">{t('exposureHierarchy.introText')}</p>
        
        <div className="mb-8 p-4 bg-sky-50 border border-sky-200 rounded-lg">
            <div className="flex items-start mb-4">
                <InfoIcon className="w-6 h-6 text-sky-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-sky-800 text-sm mb-1">{t('exposureHierarchy.hierarchyLogicTitle')}</h4>
                    <p className="text-sm text-sky-700">{t('exposureHierarchy.hierarchyLogicText')}</p>
                </div>
            </div>
            {qpviiScores && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div className="bg-white/60 p-2 rounded border border-sky-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">{t('qpvii.subPreparatiusScore')}</p>
                        <p className="text-lg font-black text-sky-900">{qpviiScores.subPreparatius}</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded border border-sky-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">{t('qpvii.subVolScore')}</p>
                        <p className="text-lg font-black text-sky-900">{qpviiScores.subVol}</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded border border-sky-100 text-center">
                        <p className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">{t('qpvii.subVicariScore')}</p>
                        <p className="text-lg font-black text-sky-900">{qpviiScores.subVicari}</p>
                    </div>
                </div>
            )}
        </div>

        {videoSequence.length > 0 ? (
          <>
            <h3 className="text-xl font-semibold text-uib-blue mb-4">{t('exposureHierarchy.videoSequenceTitle')}</h3>
            <ul className="space-y-4 mb-8 pl-0 list-none">
              {videoSequence.map((video, index) => {
                const isCompleted = completedVideoIdsInHierarchy.includes(video.id);
                const isCurrent = index === currentVideoIndexInHierarchy && !isCompleted;

                let itemStyle = 'bg-slate-50 border-slate-200 text-slate-700';
                let textStyle = '';
                let icon = (
                  <div className="flex-shrink-0 w-7 h-7 mr-3.5 rounded-full bg-slate-300 flex items-center justify-center border-2 border-white ring-1 ring-slate-400">
                    <span className="text-xs font-bold text-slate-600">{index + 1}</span>
                  </div>
                );

                if (isCompleted) {
                  itemStyle = 'bg-green-100/60 border-green-200 text-slate-500';
                  textStyle = 'line-through decoration-green-500';
                  icon = <CheckCircleIcon className="h-7 w-7 text-green-500 mr-3.5 flex-shrink-0" />;
                } else if (isCurrent) {
                  itemStyle = 'bg-sky-100/60 border-uib-blue ring-2 ring-sky-500/30';
                  textStyle = 'font-bold text-uib-blue';
                  icon = <PlayCircleIcon className="h-7 w-7 text-uib-blue mr-3.5 flex-shrink-0 animate-pulse" />;
                }

                const phaseScores = calculatePhaseScores(qpviiAnswers || undefined);

                return (
                  <li key={video.id}>
                    <div className={`p-4 rounded-lg shadow-sm flex items-center transition-all duration-300 border ${itemStyle}`}>
                      {icon}
                      <span className={`flex-grow ${textStyle}`}>
                        {t(video.titleKey)}
                      </span>
                      {phaseScores[video.relatedArea] !== undefined && (
                        <span className="ml-3 px-2 py-1 bg-sky-100 text-sky-800 rounded-md font-bold text-xs whitespace-nowrap shadow-sm border border-sky-200">
                          {phaseScores[video.relatedArea].toFixed(1)} / 9
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleStartExposure}
                className="w-full sm:w-auto flex-1 justify-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                {t('exposureHierarchy.startExposureButton')}
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600">{t('exposureHierarchy.noVideosInSequence')}</p>
        )}
      </SectionCard>
    </div>
  );
};