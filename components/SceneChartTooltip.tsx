
import React from 'react';
import { SceneDiscomfortChartDataPoint } from '../types';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  chartData?: SceneDiscomfortChartDataPoint[];
}

export const SceneChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, t, chartData }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SceneDiscomfortChartDataPoint; 
    const currentRating = payload[0].value as number;
    
    let feedback = t('evolution.feedbackStable');
    let trend: 'down' | 'up' | 'stable' = 'stable';

    if (chartData && data.instance > 1) {
      const prevData = chartData.find(d => d.instance === data.instance - 1);
      if (prevData) {
        if (currentRating < prevData.rating) {
          feedback = t('evolution.feedbackImproving');
          trend = 'down';
        } else if (currentRating > prevData.rating) {
          feedback = t('evolution.feedbackWorsening');
          trend = 'up';
        } else {
          feedback = t('evolution.feedbackStable');
          trend = 'stable';
        }
      }
    }

    const uibBlue = "#005596";
    const uibBlack = "#333333";

    return (
      <div className="bg-white p-4 border border-gray-200 shadow-xl rounded-xl text-sm font-sans max-w-[220px] ring-1 ring-black/5">
        <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-2">{`${t('evolution.sceneExposureInstanceAxisLabel')} ${label}`}</p>
        
        <div className="flex items-end justify-between mb-3">
           <div className="flex items-baseline">
              <span className="text-3xl font-black text-uib-blue leading-none" style={{ color: uibBlue }}>{currentRating}</span>
              <span className="text-[10px] text-gray-400 font-bold ml-1">/10</span>
           </div>
           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${
             trend === 'down' ? 'bg-green-100 text-green-600' :
             trend === 'up' ? 'bg-red-100 text-red-600' :
             'bg-blue-100 text-blue-600'
           }`}>
             {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '→'}
           </div>
        </div>

        <div className={`p-2 rounded-lg text-xs font-semibold leading-snug mb-3 ${
             trend === 'down' ? 'bg-green-50 text-green-800' :
             trend === 'up' ? 'bg-red-50 text-red-800' :
             'bg-blue-50 text-blue-800'
        }`}>
          {feedback}
        </div>

        {data.videoTitle && (
            <div className="pt-2 border-t border-gray-100">
               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight mb-0.5">{t('evolution.watchedVideoTooltipLabel')}</p>
               <p className="text-[10px] text-uib-black font-bold italic line-clamp-2" style={{ color: uibBlack }}>{data.videoTitle}</p>
            </div>
        )}
      </div>
    );
  }
  return null;
};
