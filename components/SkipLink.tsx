import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

/**
 * The first thing the keyboard reaches: a link past the menus to the page's
 * content (WCAG 2.4.1). Hidden until it has the focus.
 */
export const SkipLink: React.FC = () => {
  const { t } = useLanguage();
  return (
    <a
      href="#main-content"
      onClick={(e) => {
        // The app's router uses the hash, so move the focus by hand.
        e.preventDefault();
        document.getElementById('main-content')?.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-uib-blue focus:text-white focus:font-semibold"
    >
      {t('common.skipToContent')}
    </a>
  );
};
