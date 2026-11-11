import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { getPatientsForTherapist, getSimulatedEmailsForPatient, syncStore } from '../../services/dataStore';
import { SimulatedEmail, StoredUser } from '../../types';

interface EmailRow {
  email: SimulatedEmail;
  patient: StoredUser;
}

const DATE_LOCALES: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-US' };

/** Emails and reminders sent to this therapist's patients, newest first. */
export const TherapistNotificationsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [rows, setRows] = useState<EmailRow[]>([]);

  const readRows = useCallback(() => {
    if (!currentUser) return;
    const next = getPatientsForTherapist(currentUser.id).flatMap(patient =>
      getSimulatedEmailsForPatient(patient.id).map(email => ({ email, patient }))
    );
    next.sort((a, b) => b.email.timestamp - a.email.timestamp);
    setRows(next);
  }, [currentUser]);

  // Show what is in memory at once, then refresh from the server.
  useEffect(() => {
    readRows();
    syncStore().then(readRows, e => console.error('[TherapistNotifications] sync failed:', e));
  }, [readRows]);

  const locale = DATE_LOCALES[language] ?? 'en-US';

  return (
    <div>
      <Breadcrumbs items={[
          { label: t('nav.therapistDashboard'), path: '/therapist/dashboard' },
          { label: t('nav.therapistNotifications') }
      ]} />
      <PageTitle title={t('therapistDashboard.notificationsTitle')} />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <p className="px-6 pt-6 pb-4 text-sm text-slate-500">{t('therapistDashboard.notificationsPage.intro')}</p>
        {rows.length === 0 ? (
          <p className="text-center text-gray-500 py-16 px-6">{t('therapistDashboard.notificationsPage.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.notificationsPage.date')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.notificationsPage.patient')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.notificationsPage.type')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.notificationsPage.subject')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.notificationsPage.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ email, patient }) => (
                  <tr key={email.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500">
                      {new Date(email.timestamp).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-800">
                      {patient.username}
                      {patient.patientCode && <span className="ml-2 text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">{patient.patientCode}</span>}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-700">{t(`patientDetail.emailType.${email.type}`)}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{email.subject}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${email.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {email.status === 'sent' ? t('therapistDashboard.notificationsPage.statusSent') : t('therapistDashboard.notificationsPage.statusGenerated')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
