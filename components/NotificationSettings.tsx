import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Check, Smartphone, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { useReminders } from '../hooks/useReminders.ts';
import { disablePush, enablePush, isIos, pushState, sendTestPush, type PushState } from '../services/push.ts';
import { User } from '../types.ts';

interface NotificationSettingsProps {
  user: User;
  onUpdate: () => void;
}

/**
 * The patient's reminders: by email, sent by the server on planned session
 * days and after some days without a session; and, optionally, as push
 * notifications on this device. Switching reminders on or off is giving or
 * withdrawing the notification consent.
 */
export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ user, onUpdate }) => {
  const { t } = useLanguage();
  const { on, turnOn, decline } = useReminders();
  const [push, setPush] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    pushState().then(setPush).catch(() => setPush('unsupported'));
  }, []);

  const run = async (action: () => Promise<boolean>, success: string) => {
    setBusy(true);
    setMessage(null);
    const ok = await action().catch(() => false);
    setMessage(ok ? { type: 'success', text: success } : { type: 'error', text: t('profile.remindersSaveError') });
    if (ok) onUpdate();
    setBusy(false);
  };

  const toggleReminders = () =>
    on
      ? run(async () => {
          await disablePush();
          setPush(await pushState());
          return decline();
        }, t('profile.consentWithdrawn'))
      : run(turnOn, t('profile.remindersOn'));

  const togglePush = () =>
    push === 'on'
      ? run(async () => {
          await disablePush();
          setPush(await pushState());
          return true;
        }, t('profile.pushOff'))
      : run(async () => {
          const state = await enablePush();
          setPush(state);
          return state === 'on';
        }, t('profile.pushOn'));

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${on ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {on ? <Bell size={20} /> : <BellOff size={20} />}
            </div>
            <div>
              <p className="font-medium text-slate-900">{t('profile.remindersTitle')}</p>
              {on && user.notificationPreferences?.consentDate && (
                <p className="text-xs text-slate-500">{t('profile.consentGiven')} ({new Date(user.notificationPreferences.consentDate).toLocaleDateString()})</p>
              )}
            </div>
          </div>
          <button
            onClick={toggleReminders}
            disabled={busy}
            role="switch"
            aria-checked={on}
            aria-label={t('profile.remindersTitle')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600">{t('profile.notificationConsentExplain')}</p>
      </div>

      {on && push !== null && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex items-center gap-3">
            <Smartphone size={20} className="text-slate-500" aria-hidden="true" />
            <p className="font-medium text-slate-900 flex-grow">{t('profile.pushTitle')}</p>
            {(push === 'on' || push === 'off') && (
              <button
                onClick={togglePush}
                disabled={busy}
                role="switch"
                aria-checked={push === 'on'}
                aria-label={t('profile.pushTitle')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${push === 'on' ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${push === 'on' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {push === 'needs-install' ? t('profile.pushNeedsInstall')
              : push === 'blocked' ? t('profile.pushBlocked')
              : push === 'unsupported' ? t('profile.pushUnsupported')
              : push === 'server-off' ? t('profile.pushServerOff')
              : isIos() ? t('profile.pushExplainIos') : t('profile.pushExplain')}
          </p>
          {push === 'on' && (
            <button
              onClick={() => run(async () => { await sendTestPush(); return true; }, t('profile.pushTestSent'))}
              disabled={busy}
              className="text-sm font-medium text-indigo-700 hover:underline"
            >
              {t('profile.pushTest')}
            </button>
          )}
        </div>
      )}

      {message && (
        <div
          role="status"
          className={`p-3 rounded-xl flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
        >
          {message.type === 'success' ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
          {message.text}
        </div>
      )}
    </div>
  );
};
