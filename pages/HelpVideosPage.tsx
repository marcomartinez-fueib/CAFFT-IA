import React from 'react';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { YOUTUBE_ICON_SVG } from '../constants.ts';
import { translations } from '../data/translations.ts';
import { motion } from 'motion/react';

export const HelpVideosPage: React.FC = () => {
  const { t, language } = useLanguage();

  const videosArray = translations[language]?.helpVideos?.videos;

  return (
    <div className="container mx-auto px-6 py-12">
      <PageTitle title={t('helpVideos.pageTitle')} className="font-display text-4xl lg:text-5xl border-uib-accent/20" />
      <p className="font-body text-xl text-slate-600 mb-12 leading-relaxed max-w-3xl">{t('helpVideos.title')}</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {Array.isArray(videosArray) && videosArray.length > 0 ? (
          videosArray.map((video, index) => {
            if (!video || typeof video.titleKey !== 'string') return null;
            const videoTitle = t(`helpVideos.${video.titleKey}`);
            const videoLink = video.link || '#';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <SectionCard className="h-full !p-0">
                  <a href={videoLink} target="_blank" rel="noopener noreferrer" className="block group h-full">
                    <div className="flex flex-col h-full p-8 lg:p-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-uib-blue text-white rounded-2xl flex items-center justify-center font-display font-black group-hover:bg-uib-accent transition-colors shadow-lg shadow-uib-blue/20">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div 
                          className="w-10 h-10 text-red-600 opacity-40 group-hover:opacity-100 transition-all group-hover:scale-110"
                          dangerouslySetInnerHTML={{ __html: YOUTUBE_ICON_SVG }} 
                        />
                      </div>
                      
                      <h3 className="text-2xl font-display font-bold text-uib-blue mb-4 group-hover:text-uib-accent transition-colors leading-tight">
                        {videoTitle}
                      </h3>
                      
                      <div className="mt-auto flex items-center gap-2 text-uib-accent font-display font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        Visualitza el vídeo
                        <div className="w-8 h-px bg-uib-accent" />
                      </div>
                    </div>
                  </a>
                </SectionCard>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
            <p className="font-body text-slate-400 text-lg">{t('helpVideos.noVideos')}</p> 
          </div>
        )}
      </div>
    </div>
  );
};