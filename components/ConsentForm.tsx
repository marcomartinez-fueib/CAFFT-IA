import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { InformedConsentFields, InformedConsentValue, emptyInformedConsent, isInformedConsentComplete } from './InformedConsentFields.tsx';

/**
 * The informed consent: first what it means in plain words (not part of the
 * versioned text, see consent.ts), then the full text and the fields. Used
 * by the welcome's first step and by the screen that asks again when the
 * text changes.
 */
export const ConsentForm: React.FC<{ onAccepted?: () => void }> = ({ onAccepted }) => {
  const { currentUser, acceptConsent, logout } = useAuth();
  const { t } = useLanguage();
  const previous = currentUser?.informedConsentMetadata;
  const [form, setForm] = useState<InformedConsentValue>({
    ...emptyInformedConsent,
    ...(previous ? { dob: previous.dob, gender: previous.gender, occupation: previous.occupation, source: previous.source, studentsPresence: !!previous.studentsPresence } : {}),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInformedConsentComplete(form)) {
      setError(t(form.consent ? 'auth.fillAllFieldsError' : 'auth.consentRequiredError'));
      return;
    }
    setSaving(true);
    const { dob, gender, occupation, source, studentsPresence } = form;
    const result = await acceptConsent('treatment', { dob, gender, occupation, source, studentsPresence });
    setSaving(false);
    if (!result.success) setError(t(result.errorKey || 'consentGate.saveError'));
    else onAccepted?.();
  };

  const summary = [1, 2, 3, 4, 5].map((n) => t(`consentGate.plain${n}`));

  return (
    <>
      <div className="mb-6 rounded-lg bg-sky-50 border border-sky-200 p-4">
        <h2 className="font-semibold text-slate-800 mb-2">{t('consentGate.plainTitle')}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
          {summary.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <InformedConsentFields value={form} onChange={(v) => { setForm(v); setError(null); }} />
        {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-5 rounded-lg shadow-sm text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue"
          >
            {saving ? t('auth.loading') : t('consentGate.submitButton')}
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="flex-1 py-3 px-5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {t('consentGate.notNowButton')}
          </button>
        </div>
      </form>
    </>
  );
};
