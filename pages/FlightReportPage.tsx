import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { getFlightReport, saveFlightReport, setPlannedFlightDate } from '../services/dataStore';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { QpviiComparison } from '../components/QpviiComparison';
import { downloadFlightGuidelines } from '../utils/flightGuidelines';

const BUTTON = 'py-2.5 px-5 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue';

/**
 * After the programme: the QPV-II before and after, the flight guidelines to
 * keep, when they expect to fly (the day after, they are asked how it went),
 * and the short self-report of the real flight.
 */
export const FlightReportPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser, setUserFromServer } = useAuth();
  const saved = currentUser ? getFlightReport(currentUser.id) : null;
  const [plannedDate, setPlannedDate] = useState(currentUser?.plannedFlightDate ?? '');
  const [dateState, setDateState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [flew, setFlew] = useState<boolean | null>(saved ? saved.flew : null);
  const [flightDate, setFlightDate] = useState(saved?.flightDate ?? '');
  const [anxiety, setAnxiety] = useState(saved?.maxAnxiety ?? 5);
  const [comment, setComment] = useState(saved?.comment ?? '');
  const [reportState, setReportState] = useState<'idle' | 'saving' | 'saved' | 'error'>(saved ? 'saved' : 'idle');
  if (!currentUser) return null;

  const saveDate = async () => {
    try {
      setUserFromServer(await setPlannedFlightDate(plannedDate || null));
      setDateState('saved');
    } catch {
      setDateState('error');
    }
  };

  const saveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (flew === null) return;
    setReportState('saving');
    try {
      await saveFlightReport(currentUser.id, {
        flew,
        ...(flew && flightDate ? { flightDate } : {}),
        ...(flew ? { maxAnxiety: anxiety } : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      setReportState('saved');
    } catch {
      setReportState('error');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl space-y-6">
      <PageTitle title={t('flight.pageTitle')} />

      <SectionCard title={t('flight.compareTitle')}>
        <QpviiComparison userId={currentUser.id} />
      </SectionCard>

      <SectionCard title={t('flight.guidelinesTitle')}>
        <p className="text-gray-700 mb-4">{t('flight.guidelinesText')}</p>
        <button type="button" onClick={() => downloadFlightGuidelines(t, language)} className={`${BUTTON} border border-uib-blue text-uib-blue hover:bg-sky-50`}>
          {t('flight.downloadGuidelines')}
        </button>
      </SectionCard>

      <SectionCard title={t('flight.whenTitle')}>
        <p className="text-gray-700 mb-4">{t('flight.whenText')}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="flex flex-col text-sm text-slate-700">
            {t('flight.plannedDate')}
            <input type="date" value={plannedDate} onChange={(e) => { setPlannedDate(e.target.value); setDateState('idle'); }} className="mt-1 rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button type="button" onClick={saveDate} className={`${BUTTON} text-white bg-uib-blue hover:bg-[#004C8C]`}>{t('flight.saveDate')}</button>
        </div>
        {dateState === 'saved' && <p className="mt-2 text-sm text-green-700" role="status">{plannedDate ? t('flight.dateSaved') : t('flight.dateCleared')}</p>}
        {dateState === 'error' && <p className="mt-2 text-sm text-red-600" role="alert">{t('flight.saveError')}</p>}
      </SectionCard>

      <SectionCard title={t('flight.reportTitle')}>
        <form onSubmit={saveReport} className="space-y-5">
          <fieldset>
            <legend className="text-slate-800 mb-2">{t('flight.flewQuestion')}</legend>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <label key={String(v)} className={`flex-1 cursor-pointer rounded-lg border p-3 text-center ${flew === v ? 'border-uib-blue bg-sky-50' : 'border-slate-200'}`}>
                  <input type="radio" name="flew" className="sr-only" checked={flew === v} onChange={() => { setFlew(v); setReportState('idle'); }} />
                  {v ? t('flight.yes') : t('flight.notYet')}
                </label>
              ))}
            </div>
          </fieldset>
          {flew && (
            <>
              <label className="flex flex-col text-sm text-slate-700">
                {t('flight.flightDate')}
                <input type="date" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-3 py-2 w-fit" />
              </label>
              <div>
                <label htmlFor="flight-anxiety" className="text-sm text-slate-700">{t('flight.anxietyQuestion')}</label>
                <div className="text-center text-4xl font-bold text-uib-blue my-2" aria-hidden="true">{anxiety}</div>
                <input id="flight-anxiety" type="range" min={1} max={9} value={anxiety} onChange={(e) => setAnxiety(Number(e.target.value))} aria-valuetext={String(anxiety)} className="w-full accent-uib-blue" />
                <div className="flex justify-between text-xs text-slate-500"><span>{t('exposure.discomfortRatingMinLabel')}</span><span>{t('exposure.discomfortRatingMaxLabel')}</span></div>
              </div>
            </>
          )}
          <label className="flex flex-col text-sm text-slate-700">
            {t('flight.comment')}
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={4000} className="mt-1 rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" disabled={flew === null || reportState === 'saving'} className={`${BUTTON} text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400`}>
            {reportState === 'saving' ? t('auth.loading') : t('flight.send')}
          </button>
          {reportState === 'saved' && <p className="text-sm text-green-700" role="status">{t('flight.thanks')}</p>}
          {reportState === 'error' && <p className="text-sm text-red-600" role="alert">{t('flight.saveError')}</p>}
        </form>
      </SectionCard>

      <Link to="/start" className="inline-block text-uib-blue hover:underline">{t('flight.backToStart')}</Link>
    </div>
  );
};
