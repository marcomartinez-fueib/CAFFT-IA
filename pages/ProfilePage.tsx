
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { getQPVIIResultsForUser } from '../utils/localStorageDB.ts';
import { QPVIIUserResult } from '../types.ts';
import { NotificationSettings } from '../components/NotificationSettings.tsx';

export const ProfilePage: React.FC = () => {
  const { currentUser, changePassword, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();

  const [qpviiHistory, setQpviiHistory] = useState<QPVIIUserResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      const history = getQPVIIResultsForUser(currentUser.id);
      setQpviiHistory(history);
      setLoading(false);
    }
  }, [currentUser]);

  const getLocaleForDate = () => {
    switch (language) {
      case 'ca': return 'ca-ES';
      case 'es': return 'es-ES';
      case 'en': return 'en-US';
      default: return 'en-US';
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError(t('auth.fillAllFieldsError'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('auth.passwordMinLengthError'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t('auth.passwordsDontMatchError'));
      return;
    }

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setPasswordSuccess(t(result.messageKey || 'auth.changePasswordSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setPasswordError(t(result.errorKey || 'auth.changePasswordError'));
    }
  };

  if (loading || !currentUser) {
    return <div className="container mx-auto p-8 text-center">{t('auth.loading')}</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('profile.title')} />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <h2 className="text-2xl font-semibold text-gray-700">{t('profile.welcome', { username: currentUser.username })}</h2>
        {currentUser.patientCode && (
          <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest">
            ID: {currentUser.patientCode}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* QPV-II History */}
        <SectionCard title={t('profile.qpviiHistoryTitle')}>
          {qpviiHistory.length > 0 ? (
            <ul className="space-y-4">
              {qpviiHistory.map((result) => (
                <li key={result.timestamp} className="p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {t('profile.evaluationOn', { date: new Date(result.date + 'T00:00:00').toLocaleDateString(getLocaleForDate(), { year: 'numeric', month: 'long', day: 'numeric' }) })}
                      </p>
                      <p className="text-sm text-slate-600">
                        {t('profile.totalScore', { score: result.scores.total })}
                      </p>
                    </div>
                    <Link to="/evolution" className="text-sm font-medium text-sky-600 hover:text-sky-800">
                      {t('nav.evolution')} &rarr;
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">{t('profile.noHistory')}</p>
          )}
        </SectionCard>

        {/* Change Password */}
        <SectionCard title={t('profile.changePasswordSectionTitle')}>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">{t('auth.currentPasswordLabel')}</label>
              <input type="password" id="currentPassword" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">{t('auth.newPasswordLabel')}</label>
              <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" required minLength={6} />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">{t('auth.confirmPasswordLabel')}</label>
              <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" required minLength={6} />
            </div>
            
            {passwordError && <p className="text-red-600 text-sm" role="alert">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-600 text-sm">{passwordSuccess}</p>}

            <button type="submit" disabled={authLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400">
              {authLoading ? t('auth.loading') : t('auth.changePasswordButton')}
            </button>
          </form>
        </SectionCard>

        {/* Notification Settings */}
        <SectionCard title={t('profile.notificationsSectionTitle')}>
          <NotificationSettings user={currentUser} onUpdate={() => {}} />
        </SectionCard>

        {/* Informed Consent Summary */}
        {currentUser.informedConsentMetadata && (
            <SectionCard title={t('informedConsent.title')}>
                <div className="space-y-4 text-sm text-gray-700">
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-100">
                        <span className="font-medium text-gray-500">{t('informedConsent.dob')}:</span>
                        <span>{new Date(currentUser.informedConsentMetadata.dob).toLocaleDateString(getLocaleForDate())}</span>
                        
                        <span className="font-medium text-gray-500">{t('informedConsent.gender')}:</span>
                        <span className="capitalize">{t(`informedConsent.gender${currentUser.informedConsentMetadata.gender.charAt(0).toUpperCase() + currentUser.informedConsentMetadata.gender.slice(1)}`)}</span>
                        
                        <span className="font-medium text-gray-500">{t('informedConsent.occupation')}:</span>
                        <span className="capitalize">{t(`informedConsent.occupation${currentUser.informedConsentMetadata.occupation.charAt(0).toUpperCase() + currentUser.informedConsentMetadata.occupation.slice(1)}`)}</span>
                        
                        <span className="font-medium text-gray-500">{t('informedConsent.source')}:</span>
                        <span className="capitalize">{t(`informedConsent.source${currentUser.informedConsentMetadata.source.charAt(0).toUpperCase() + currentUser.informedConsentMetadata.source.slice(1)}`)}</span>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${currentUser.consentGiven ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span>{t('informedConsent.consentAcceptLabel')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${currentUser.informedConsentMetadata.studentsPresence ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            <span>{t('informedConsent.studentsPresence')}</span>
                        </div>
                    </div>
                </div>
            </SectionCard>
        )}
      </div>
    </div>
  );
};
