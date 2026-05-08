import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = 2026; 
  const appName = t('appName');

  return (
    <footer className="mt-auto bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-uib-black mb-3 font-medium">
          &copy; {currentYear} <span className="font-bold text-uib-blue">{appName}</span>. Bornas, Tortella, Llabrés, Gelabert.
        </p>
        <p className="text-xs text-uib-darkGray font-bold tracking-widest uppercase mb-4">
          Espai de Benestar Psicològic &bull; Universitat de les Illes Balears
        </p>
        <div className="flex justify-center gap-6 mb-6">
           <a href="#/feedback" className="text-xs font-black uppercase tracking-widest text-uib-blue hover:text-uib-blue/70 transition-colors">
              {t('feedback.pageTitle')}
           </a>
           <a href="#/privacy-policy" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-uib-blue transition-colors">
              {t('auth.consentLinkText')}
           </a>
        </div>
        <p className="text-[10px] text-gray-400 mt-4 max-w-2xl mx-auto font-light">
          This is a demonstration application. Information presented is based on provided OCR content.
        </p>
      </div>
    </footer>
  );
};