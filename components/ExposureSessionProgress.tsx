
import React from 'react';
import { motion } from 'motion/react';
import { Check, Play, Circle, BarChart3 } from 'lucide-react';
import { ExposureVideo, VideoDiscomfortRating } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface ExposureSessionProgressProps {
  videoSequence: ExposureVideo[];
  currentVideoIndex: number;
  completedVideoIds: string[];
  discomfortRatings: VideoDiscomfortRating[];
}

export const ExposureSessionProgress: React.FC<ExposureSessionProgressProps> = ({
  videoSequence,
  currentVideoIndex,
  completedVideoIds,
  discomfortRatings
}) => {
  const { t } = useLanguage();

  if (videoSequence.length === 0) return null;

  // Group ratings by video ID to show history for each video in the session
  const getRatingsForVideo = (videoId: string) => {
    return discomfortRatings.filter(r => r.id === videoId);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Play className="w-3 h-3 text-uib-blue fill-uib-blue" />
          {t('exposure.sessionProgressTitle') || 'Progrés de la Sessió'}
        </h3>
        <span className="text-[10px] font-black text-uib-blue bg-uib-blue/5 px-2 py-0.5 rounded-full border border-uib-blue/10 uppercase tracking-tight">
          {completedVideoIds.length} / {videoSequence.length} {t('exposure.videosCompleted') || 'Completats'}
        </span>
      </div>

      <div className="p-6">
        {/* Progress Steps */}
        <div className="flex items-start justify-between relative">
          {/* Connector Line */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-100 -z-0" />
          
          {videoSequence.map((video, index) => {
            const isCompleted = completedVideoIds.includes(video.id);
            const isCurrent = index === currentVideoIndex;
            const isPending = index > currentVideoIndex && !isCompleted;
            const videoRatings = getRatingsForVideo(video.id);
            const lastRating = videoRatings.length > 0 ? videoRatings[videoRatings.length - 1].rating : null;

            return (
              <div key={video.id} className="relative z-10 flex flex-col items-center flex-1">
                {/* Step Circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.2 : 1,
                    backgroundColor: isCompleted ? '#10b981' : isCurrent ? '#ffffff' : '#f8fafc',
                    borderColor: isCompleted ? '#10b981' : isCurrent ? '#005FB8' : '#e2e8f0',
                  }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 bg-uib-blue rounded-full animate-pulse" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </motion.div>

                {/* Video Info */}
                <div className="mt-3 text-center px-1">
                  <p className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${
                    isCurrent ? 'text-uib-blue' : isCompleted ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    {t('exposure.' + video.relatedArea)}
                  </p>
                  
                  {/* Rating Indicator */}
                  {videoRatings.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                      {videoRatings.map((r, i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.rating <= 2 ? 'bg-green-500' : r.rating <= 5 ? 'bg-yellow-400' : 'bg-red-500'
                          }`}
                          title={`Intento ${i + 1}: ${r.rating}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rating History Detail (Current or Recently Rated Video) */}
        {discomfortRatings.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-2 mb-4 text-slate-400">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t('exposure.ratingHistory') || 'Historial de Malestar'}
              </span>
            </div>
            
            <div className="relative h-24 px-2">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.05]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-full border-t border-slate-300" />
                ))}
              </div>

              <div className="flex gap-2 items-end h-full relative z-10">
                {discomfortRatings.map((rating, idx) => {
                  const video = videoSequence.find(v => v.id === rating.id);
                  const isLast = idx === discomfortRatings.length - 1;
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${(rating.rating / 10) * 100}%`, opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex-1 flex flex-col items-center group relative h-full"
                    >
                      <div 
                        className={`w-full h-full rounded-t-md transition-all duration-300 relative ${
                          rating.rating <= 2 ? 'bg-emerald-400 hover:bg-emerald-500' : 
                          rating.rating <= 5 ? 'bg-amber-400 hover:bg-amber-500' : 
                          'bg-rose-500 hover:bg-rose-600'
                        } ${isLast ? 'ring-2 ring-sky-500 ring-offset-2' : ''}`}
                      />
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-black py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 whitespace-nowrap shadow-xl pointer-events-none z-30">
                        <div className="flex flex-col gap-0.5">
                          <span className="opacity-60 text-[8px] uppercase tracking-tighter">
                            {video ? t('evolution.scene_' + video.relatedArea) : 'Video'}
                          </span>
                          <span className="text-sm font-black">{rating.rating} / 10</span>
                        </div>
                      </div>

                      {/* Label below bar */}
                      <div className="absolute top-full mt-2">
                        <span className={`text-[10px] font-black transition-colors ${
                          isLast ? 'text-sky-600' : 'text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
