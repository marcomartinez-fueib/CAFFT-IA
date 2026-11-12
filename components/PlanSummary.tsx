import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { getSessionPlan } from '../services/dataStore';
import { upcomingSessions } from '../sessionPlan';
import { AddToCalendarButton, formatSession } from './SessionPlanner';

const LOCALES = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as const;

/** The next planned session, or an invitation to plan them. For the patient's own screens. */
export const PlanSummary: React.FC<{ userId: string; className?: string }> = ({ userId, className = '' }) => {
  const { t, language } = useLanguage();
  const plan = getSessionPlan(userId);
  const next = plan ? upcomingSessions(plan.slots, Date.now(), 1)[0] : undefined;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-4 ${className}`} data-plan-summary>
      <CalendarClock className="w-8 h-8 text-uib-blue flex-shrink-0" aria-hidden="true" />
      <div className="flex-grow">
        {next ? (
          <>
            <p className="text-sm text-slate-500">{t('planner.nextSession')}</p>
            <p className="font-semibold text-slate-800 first-letter:uppercase">{formatSession(next.at, LOCALES[language])}</p>
          </>
        ) : (
          <p className="text-gray-700">{t('planner.noPlan')}</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {plan && <AddToCalendarButton slots={plan.slots} />}
        <Link to="/session-plan" className="inline-flex items-center justify-center py-2.5 px-5 rounded-lg text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue">
          {plan ? t('planner.change') : t('planner.plan')}
        </Link>
      </div>
    </div>
  );
};
