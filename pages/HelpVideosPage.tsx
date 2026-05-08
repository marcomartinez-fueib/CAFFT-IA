import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { YOUTUBE_ICON_SVG } from '../constants.ts';
import { translations } from '../data/translations.ts';

export const HelpVideosPage: React.FC = () => {
  const { t, language } = useLanguage();

  const videosArray = translations[language]?.helpVideos?.videos;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('helpVideos.pageTitle')} />
      <p className="text-lg text-gray-600 mb-8">{t('helpVideos.title')}</p>

      <div className="grid md:grid-cols-2 gap-6">
        {Array.isArray(videosArray) && videosArray.length > 0 ? (
          videosArray.map((video, index) => {
            // Ensure video object and its titleKey are valid
            if (!video || typeof video.titleKey !== 'string') {
              console.warn('Skipping invalid video item:', video);
              return null; // Don't render this item
            }
            const videoTitle = t(`helpVideos.${video.titleKey}`);
            const videoLink = video.link || '#'; // Fallback for link

            return (
              <SectionCard key={index} className="hover:shadow-sky-200 transition-shadow duration-300">
                <a href={videoLink} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-sky-700 group-hover:text-sky-500 transition-colors">
                      {index + 1}. {videoTitle}
                    </h3>
                    <div 
                      className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity"
                      dangerouslySetInnerHTML={{ __html: YOUTUBE_ICON_SVG }} 
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Click to watch on YouTube (placeholder link).
                  </p>
                </a>
              </SectionCard>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">{t('helpVideos.noVideos')}</p> 
          </div>
        )}
      </div>
       {/* Image removed */}
    </div>
  );
};