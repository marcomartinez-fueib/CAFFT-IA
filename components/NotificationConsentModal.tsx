
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ShieldCheck, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.tsx';

interface NotificationConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const NotificationConsentModal: React.FC<NotificationConsentModalProps> = ({ isOpen, onAccept, onDecline }) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onDecline}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 animate-pulse">
                    <Bell size={40} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-md">
                    <div className="bg-green-100 text-green-600 p-1.5 rounded-full">
                      <ShieldCheck size={16} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-3 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  {t('profile.notificationConsentPrompt')}
                </h2>
                <p className="text-slate-500">
                  {t('profile.notificationConsentExplain')}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onAccept}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group"
                >
                  <Bell size={20} className="group-hover:animate-ring" />
                  {t('profile.acceptButton')}
                </button>
                <button
                  onClick={onDecline}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 px-6 rounded-2xl transition-colors border border-slate-200"
                >
                  {t('profile.declineButton')}
                </button>
              </div>

              <p className="mt-6 text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest leading-loose max-w-[80%] mx-auto">
                No compartirem mai les teves dades clíniques. Notificacions segures i respectuoses.
              </p>
            </div>

            <button
              onClick={onDecline}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
