
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { LANGUAGES } from '../constants.ts';
import { Language } from '../types.ts';
import { GlobeIcon, ChevronDownIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getShortName = (name: string) => {
    if (name === 'Català') return 'CA';
    if (name === 'Español') return 'ES';
    if (name === 'English') return 'EN';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef} id="language-switcher">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 bg-white border border-slate-200 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl shadow-sm hover:bg-slate-50 transition-all focus:outline-none ring-4 shadow-slate-100 ring-slate-100/50"
      >
        <GlobeIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 text-slate-400" />
        <span className="text-xs sm:text-xs font-bold text-slate-700">{getShortName(currentLang.name)}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-1 w-36 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-1.5 space-y-0.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as Language);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    language === lang.code
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
