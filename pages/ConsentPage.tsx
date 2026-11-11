import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import {
  InformedConsentFields,
  InformedConsentValue,
  emptyInformedConsent,
  isInformedConsentComplete,
} from '../components/InformedConsentFields.tsx';

/**
 * Shown instead of any patient page until the patient has accepted the
 * current informed consent (consent.ts): patients a therapist registered see
 * it at their first login, and everyone sees it again when the text changes.
 */
export const ConsentPage: React.FC = () => {
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
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <PageTitle title={t('consentGate.title')} />
      <SectionCard>
        <p className="text-gray-700 mb-6">
          {t(currentUser?.treatmentConsent ? 'consentGate.introUpdated' : 'consentGate.intro')}
        </p>
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
      </SectionCard>
    </div>
  );
};
