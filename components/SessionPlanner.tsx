import React, { useMemo, useState } from 'react';
import { CalendarPlus, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { getSessionPlan, saveSessionPlan } from '../services/dataStore';
import { RECOMMENDED_PER_WEEK, RECOMMENDED_TOTAL, upcomingSessions, type PlanSlot } from '../sessionPlan';
import { downloadIcs, planToIcs } from '../utils/ics';

// Monday first, as calendars here are; 0 is Sunday.
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const LOCALES = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as const;
const DEFAULT_TIME = '18:00';

/** A weekday's name: 2027-01-03 was a Sunday. */
function dayName(day: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2027, 0, 3 + day)));
}

export function formatSession(at: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date(at));
}

/** Adds the next planned sessions to the patient's calendar. */
export const AddToCalendarButton: React.FC<{ slots: PlanSlot[]; className?: string }> = ({ slots, className = '' }) => {
  const { t } = useLanguage();
  const add = () => {
    const url = new URL(import.meta.env.BASE_URL, window.location.origin).href;
    downloadIcs(planToIcs(slots, { title: t('planner.calendarTitle'), description: t('planner.calendarDescription'), url, count: RECOMMENDED_TOTAL }), 'cafft-sessions.ics');
  };
  return (
    <button type="button" onClick={add} className={`inline-flex items-center justify-center gap-2 py-2.5 px-5 border border-uib-blue text-uib-blue rounded-lg text-sm font-medium hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-uib-blue ${className}`}>
      <CalendarPlus className="w-4 h-4" aria-hidden="true" /> {t('planner.addToCalendar')}
    </button>
  );
};

/**
 * The patient chooses the days and the hour of their sessions. 2 or 3 a week
 * are recommended; the plan is optional and can be changed at any time.
 */
export const SessionPlanner: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const locale = LOCALES[language];
  const saved = currentUser ? getSessionPlan(currentUser.id) : null;
  const [times, setTimes] = useState<Record<number, string>>(() => Object.fromEntries((saved?.slots ?? []).map((s) => [s.day, s.time])));
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(saved ? 'saved' : 'idle');

  const slots: PlanSlot[] = WEEK.filter((d) => times[d] !== undefined).map((day) => ({ day, time: times[day] }));
  const next = useMemo(() => upcomingSessions(slots, Date.now(), 3), [JSON.stringify(slots)]);

  const toggle = (day: number) => {
    setState('idle');
    setTimes((prev) => {
      const copy = { ...prev };
      if (copy[day] !== undefined) delete copy[day];
      else copy[day] = DEFAULT_TIME;
      return copy;
    });
  };

  const save = async () => {
    setState('saving');
    try {
      await saveSessionPlan(slots);
      setState('saved');
      onSaved?.();
    } catch {
      setState('error');
    }
  };

  const advice =
    slots.length > 0 && slots.length < RECOMMENDED_PER_WEEK.min
      ? t('planner.adviceFew')
      : slots.length > RECOMMENDED_PER_WEEK.max
        ? t('planner.adviceMany')
        : null;

  return (
    <div className="space-y-6">
      <p className="text-gray-700">{t('planner.intro', { min: RECOMMENDED_PER_WEEK.min, max: RECOMMENDED_PER_WEEK.max, total: RECOMMENDED_TOTAL })}</p>

      <fieldset>
        <legend className="font-semibold text-slate-800 mb-3">{t('planner.daysLegend')}</legend>
        <ul className="space-y-2">
          {WEEK.map((day) => {
            const on = times[day] !== undefined;
            const name = dayName(day, locale);
            return (
              <li key={day} className={`flex items-center gap-3 rounded-lg border p-3 ${on ? 'border-uib-blue bg-sky-50' : 'border-slate-200'}`}>
                <label className="flex flex-grow items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={on} onChange={() => toggle(day)} className="h-5 w-5 accent-uib-blue" />
                  <span className="capitalize text-slate-800">{name}</span>
                </label>
                {on && (
                  <input
                    type="time"
                    value={times[day]}
                    step={900}
                    onChange={(e) => { setState('idle'); setTimes((prev) => ({ ...prev, [day]: e.target.value || DEFAULT_TIME })); }}
                    aria-label={t('planner.timeFor', { day: name })}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </fieldset>

      {advice && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3" role="status">{advice}</p>}

      {next.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">{t('planner.nextSessions')}</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            {next.map((s) => <li key={s.at} className="first-letter:uppercase">{formatSession(s.at, locale)}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={save}
          disabled={slots.length === 0 || state === 'saving' || state === 'saved'}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue"
        >
          {state === 'saved' && <Check className="w-4 h-4" aria-hidden="true" />}
          {state === 'saving' ? t('auth.loading') : state === 'saved' ? t('planner.saved') : t('planner.save')}
        </button>
        {state === 'saved' && slots.length > 0 && <AddToCalendarButton slots={slots} />}
      </div>
      {state === 'error' && <p className="text-sm text-red-600" role="alert">{t('planner.saveError')}</p>}
    </div>
  );
};
