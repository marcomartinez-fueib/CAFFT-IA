

import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { Language, LanguageContextType } from '../types.ts';
import { DEFAULT_LANGUAGE } from '../constants.ts';
import { translations } from '../data/translations.ts';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('cafft_language');
    if (saved && Object.values(Language).includes(saved as Language)) {
      return saved as Language;
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cafft_language', lang);
  }, []);

  const t = useCallback((key: string, options?: Record<string, any>): any => {
    const keys = key.split('.');
    const returnObjects = options?.returnObjects === true;
    let text = translations[language] as any;
    for (const k of keys) {
      if (text && typeof text === 'object' && k in text) {
        text = text[k];
      } else {
        // console.warn(`Translation key "${key}" not found for language "${language}"`);
        return key; // Return the key itself if not found
      }
    }

    if (typeof text === 'string' && options) {
      Object.entries(options).forEach(([placeholder, value]) => {
        const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
        text = text.replace(regex, String(value));
      });
    }
    
    if (returnObjects) return text;
    return typeof text === 'string' ? text : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};