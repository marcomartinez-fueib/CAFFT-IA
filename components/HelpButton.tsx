
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

// Chat Icon SVG
const ChatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

interface HelpButtonProps {
  onClick: () => void;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick }) => {
  const { t } = useLanguage();
  return (
    <button
      id="help-button"
      onClick={onClick}
      className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-sky-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl shadow-sky-200 hover:bg-sky-600 hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all duration-300 ease-in-out z-[9000] border-2 border-white/20"
      aria-label={t('general.help')}
      title={t('general.help')}
    >
      <div className="relative">
        <ChatIcon className="h-6 w-6 sm:h-7 sm:w-7" />
        <span className="absolute -top-1 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-100 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-100"></span>
        </span>
      </div>
    </button>
  );
};
