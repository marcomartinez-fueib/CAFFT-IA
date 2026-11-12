import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { getExposureSessionsForUser, getSessionPlan } from '../../services/dataStore';
import { plannedSessionsBetween, zonedParts } from '../../sessionPlan';

const LOCALES = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as const;
const SHOWN = 8;

/**
 * For the therapist: whether the patient has a session plan, and which of the
 * planned sessions since they made it they actually had (a session that day).
 */
export const PlanAdherence: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { t, language } = useLanguage();
  const locale = LOCALES[language];
  const plan = getSessionPlan(patientId);
  if (!plan) return <p className="text-gray-500 text-center py-4 text-sm">{t('planner.therapistNoPlan')}</p>;

  const dayName = (day: number) => new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2027, 0, 3 + day)));
  const sessionDays = new Set(getExposureSessionsForUser(patientId).filter((s) => !s.isReview).map((s) => zonedParts(s.startedAt).date));
  const now = Date.now();
  // Since the plan was made, up to today's sessions that have already started.
  const planned = plannedSessionsBetween(plan.slots, plan.updatedAt, now).filter((p) => p.at <= now && p.at >= plan.updatedAt);
  const done = planned.filter((p) => sessionDays.has(p.date)).length;

  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-800">
        {plan.slots.map((s) => `${dayName(s.day)} ${s.time}`).join(' · ')}
      </p>
      <p className="text-slate-600">
        {planned.length === 0 ? t('planner.therapistNoneYet') : t('planner.therapistDone', { done, planned: planned.length })}
      </p>
      {planned.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {planned.slice(-SHOWN).reverse().map((p) => (
            <li key={p.date} className="flex items-center gap-2 py-1.5">
              {sessionDays.has(p.date)
                ? <CheckCircle2 className="w-4 h-4 text-green-600" aria-label={t('planner.therapistHeld')} />
                : <XCircle className="w-4 h-4 text-slate-400" aria-label={t('planner.therapistMissed')} />}
              <span className="first-letter:uppercase">{new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }).format(new Date(p.at))} · {p.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
