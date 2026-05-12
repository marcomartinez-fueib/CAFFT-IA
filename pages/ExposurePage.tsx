
import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { ExposureVideo, QPVIIScores, VideoDiscomfortRating, UserExposureProgress, ExposureSceneKey, QPVIIAnswers } from '../types';
import { saveUserExposureProgress, getUserExposureProgress, getQPVIIResultsForUser, getCircularReplacer } from '../utils/localStorageDB';
import { determineVideoSequence, isExposureFullyCompleted } from '../utils/exposureUtils';
import { EXPOSURE_VIDEOS, CANONICAL_FLIGHT_STAGES_ORDER, getVideoUrl } from '../constants';
import { FollowUpService } from '../services/followUpService.ts';
import { ExposureSessionProgress } from '../components/ExposureSessionProgress';

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

interface FeedbackMessage {
  text: string;
  type: 'success' | 'warning' | 'info';
}

export const ExposurePage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [videoSequence, setVideoSequence] = useState<ExposureVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [completedVideoIds, setCompletedVideoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoPlayerModalOpen, setIsVideoPlayerModalOpen] = useState(false);
  const [qpviiTimestampForExposure, setQpviiTimestampForExposure] = useState<number | null>(null);
  
  const [isDiscomfortRatingModalOpen, setIsDiscomfortRatingModalOpen] = useState(false);
  const [currentVideoForRating, setCurrentVideoForRating] = useState<ExposureVideo | null>(null);
  const [selectedDiscomfortRating, setSelectedDiscomfortRating] = useState<number | null>(5);
  const [allDiscomfortRatings, setAllDiscomfortRatings] = useState<VideoDiscomfortRating[]>([]);
  const [discomfortRatingError, setDiscomfortRatingError] = useState<string | null>(null);
  const [userFeedbackMessage, setUserFeedbackMessage] = useState<FeedbackMessage | null>(null);
  const [explanationShown, setExplanationShown] = useState<boolean>(false); 
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null); 
  const maxPlayedTimeRef = useRef<number>(0);

  const getLocalizedVideoUrl = useCallback((video: ExposureVideo): string => {
    return getVideoUrl(video.mp4Url, language);
  }, [language]);

  const handleRetryVideo = () => {
    setVideoError(null);
    // Force a re-render of the video element by toggling the modal
    setIsVideoPlayerModalOpen(false);
    setTimeout(() => setIsVideoPlayerModalOpen(true), 50);
  };
  
  useEffect(() => {
    if (isVideoPlayerModalOpen && videoRef.current && !videoError) {
      const playVideoAndRequestFullscreen = async () => {
        try {
          await videoRef.current?.play(); 
          if (videoRef.current?.requestFullscreen) {
            await videoRef.current.requestFullscreen();
          }
        } catch (err) {
          console.warn("Fullscreen request failed or video play prevented:", err);
        }
      };
      playVideoAndRequestFullscreen();
    }
  }, [isVideoPlayerModalOpen, videoError]); 

  const exitFullscreenMode = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.warn("Exiting fullscreen failed:", err);
      }
    }
  };


  const triggerDiscomfortRating = useCallback(async () => {
    await exitFullscreenMode(); 
    const videoJustPlayed = videoSequence[currentVideoIndex];
    if (videoJustPlayed) {
        setCurrentVideoForRating(videoJustPlayed);
    }
    setIsVideoPlayerModalOpen(false);
    setSelectedDiscomfortRating(5);
    setDiscomfortRatingError(null);
    setIsDiscomfortRatingModalOpen(true);
  }, [videoSequence, currentVideoIndex]);

  const handleVideoNaturalEnd = useCallback(async () => {
    await exitFullscreenMode();
    triggerDiscomfortRating();
  }, [triggerDiscomfortRating]);
  
  // Destructure state primitives for stable dependency tracking
  const state = location.state as any || {};
  const reviewScenes = state.reviewScenes as ExposureSceneKey[] | undefined;
  const reviewSessionTimestamp = state.reviewSessionTimestamp as number | undefined;
  const originalQpviiTimestamp = state.originalQpviiTimestamp as number | undefined;
  const stateScores = state.scores as QPVIIScores | undefined;
  const stateQpviiTimestamp = state.qpviiTimestamp as number | undefined;
  const stateAnswers = state.answers as QPVIIAnswers | undefined;
  
  // Use stringified versions for dependency comparison to avoid object/array reference issues
  const reviewScenesStr = reviewScenes ? JSON.stringify(reviewScenes, getCircularReplacer()) : null;
  const scoresStr = stateScores ? JSON.stringify(stateScores, getCircularReplacer()) : null;

  useEffect(() => {
    if (reviewScenes && reviewScenes.length > 0 && reviewSessionTimestamp) {
        setIsLoading(true);
        const originalTimestamp = originalQpviiTimestamp || null;
        setQpviiTimestampForExposure(originalTimestamp); 

        const reviewSequence = EXPOSURE_VIDEOS
            .filter(video => reviewScenes.includes(video.relatedArea))
            .sort((a, b) => {
                const sceneAIndex = CANONICAL_FLIGHT_STAGES_ORDER.indexOf(a.relatedArea);
                const sceneBIndex = CANONICAL_FLIGHT_STAGES_ORDER.indexOf(b.relatedArea);
                if (sceneAIndex !== sceneBIndex) return sceneAIndex - sceneBIndex;
                return a.intensity - b.intensity;
            });
        
        setVideoSequence(reviewSequence);
        
        if(currentUser){
            let progress = getUserExposureProgress(currentUser.id, reviewSessionTimestamp);
            if(progress){
                setCurrentVideoIndex(progress.currentVideoIndex);
                setCompletedVideoIds(progress.completedVideoIds || []);
                setAllDiscomfortRatings(progress.discomfortRatings || []);
            } else {
                setCurrentVideoIndex(0);
                setCompletedVideoIds([]);
                setAllDiscomfortRatings([]);
                saveUserExposureProgress(currentUser.id, reviewSessionTimestamp, reviewSequence.map(v => v.id), 0, [], [], true, false, true, originalTimestamp, false);
            }
        }
        
        setIsLoading(false);
        return;
    }
    
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setIsLoading(true);
    setUserFeedbackMessage(null);
    let scoresToUse: QPVIIScores | null = stateScores || null;
    let timestampToUse: number | null = stateQpviiTimestamp || null;
    let answersToUse: QPVIIAnswers | undefined = stateAnswers;
    
    if (!scoresToUse || timestampToUse === null) {
      const userResults = getQPVIIResultsForUser(currentUser.id);
      if (userResults.length > 0) {
        scoresToUse = userResults[0].scores;
        timestampToUse = userResults[0].timestamp;
        answersToUse = userResults[0].answers;
      }
    } else if (!answersToUse && timestampToUse) {
        const userResults = getQPVIIResultsForUser(currentUser.id);
        const result = userResults.find(r => r.timestamp === timestampToUse);
        if (result) answersToUse = result.answers;
    }

    setQpviiTimestampForExposure(timestampToUse);

    if (scoresToUse && timestampToUse !== null) {
      const seq = determineVideoSequence(answersToUse);
      setVideoSequence(seq);

      const progress = getUserExposureProgress(currentUser.id, timestampToUse);
      if (progress) {
        if (!progress.explanationShown) {
            navigate('/exposure-explanation', { state: { qpviiTimestamp: timestampToUse, scores: scoresToUse }, replace: true });
            return;
        }
        setExplanationShown(true);
        setCurrentVideoIndex(progress.currentVideoIndex);
        setCompletedVideoIds(progress.completedVideoIds);
        setAllDiscomfortRatings(progress.discomfortRatings || []);
        
        // Update lastUpdated to reflect current session activity
        const isReview = !!reviewScenes && reviewScenes.length > 0;
        saveUserExposureProgress(
          currentUser.id, 
          timestampToUse, 
          progress.videoSequence, 
          progress.currentVideoIndex, 
          progress.completedVideoIds, 
          progress.discomfortRatings || [], 
          true, // explanationShown is true here
          progress.programCompleted || false, 
          isReview, 
          originalQpviiTimestamp || null, 
          false
        );
      } else {
         if (seq.length > 0) saveUserExposureProgress(currentUser.id, timestampToUse, seq.map(s=>s.id), 0, [], [], false, false); 
         navigate('/exposure-explanation', { state: { qpviiTimestamp: timestampToUse, scores: scoresToUse }, replace: true });
         return;
      }
    } else {
      navigate('/qpvii-evaluation', {state: {message: t("qpvii.allFieldsRequiredError") }});
    }
    setIsLoading(false);
  }, [currentUser, navigate, t, reviewSessionTimestamp, reviewScenesStr, originalQpviiTimestamp, scoresStr, stateQpviiTimestamp, location.pathname]);


  const handleVideoPlayerCloseInteraction = useCallback(async () => {
    await exitFullscreenMode();
    // Close modal without triggering rating
    setIsVideoPlayerModalOpen(false);
  }, []);

  const handleSimulateVideoCompletion = useCallback(async () => {
    await exitFullscreenMode();
    triggerDiscomfortRating();
  }, [triggerDiscomfortRating]);

  const handleDiscomfortRatingSubmit = useCallback(async () => {
    const state = location.state as any || {};
    const { reviewScenes, reviewSessionTimestamp, originalQpviiTimestamp } = state;
    const isReview = !!reviewScenes;

    if (selectedDiscomfortRating === null) {
        setDiscomfortRatingError(t('exposure.discomfortRatingErrorNoSelection'));
        return;
    }

    if (!currentVideoForRating || !currentUser) return;
    
    const timestampForRecord = isReview ? reviewSessionTimestamp : qpviiTimestampForExposure;
    if (timestampForRecord === null) return;

    const newRating: VideoDiscomfortRating = { id: currentVideoForRating.id, rating: selectedDiscomfortRating, qpviiTimestamp: timestampForRecord, videoTimestamp: Date.now() };
    const updatedRatings = [...allDiscomfortRatings, newRating];
    setAllDiscomfortRatings(updatedRatings);

    let nextVideoIdx = currentVideoIndex;
    let feedback: FeedbackMessage | null = null;
    let justCompletedSequence = false;
    let updatedCompletedVideoIds = completedVideoIds;

    if (selectedDiscomfortRating <= 2) {
      if (!completedVideoIds.includes(currentVideoForRating.id)) {
        updatedCompletedVideoIds = [...completedVideoIds, currentVideoForRating.id];
        setCompletedVideoIds(updatedCompletedVideoIds);
      }
      nextVideoIdx = currentVideoIndex + 1;
      if (nextVideoIdx >= videoSequence.length) justCompletedSequence = true;
      else feedback = { text: t('exposure.progressionMessageSuccess'), type: 'success' };
    } else {
      const ratingsForThisVideo = updatedRatings.filter(r => r.id === currentVideoForRating.id);
      const maxForThisVideo = Math.max(...ratingsForThisVideo.map(r => r.rating), 0);
      const targetForThisVideo = Math.ceil(maxForThisVideo / 2);
      
      feedback = { 
        text: t('exposure.progressionMessageRetry', { 
          current: selectedDiscomfortRating, 
          max: maxForThisVideo, 
          target: targetForThisVideo 
        }), 
        type: 'warning' 
      };
    }
    
    saveUserExposureProgress(currentUser.id, timestampForRecord, videoSequence.map(v => v.id), nextVideoIdx, updatedCompletedVideoIds, updatedRatings, explanationShown, justCompletedSequence, isReview, originalQpviiTimestamp, false);

    // Check for follow-up notifications based on progress
    if (!isReview) {
      await FollowUpService.checkAndSendProgressFollowUp(currentUser, t, updateUser);
    }

    setCurrentVideoIndex(nextVideoIdx);

    setUserFeedbackMessage(feedback);
    setIsDiscomfortRatingModalOpen(false);

    if (justCompletedSequence) {
      const finalTimestamp = isReview ? originalQpviiTimestamp : qpviiTimestampForExposure;
      if (isReview && currentUser && finalTimestamp) {
        const originalProgress = getUserExposureProgress(currentUser.id, finalTimestamp);
        if (originalProgress) saveUserExposureProgress(currentUser.id, finalTimestamp, originalProgress.videoSequence, originalProgress.currentVideoIndex, originalProgress.completedVideoIds, originalProgress.discomfortRatings, originalProgress.explanationShown, originalProgress.programCompleted, false, undefined, true);
      }
      const destination = isReview ? '/qpvii-evaluation' : '/last-session';
      navigate(destination, { state: { qpviiTimestamp: finalTimestamp, isPostExposureEval: isReview, originalQpviiTimestamp: originalQpviiTimestamp }, replace: true });
    }
  }, [selectedDiscomfortRating, currentVideoForRating, currentUser, allDiscomfortRatings, currentVideoIndex, completedVideoIds, videoSequence, qpviiTimestampForExposure, explanationShown, t, navigate, location.state, updateUser]);

  const openVideoPlayer = (index: number) => {
    setCurrentVideoIndex(index);
    setUserFeedbackMessage(null);
    setVideoError(null); // Reset error before opening
    maxPlayedTimeRef.current = 0;
    setIsVideoPlayerModalOpen(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      if (current > maxPlayedTimeRef.current) {
        maxPlayedTimeRef.current = current;
      }
    }
  };

  const handleSeeking = () => {
    if (videoRef.current && videoRef.current.currentTime > maxPlayedTimeRef.current) {
      videoRef.current.currentTime = maxPlayedTimeRef.current;
    }
  };
  
  const handleFinishSession = () => {
    navigate('/last-session', { state: { qpviiTimestamp: qpviiTimestampForExposure }, replace: true });
  };

  const handleRestart = () => {
      const state = location.state as any || {};
      const { reviewScenes, reviewSessionTimestamp, originalQpviiTimestamp } = state;
      const timestampForRecord = reviewScenes ? reviewSessionTimestamp : qpviiTimestampForExposure;
      if (!currentUser || timestampForRecord === null) return;
      setCurrentVideoIndex(0);
      setCompletedVideoIds([]);
      setAllDiscomfortRatings([]);
      setUserFeedbackMessage({text: "Restarting sequence.", type: 'info'});
      saveUserExposureProgress(currentUser.id, timestampForRecord, videoSequence.map(v => v.id), 0, [], [], explanationShown, false, !!reviewScenes, originalQpviiTimestamp);
  };
  
  const executeLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogout = () => {
    const lastRating = allDiscomfortRatings.length > 0 ? allDiscomfortRatings[allDiscomfortRatings.length - 1] : null;
    if (lastRating && lastRating.rating > 2) setIsConfirmingLogout(true);
    else executeLogout();
  };

  if (isLoading || videoSequence.length === 0) {
    return (
      <div className="container mx-auto p-8 text-center">
        {isLoading ? t('auth.loading') : t('exposureHierarchy.noVideosInSequence')}
      </div>
    );
  }

  const isSequenceFinished = currentVideoIndex >= videoSequence.length;
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={location.state?.reviewScenes ? t('exposure.reviewSessionTitle') : t('exposure.pageTitle')} />
        {userFeedbackMessage && (
            <div className={`mb-6 p-4 rounded-lg text-center text-sm font-medium ${userFeedbackMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {userFeedbackMessage.text}
            </div>
        )}

      <ExposureSessionProgress 
        videoSequence={videoSequence}
        currentVideoIndex={currentVideoIndex}
        completedVideoIds={completedVideoIds}
        discomfortRatings={allDiscomfortRatings}
      />
      
      <SectionCard className="text-center">
        {!isSequenceFinished ? (
            <>
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">{t(videoSequence[currentVideoIndex].titleKey)}</h2>
                <p className="text-base text-gray-600 mb-6 max-w-xl mx-auto">{t(videoSequence[currentVideoIndex].descriptionKey)}</p>
                <button onClick={() => openVideoPlayer(currentVideoIndex)} className="inline-flex items-center justify-center py-3 px-8 border border-transparent rounded-full shadow-lg text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-105">
                    <PlayIcon className="h-6 w-6 mr-3" /> {t('exposure.startExposureButton')}
                </button>
            </>
        ) : (
            <>
                <h2 className="text-2xl font-semibold text-green-700 mb-4">{t('exposure.exposureComplete')}</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={handleFinishSession} className="flex-1 py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C]">{location.state?.reviewScenes ? t('exposure.finishReviewButton') : t('exposure.finishExposureSessionButton')}</button>
                    <button onClick={handleRestart} className="flex-1 py-2.5 px-5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">{t('exposure.restartExposureButton')}</button>
                </div>
            </>
        )}
        <div className="mt-12 pt-6 border-t border-gray-200">
          {!isConfirmingLogout ? (
            <button onClick={handleLogout} className="py-2 px-4 border border-red-500 text-red-600 rounded-lg shadow-sm text-sm font-medium hover:bg-red-50">{t('exposure.logoutButton')}</button>
          ) : (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-center">
                <p className="text-sm text-amber-800 font-semibold">
                  {(() => {
                    const currentRating = allDiscomfortRatings[allDiscomfortRatings.length - 1]?.rating || 0;
                    const maxRatingInSession = Math.max(...allDiscomfortRatings.map(r => r.rating), 0);
                    const halfMax = Math.ceil(maxRatingInSession / 2);
                    return t('exposure.logoutWarning', { 
                      current: currentRating, 
                      max: maxRatingInSession, 
                      target: halfMax 
                    });
                  })()}
                </p>
                <div className="mt-4 flex justify-center gap-4">
                    <button onClick={executeLogout} className="px-5 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">{t('general.confirmExit')}</button>
                    <button onClick={() => setIsConfirmingLogout(false)} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300">{t('exposure.continueExposure')}</button>
                </div>
            </div>
          )}
        </div>
      </SectionCard>

      {isVideoPlayerModalOpen && currentVideoIndex < videoSequence.length && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[1000]" onClick={!videoError ? handleVideoPlayerCloseInteraction : undefined}>
          {videoError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg relative max-w-lg text-left shadow-lg m-4" role="alert">
                <strong className="font-bold text-lg">{t('exposure.videoLoadErrorTitle')}</strong>
                <p className="mt-2 text-sm">{t('exposure.videoLoadErrorBody')}</p>
                <div className="mt-3 bg-red-200 text-red-900 text-xs font-mono p-2 rounded break-words">
                  <p className="font-semibold">{t('general.errorDetails')}:</p>
                  <p>{videoError}</p>
                </div>
                <p className="text-xs mt-3">{t('exposure.videoLoadErrorChecklist')}</p>
                <div className="text-center mt-6 flex flex-wrap justify-center gap-3">
                    <button 
                        onClick={handleRetryVideo} 
                        className="px-5 py-2.5 bg-uib-blue text-white rounded-md text-sm font-bold hover:bg-[#004C8C] shadow-sm transition-colors uppercase"
                    >
                      {t('exposure.retryVideoButton') || 'Reintentar'}
                    </button>
                    <button 
                        onClick={handleSimulateVideoCompletion} 
                        className="px-5 py-2.5 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 shadow-sm transition-colors uppercase"
                    >
                      {t('exposure.simulateViewingButton') || 'Simular Visualització'}
                    </button>
                    <button 
                        onClick={handleVideoPlayerCloseInteraction} 
                        className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-md text-sm font-bold hover:bg-gray-300 shadow-sm transition-colors uppercase"
                    >
                      {t('helpModal.closeButton')}
                    </button>
                </div>
            </div>
           ) : (
                <video
                     ref={videoRef}
                     controls
                     autoPlay
                     className="w-full h-full object-contain exposure-video"
                     onEnded={handleVideoNaturalEnd}
                     onTimeUpdate={handleTimeUpdate}
                     onSeeking={handleSeeking}
                      onError={(e) => { 
                        const videoElement = e.target as HTMLVideoElement;
                        const error = videoElement.error;
                        const videoSrc = videoElement.currentSrc || videoElement.src;
                        
                        const detailedMessage = `URL: ${videoSrc} | Error Code: ${error?.code || 'N/A'} | Message: ${error?.message || 'Not available'}`;
                        console.error(`Video loading failed. ${detailedMessage}`);
                        
                        setVideoError(detailedMessage);
                      }}
                     src={getLocalizedVideoUrl(videoSequence[currentVideoIndex])}
                 >
                     {t('exposure.videoTagNotSupported')}
                 </video>
           )}
        </div>
      )}

      {isDiscomfortRatingModalOpen && currentVideoForRating && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1001] p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg transform transition-all animate-fadeIn">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('exposure.discomfortRatingModalTitle')}</h3>
                  <p className="text-sm text-slate-600 mb-6">{t('exposure.discomfortRatingInstruction', { videoTitle: t(currentVideoForRating.titleKey) })}</p>
                   <div className="my-8">
                    <div className="text-center mb-4"><span className="text-6xl font-bold text-uib-blue">{selectedDiscomfortRating}</span></div>
                    <input type="range" min="1" max="10" step="1" value={selectedDiscomfortRating || 5} onChange={(e) => { setSelectedDiscomfortRating(Number(e.target.value)); setDiscomfortRatingError(null); }} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-uib-blue"/>
                    <div className="flex justify-between text-xs text-slate-500 mt-2 px-1"><span>{t('exposure.discomfortRatingMinLabel')}</span><span>{t('exposure.discomfortRatingMaxLabel')}</span></div>
                  </div>
                  {discomfortRatingError && <p className="text-red-600 text-sm mt-4 text-center">{discomfortRatingError}</p>}
                  <div className="mt-8"><button onClick={handleDiscomfortRatingSubmit} className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C]">{t('exposure.discomfortRatingSaveButton')}</button></div>
              </div>
          </div>
      )}

    </div>
  );
};
