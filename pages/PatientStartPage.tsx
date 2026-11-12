import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, PlayCircle, User as UserIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useOnboarding } from '../hooks/useOnboarding';
import { getAllUserExposureProgress, getFlightReport } from '../services/dataStore';
import { nextStepFor } from '../utils/nextStep';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { PlanSummary } from '../components/PlanSummary';

/**
 * The patient's start screen: one main action, «El seu pas següent», the
 * next planned session and their progress through the hierarchy.
 */
export const PatientStartPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { startTour } = useOnboarding();
  const startTourRef = useRef(startTour);
  startTourRef.current = startTour;

  // The guided tour of the menus, once, the first time they get here after
  // the welcome (unless their therapist turned it off: startTour checks).
  useEffect(() => {
    const id = currentUser?.welcomeCompletedAt ? currentUser.id : null;
    if (!id) return;
    const key = `cafft_onboarding_autostart_done_${id}`;
    if (localStorage.getItem(key) === 'true') return;
    const timer = setTimeout(() => {
      localStorage.setItem(key, 'true');
      startTourRef.current('patient', id);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentUser?.id, currentUser?.welcomeCompletedAt]);

  if (!currentUser) return null;

  const step = nextStepFor(currentUser, !!getFlightReport(currentUser.id));
  const progress = getAllUserExposureProgress()
    .filter((p) => p.userId === currentUser.id && !p.isReview)
    .sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
  const percent = progress && progress.videoSequence.length > 0
    ? Math.round((100 * (progress.programCompleted ? progress.videoSequence.length : progress.completedVideoIds.length)) / progress.videoSequence.length)
    : null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
      <PageTitle title={t('start.greeting', { username: currentUser.username })} />

      <SectionCard className="border-2 border-uib-blue">
        <p className="text-sm font-bold uppercase tracking-wider text-uib-blue mb-2">{t('start.nextStep')}</p>
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">{t(`start.steps.${step.key}.title`)}</h2>
        <p className="text-gray-700 mb-6">{t(`start.steps.${step.key}.text`)}</p>
        <button
          type="button"
          onClick={() => navigate(step.path, step.state ? { state: step.state } : undefined)}
          className="inline-flex items-center gap-2 py-3 px-6 rounded-lg text-base font-semibold text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue"
          data-next-step={step.key}
        >
          {t(`start.steps.${step.key}.button`)} <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </SectionCard>

      {step.key !== 'welcome' && (
        <SectionCard className="mt-6">
          <PlanSummary userId={currentUser.id} />
        </SectionCard>
      )}

      {percent !== null && (
        <SectionCard className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-slate-800">{t('start.progress')}</span>
            <span className="text-slate-600 tabular-nums">{percent}%</span>
          </div>
          <div className="h-3 bg-slate-200 rounded-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('start.progress')}>
            <div className="h-3 bg-green-600 rounded-full" style={{ width: `${percent}%` }} />
          </div>
        </SectionCard>
      )}

      <nav aria-label={t('start.more')} className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { to: '/evolution', label: t('start.evolution'), icon: BarChart3 },
          { to: '/help-videos', label: t('helpVideos.pageTitle'), icon: PlayCircle },
          { to: '/profile', label: t('start.profile'), icon: UserIcon },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-uib-blue text-slate-800 focus:outline-none focus:ring-2 focus:ring-uib-blue">
            <Icon className="w-5 h-5 text-uib-blue" aria-hidden="true" /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
