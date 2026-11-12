import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { needsTreatmentConsent } from '../consent';
import { completeWelcome } from '../services/dataStore';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { ConsentForm } from '../components/ConsentForm';
import { HelpVideoCard } from '../components/HelpVideoCard';
import { HelpVideoPlayer } from '../components/HelpVideoPlayer';
import { SessionPlanner } from '../components/SessionPlanner';

type Step = 1 | 2 | 3 | 'plan';
const CHECKS = ['device', 'headphones', 'place', 'sound'] as const;

/** A one-second tone, to check the sound and the headphones. */
function playTestTone(): void {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 1);
  osc.onended = () => void ctx.close();
}

/**
 * The three-step welcome of a new patient: the consent in plain words (1),
 * the welcome video P01 (2), and the check of device, headphones, place and
 * sound, with P02 (3). At the end the session planner is offered.
 */
export const WelcomePage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, setUserFromServer } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(() => (needsTreatmentConsent(currentUser) ? 1 : 2));
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const heading = useRef<HTMLHeadingElement>(null);

  // Each step announces itself to screen readers and starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus();
  }, [step]);

  const finish = async () => {
    try {
      setUserFromServer(await completeWelcome());
    } finally {
      navigate('/start');
    }
  };

  const allChecked = CHECKS.every((c) => checks[c]);
  const stepNumber = step === 'plan' ? 3 : step;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <PageTitle title={t('welcome.title')} />
      <p className="text-sm font-semibold text-uib-blue mb-2" aria-live="polite">
        {step === 'plan' ? t('welcome.lastly') : t('welcome.stepOf', { step: stepNumber, total: 3 })}
      </p>
      <div className="h-2 bg-slate-200 rounded-full mb-6" aria-hidden="true">
        <div className="h-2 bg-uib-blue rounded-full transition-all" style={{ width: `${(step === 'plan' ? 3 : step - 1) * 33.4}%` }} />
      </div>

      <SectionCard>
        <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold text-slate-800 mb-4 focus:outline-none">
          {t(`welcome.step${step === 'plan' ? 'Plan' : step}Title`)}
        </h2>

        {step === 1 && (
          <>
            <p className="text-gray-700 mb-6">{t('consentGate.intro')}</p>
            <ConsentForm onAccepted={() => setStep(2)} />
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-gray-700 mb-6">{t('welcome.step2Text')}</p>
            <HelpVideoPlayer id="P01" className="mb-6" />
            <button type="button" onClick={() => setStep(3)} className="w-full sm:w-auto py-3 px-6 rounded-lg text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue">
              {t('welcome.continue')}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-gray-700 mb-4">{t('welcome.step3Text')}</p>
            <fieldset className="space-y-3 mb-6">
              <legend className="sr-only">{t('welcome.step3Title')}</legend>
              {CHECKS.map((c) => (
                <div key={c} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                  <input id={`check-${c}`} type="checkbox" checked={!!checks[c]} onChange={(e) => setChecks({ ...checks, [c]: e.target.checked })} className="mt-1 h-5 w-5 accent-uib-blue" />
                  <div className="flex-grow">
                    <label htmlFor={`check-${c}`} className="text-slate-800 cursor-pointer">{t(`welcome.check.${c}`)}</label>
                    {c === 'sound' && (
                      <button type="button" onClick={playTestTone} className="mt-2 flex items-center gap-2 py-1.5 px-3 rounded-md border border-uib-blue text-uib-blue text-sm hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-uib-blue">
                        <Volume2 className="w-4 h-4" aria-hidden="true" /> {t('welcome.playTone')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </fieldset>
            <HelpVideoCard id="P02" defaultOpen={false} className="mb-6" />
            <button type="button" disabled={!allChecked} onClick={() => setStep('plan')} className="w-full sm:w-auto py-3 px-6 rounded-lg text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue">
              {t('welcome.continue')}
            </button>
          </>
        )}

        {step === 'plan' && (
          <>
            <SessionPlanner onSaved={() => undefined} />
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={finish} className="flex-1 py-3 px-6 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                {t('welcome.finish')}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">{t('welcome.planOptional')}</p>
          </>
        )}
      </SectionCard>
    </div>
  );
};
