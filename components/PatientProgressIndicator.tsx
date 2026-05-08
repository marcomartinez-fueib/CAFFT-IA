
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { getQPVIIResultsForUser, getAllUserExposureProgress } from '../utils/localStorageDB.ts';
import { Check, CircleDot, PlayCircle } from 'lucide-react';

export const PatientProgressIndicator: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [percentage, setPercentage] = useState<number>(0);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'patient') {
      setCurrentStep(-1);
      return;
    }

    const qpviiResults = getQPVIIResultsForUser(currentUser.id);
    const exposureProgress = getAllUserExposureProgress().filter(p => p.userId === currentUser.id);
    
    const latestProgress = exposureProgress.length > 0 
        ? exposureProgress.sort((a,b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))[0] 
        : null;

    const hasPreEval = qpviiResults.some(r => r.evaluationType === 'pre' || !r.evaluationType);
    const hasPostEval = qpviiResults.some(r => r.evaluationType === 'post');

    let step = 0;
    let pct = 5;

    if (hasPostEval) {
      step = 4;
      pct = 100;
    } else if (latestProgress?.programCompleted) {
      step = 3;
      pct = 85;
    } else if (latestProgress) {
      step = 2;
      const totalVideos = latestProgress.videoSequence?.length || 1;
      const viewedVideos = latestProgress.completedVideoIds?.length || 0;
      const exposurePct = Math.round((viewedVideos / totalVideos) * 40); 
      pct = 35 + exposurePct;
    } else if (hasPreEval) {
      step = 1;
      pct = 25;
    } else {
      step = 0;
      pct = 5;
    }

    setCurrentStep(step);
    setPercentage(pct);
  }, [currentUser]);

  if (!currentUser || currentUser.role !== 'patient' || currentStep === -1) {
    return null;
  }

  const steps = [
    { key: 'intro', label: t('progress.intro') },
    { key: 'assessment_pre', label: t('progress.assessment_pre') },
    { key: 'exposure', label: t('progress.exposure') },
    { key: 'assessment_post', label: t('progress.assessment_post') },
    { key: 'complete', label: t('progress.complete') }
  ];

  return (
    <div className="bg-white border-b border-gray-100 py-3 sm:py-4 px-4 sm:px-6 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t('progress.programTitle')}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-sky-600 bg-sky-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-sky-100">
                {percentage}%
            </span>
        </div>

        <div className="relative flex justify-between items-center px-1 sm:px-0">
          {/* Progress Bar Background */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full z-0"></div>
          
          {/* Active Progress Bar */}
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-sky-500 rounded-full z-0"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-colors duration-300 ${
                    isCompleted 
                      ? 'bg-sky-500 border-sky-500 text-white' 
                      : isActive 
                        ? 'bg-white border-sky-500 text-sky-500 ring-2 sm:ring-4 ring-sky-50' 
                        : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : isActive ? (
                    <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                  ) : (
                    <span className="text-[10px] sm:text-xs font-bold">{index + 1}</span>
                  )}
                </motion.div>
                
                <span className={`absolute top-8 sm:top-10 whitespace-nowrap text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter transition-opacity ${
                    isActive ? 'text-sky-600 opacity-100' : isCompleted ? 'text-slate-500 hidden sm:block opacity-70' : 'text-slate-300 hidden sm:block'
                }`}>
                    {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-5 sm:h-6"></div> {/* Spacer for the absolute labels */}
      </div>
    </div>
  );
};
