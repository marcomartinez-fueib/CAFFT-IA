import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

export interface NewPatient {
  username: string;
  email: string;
  /** The language of the welcome email and the reminders. */
  language: 'ca' | 'es' | 'en';
}

const FIELD = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all';
const LABEL = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1';

/** The fields to register a patient, shared by the dashboard and the patient list. */
export const NewPatientFields: React.FC<{ value: NewPatient; onChange: (v: NewPatient) => void }> = ({ value, onChange }) => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="new-patient-username" className={LABEL}>{t('therapistDashboard.addPatientModal.usernameLabel')}</label>
        <input id="new-patient-username" type="text" autoComplete="off" value={value.username} onChange={(e) => onChange({ ...value, username: e.target.value })} className={FIELD} />
      </div>
      <div>
        <label htmlFor="new-patient-email" className={LABEL}>{t('therapistDashboard.addPatientModal.emailLabel')}</label>
        <input id="new-patient-email" type="email" autoComplete="off" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} className={FIELD} />
      </div>
      <div>
        <label htmlFor="new-patient-language" className={LABEL}>{t('therapistDashboard.addPatientModal.languageLabel')}</label>
        <select id="new-patient-language" value={value.language} onChange={(e) => onChange({ ...value, language: e.target.value as NewPatient['language'] })} className={FIELD}>
          <option value="ca">Català</option>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{t('common.invitationNote')}</p>
    </div>
  );
};
