

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { QpviiForm } from '../components/QpviiForm.tsx';
import { QpviiResultsDisplay } from '../components/QpviiResultsDisplay.tsx';
import { QPVIIAnswers, QPVIIScores } from '../types.ts';
import { calculateQPVIIScores } from '../utils/qpviiScoring.ts';
import { saveQPVIIResultForUser, getQPVIIResultsForUser, getUserExposureProgress } from '../utils/localStorageDB.ts';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { determineVideoSequence, isExposureFullyCompleted } from '../utils/exposureUtils.ts';


interface StoredResults {
  name: string; // Name from the form
  date: string; // Date from the form
  scores: QPVIIScores;
  answers: QPVIIAnswers; // Added answers to local state
  timestamp: number; // Added to pass to results display for exposure link
}

export const QpviiPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<StoredResults | null>(null);
  const [formName, setFormName] = useState('');

  const isPostExposureEval = location.state?.isPostExposureEval;
  const originalQpviiTimestamp = location.state?.originalQpviiTimestamp;

  useEffect(() => {
    if (currentUser) {
        const userResults = getQPVIIResultsForUser(currentUser.id);

        // First, check if the user has ANY completed program. If so, redirect.
        const hasCompletedProgram = userResults.some(r => {
            const progress = getUserExposureProgress(currentUser.id, r.timestamp);
            return progress?.programCompleted === true;
        });

        if (hasCompletedProgram && !isPostExposureEval) {
            navigate('/celebration', { replace: true });
            return; // Stop further processing
        }

        // If not a post-exposure eval, check if we should resume an existing session.
        if (!isPostExposureEval) { 
            if (userResults.length > 0) {
                const latestResult = userResults[0];
                const progress = getUserExposureProgress(currentUser.id, latestResult.timestamp);
                
                if (progress && progress.videoSequence && progress.videoSequence.length > 0) {
                    // Pass answers to determine sequence
                    const expectedSequence = determineVideoSequence(latestResult.answers);
                    if (!isExposureFullyCompleted(progress, expectedSequence)) {
                        navigate('/exposure-hierarchy', {
                            replace: true,
                            state: {
                                qpviiTimestamp: latestResult.timestamp,
                                scores: latestResult.scores,
                                answers: latestResult.answers // Pass answers for resumption
                            },
                        });
                        return; 
                    }
                }
            }
        }
        
        setFormName(currentUser.username);
    } else {
        setFormName('');
    }
  }, [currentUser, navigate, isPostExposureEval, originalQpviiTimestamp]);


  const handleFormSubmit = (nameFromForm: string, date: string, answers: QPVIIAnswers) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const calculatedScores = calculateQPVIIScores(answers);
      const currentTimestamp = Date.now(); // Generate timestamp once
      const submissionResult: StoredResults = {
        name: nameFromForm,
        date,
        scores: calculatedScores,
        answers, // Store answers locally
        timestamp: currentTimestamp, 
      };
      setResults(submissionResult);

      if (currentUser) {
        saveQPVIIResultForUser(
          currentUser.id,
          nameFromForm,
          date,
          calculatedScores,
          currentTimestamp,
          answers, // Pass answers to DB persistence
          isPostExposureEval ? 'post' : 'pre',
          isPostExposureEval ? originalQpviiTimestamp : undefined
        );
      }
      
      setIsSubmitting(false);
      window.scrollTo(0, 0); 

      if (isPostExposureEval) {
        // This QPVII was taken after a full exposure cycle.
        // Navigate to celebration page to finish the program.
        navigate('/celebration', { 
            state: { 
                qpviiTimestamp: originalQpviiTimestamp || currentTimestamp
            } 
        }); 
      }
      // If not from a post-exposure eval, QpviiResultsDisplay will show the "View Hierarchy" button by default
    }, 500);
  };

  const handleBackToForm = () => {
    setResults(null);
    if (currentUser) {
      setFormName(currentUser.username); 
    }
    window.scrollTo(0, 0);
  };

  const handleViewHierarchy = () => {
    if (results && currentUser) {
        // Check if this specific QPV-II has an associated exposure program marked as completed.
        const progress = getUserExposureProgress(currentUser.id, results.timestamp);
        if (progress?.programCompleted) {
            navigate('/evolution'); // If program was completed, go to evolution.
        } else {
            navigate('/exposure-hierarchy', { 
                state: { 
                    qpviiTimestamp: results.timestamp, 
                    scores: results.scores,
                    answers: results.answers // Pass answers to hierarchy page
                } 
            });
        }
    }
  };


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('qpvii.title')} />
      
      {!currentUser && !results && (
         <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
           <p>
            {t('qpvii.loginToSavePrompt')}{' '}
            <Link to="/login" className="font-semibold underline hover:text-red-600">
              {t('nav.login')}
            </Link>
            {' '}{t('general.or')}{' '}
             <Link to="/register" className="font-semibold underline hover:text-red-600">
              {t('nav.register')}
            </Link>
            .
           </p>
        </div>
      )}

      {!results ? (
        <QpviiForm
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          initialName={formName}
        />
      ) : (
        <QpviiResultsDisplay
          name={results.name}
          date={results.date}
          scores={results.scores}
          onBackToForm={handleBackToForm}
          qpviiTimestamp={results.timestamp}
          onViewHierarchy={handleViewHierarchy} 
          showViewHierarchyButton={!isPostExposureEval && !(getUserExposureProgress(currentUser?.id || '', results.timestamp)?.programCompleted)}
        />
      )}
    </div>
  );
};