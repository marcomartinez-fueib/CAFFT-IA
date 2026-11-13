import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { HelpVideoLibrary } from '../components/HelpVideoLibrary.tsx';

export const HelpVideosPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <PageTitle title={t('helpVideos.pageTitle')} className="font-display text-4xl lg:text-5xl border-uib-accent/20" />
      <p className="font-body text-xl text-slate-600 mb-12 leading-relaxed">{t('helpVideos.title')}</p>
      <HelpVideoLibrary />
    </div>
  );
};
