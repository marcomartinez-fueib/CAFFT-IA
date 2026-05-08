
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

import { MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  const { t } = useLanguage();
  return (
    <motion.button
      id="help-button"
      onClick={onClick}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 bg-uib-blue text-white group flex items-center gap-3 px-4 py-4 rounded-[28px] shadow-[0_20px_50px_rgba(0,38,62,0.3)] hover:shadow-[0_25px_60px_rgba(0,38,62,0.4)] transition-all duration-300 z-[9000] border-2 border-white/10"
      aria-label={t('general.help')}
      title={t('general.help')}
    >
      <div className="relative bg-uib-accent p-2 rounded-2xl group-hover:scale-110 transition-transform">
        <MessageSquare className="h-6 w-6 text-white" />
        <span className="absolute -top-1 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </div>
      <span className="hidden sm:block font-display font-black text-sm uppercase tracking-widest pr-2">
        {t('onboarding.step6.title')}
      </span>
    </motion.button>
  );
};
