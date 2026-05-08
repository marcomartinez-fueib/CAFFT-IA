
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, BellOff, Clock, Calendar, Check, X, Info } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { NotificationService } from '../services/notificationService.ts';
import { User, NotificationPreferences } from '../types.ts';

interface NotificationSettingsProps {
  user: User;
  onUpdate: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user, onUpdate }) => {
  const { t } = useLanguage();
  const { updateUser } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    user.notificationPreferences || NotificationService.getDefaultPreferences()
  );
  const [permission, setPermission] = useState<NotificationPermission>(NotificationService.getPermissionStatus());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user.notificationPreferences) {
      setPrefs(user.notificationPreferences);
    }
  }, [user.notificationPreferences]);

  const handleToggle = async (field: keyof NotificationPreferences) => {
    if (field === 'enabled') {
      if (!prefs.enabled) {
        const result = await NotificationService.requestPermission();
        setPermission(result);
        if (result !== 'granted') {
          setMessage({ type: 'error', text: t('profile.consentWithdrawn') });
          return;
        }
      }
    }
    
    setPrefs(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'boolean' ? !prev[field] : prev[field]
    }));
  };

  const handleSelectChange = (field: keyof NotificationPreferences, value: string) => {
    setPrefs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Prepare updated prefs with consent date if needed
    const updatedPrefs = { ...prefs };
    if (updatedPrefs.enabled && !user.notificationPreferences?.enabled) {
        updatedPrefs.consentDate = Date.now();
    } else if (!updatedPrefs.enabled) {
        updatedPrefs.consentDate = undefined;
    }

    const success = await updateUser({ notificationPreferences: updatedPrefs });
    if (success) {
      setMessage({ type: 'success', text: t('profile.savePreferences') });
      onUpdate();
    } else {
      setMessage({ type: 'error', text: t('auth.registrationFailedError') });
    }
    setSaving(false);
  };

  const handleWithdrawConsent = async () => {
    const updatedPrefs = { ...prefs, enabled: false, consentDate: undefined };
    const success = await updateUser({ notificationPreferences: updatedPrefs });
    if (success) {
      setPrefs(updatedPrefs);
      setMessage({ type: 'success', text: t('profile.consentWithdrawn') });
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{t('profile.notificationsSectionTitle')}</h3>
          <p className="text-sm text-slate-500">{t('profile.notificationsDescription')}</p>
        </div>
        <div className={`p-2 rounded-full ${permission === 'granted' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
          {permission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${prefs.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
              <Bell size={20} />
            </div>
            <div>
              <p className="font-medium text-slate-900">{t('profile.enableNotifications')}</p>
              {prefs.consentDate && (
                <p className="text-xs text-slate-500">{t('profile.consentGiven')} ({new Date(prefs.consentDate).toLocaleDateString()})</p>
              )}
            </div>
          </div>
          <button
            onClick={() => handleToggle('enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${prefs.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs.enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {prefs.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6 pt-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <p className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">{t('profile.notificationTypes.reminders')}</p>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">{t('profile.notificationTypes.reminders')}</span>
                <input type="checkbox" checked={prefs.reminders} onChange={() => handleToggle('reminders')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">{t('profile.notificationTypes.newTasks')}</span>
                <input type="checkbox" checked={prefs.newTasks} onChange={() => handleToggle('newTasks')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">{t('profile.notificationTypes.followUp')}</span>
                <input type="checkbox" checked={prefs.followUp} onChange={() => handleToggle('followUp')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">{t('profile.notificationTypes.general')}</span>
                <input type="checkbox" checked={prefs.general} onChange={() => handleToggle('general')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} /> {t('profile.frequency.title')}
                </p>
                <select
                  value={prefs.frequency}
                  onChange={(e) => handleSelectChange('frequency', e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="daily">{t('profile.frequency.daily')}</option>
                  <option value="weekly">{t('profile.frequency.weekly')}</option>
                </select>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} /> {t('profile.timeRange')}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={prefs.startTime}
                    onChange={(e) => handleSelectChange('startTime', e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="time"
                    value={prefs.endTime}
                    onChange={(e) => handleSelectChange('endTime', e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
            <Info size={16} className="mt-0.5 flex-shrink-0" />
            <p>{t('profile.notificationConsentExplain')}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Check size={18} />}
              {t('profile.savePreferences')}
            </button>
            <button
              onClick={handleWithdrawConsent}
              className="px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-xl transition-colors border border-red-100"
            >
              {t('profile.withdrawConsent')}
            </button>
          </div>
        </motion.div>
      )}

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
        >
          {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {message.text}
        </motion.div>
      )}
    </div>
  );
};
