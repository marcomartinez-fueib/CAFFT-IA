

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { QPVIIScores, UserExposureProgress } from '../types';
import { getUserExposureProgress, saveUserExposureProgress } from '../services/dataStore';
import { currentPlanFor } from '../utils/currentPlan';
import { StepGuardCard } from '../components/StepGuardCard';
import { HelpVideoPlayer } from '../components/HelpVideoPlayer';

export const ExposureExplanationPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // A direct link or a reload arrives without navigation state.
  const navState = (location.state as { qpviiTimestamp?: number; scores?: QPVIIScores }) || {};
  const plan = navState.qpviiTimestamp && navState.scores
    ? { qpviiTimestamp: navState.qpviiTimestamp, scores: navState.scores }
    : currentUser ? currentPlanFor(currentUser.id) : null;
  const qpviiTimestamp = plan?.qpviiTimestamp;
  const scores = plan?.scores;

  if (!qpviiTimestamp || !scores || !currentUser) {
    return <StepGuardCard pageTitle={t('exposureExplanation.pageTitle')} />;
  }

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
            <HelpVideoPlayer id="P04" className="max-w-2xl mx-auto" />
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
    </>
  );
};