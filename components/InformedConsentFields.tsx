import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';

export interface InformedConsentValue {
  dob: string;
  gender: string;
  occupation: string;
  source: string;
  consent: boolean;
  studentsPresence: boolean;
}

export const emptyInformedConsent: InformedConsentValue = {
  dob: '', gender: '', occupation: '', source: '', consent: false, studentsPresence: false,
};

/** True when every required field is filled in and the consent box is ticked. */
export function isInformedConsentComplete(v: InformedConsentValue): boolean {
  return !!(v.dob && v.gender && v.occupation && v.source && v.consent);
}

/**
 * The informed consent: the patient's details the EBP asks for, the consent
 * and legal texts, and the boxes to accept them. Used when registering and,
 * for patients a therapist registered, on the consent screen at first login.
 */
export const InformedConsentFields: React.FC<{
  value: InformedConsentValue;
  onChange: (value: InformedConsentValue) => void;
}> = ({ value, onChange }) => {
  const { t } = useLanguage();
  const set = <K extends keyof InformedConsentValue>(key: K, v: InformedConsentValue[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6 bg-sky-50 p-4 rounded-lg border border-sky-100">
      <h3 className="text-lg font-semibold text-sky-900 border-b border-sky-200 pb-2">
        {t('informedConsent.title')}
      </h3>

      <div>
        <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
          {t('informedConsent.dob')} <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="dob"
          value={value.dob}
          onChange={(e) => set('dob', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
          {t('informedConsent.gender')} <span className="text-red-500">*</span>
        </label>
        <select
          id="gender"
          value={value.gender}
          onChange={(e) => set('gender', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        >
          <option value="">{t('informedConsent.select')}</option>
          <option value="male">{t('informedConsent.genderMale')}</option>
          <option value="female">{t('informedConsent.genderFemale')}</option>
          <option value="other">{t('informedConsent.genderOther')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
          {t('informedConsent.occupation')} <span className="text-red-500">*</span>
        </label>
        <select
          id="occupation"
          value={value.occupation}
          onChange={(e) => set('occupation', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        >
          <option value="">{t('informedConsent.select')}</option>
          <option value="student">{t('informedConsent.occupationStudent')}</option>
          <option value="PTGAS">{t('informedConsent.occupationPTGAS')}</option>
          <option value="PDI">{t('informedConsent.occupationPDI')}</option>
          <option value="other">{t('informedConsent.occupationOther')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700">
          {t('informedConsent.source')} <span className="text-red-500">*</span>
        </label>
        <select
          id="source"
          value={value.source}
          onChange={(e) => set('source', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          required
        >
          <option value="">{t('informedConsent.select')}</option>
          <option value="web">{t('informedConsent.sourceWeb')}</option>
          <option value="medical">{t('informedConsent.sourceUnitatMedica')}</option>
          <option value="needs">{t('informedConsent.sourceNecessitats')}</option>
          <option value="profesor">{t('informedConsent.sourceProfesor')}</option>
          <option value="user">{t('informedConsent.sourceUser')}</option>
          <option value="friend">{t('informedConsent.sourceFriend')}</option>
          <option value="other">{t('informedConsent.sourceOther')}</option>
        </select>
      </div>

      {/* Scrollable, so it must take the focus to be read with the keyboard. */}
      <div tabIndex={0} role="region" aria-label={t('informedConsent.title')} className="bg-white p-3 border border-sky-200 rounded text-xs text-gray-600 h-48 overflow-y-auto whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-uib-blue">
        <strong>{t('informedConsent.consentDate')}: {new Date().toLocaleDateString()}</strong>
        <div className="mt-2">
          {t('informedConsent.consentText')}
        </div>
        <div className="mt-4 p-2 bg-gray-50 border-l-4 border-sky-500">
          {t('informedConsent.legalText')}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="consent"
              name="consent"
              type="checkbox"
              checked={value.consent}
              onChange={(e) => set('consent', e.target.checked)}
              className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300 rounded"
              required
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="consent" className="font-medium text-gray-700">
              {t('informedConsent.consentAcceptLabel')} <span className="text-red-500">*</span>
            </label>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="studentsPresence"
              name="studentsPresence"
              type="checkbox"
              checked={value.studentsPresence}
              onChange={(e) => set('studentsPresence', e.target.checked)}
              className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="studentsPresence" className="text-gray-700">
              {t('informedConsent.studentsPresence')}
            </label>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 italic">
          {t('informedConsent.conformityTitle')}
      </p>
    </div>
  );
};
