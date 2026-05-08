
import React, { useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { QpviiEvolutionChart } from './QpviiEvolutionChart';
import { SceneChartTooltip } from './SceneChartTooltip';
import { 
    EvolutionChartDataPoint, 
    QpviiLineConfig, 
    UserExposureProgress, 
    ExposureSceneKey,
    SceneDiscomfortChartDataPoint 
} from '../types';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { EXPOSURE_VIDEOS } from '../constants';

interface ChatVisualizerProps {
  type: string;
  qpviiData?: EvolutionChartDataPoint[];
  exposureData?: UserExposureProgress[];
  rciData?: {
    value: number;
    isSignificant: boolean;
    improvement: number;
    improvementPercent: string;
  } | null;
}

const uibBlue = "#005596";
const uibRed = "#BA0C2F";
const uibBlack = "#333333";
const uibWarmGray = "#A7A596";
const uibDarkGray = "#555555";

const sceneTranslationKeys: Record<ExposureSceneKey, string> = {
  psychoed: 'evolution.scene_psychoed',
  preparation: 'evolution.scene_preparation',
  boarding: 'evolution.scene_boarding',
  takeoff: 'evolution.scene_takeoff',
  inflight: 'evolution.scene_inflight',
  landing: 'evolution.scene_landing',
  accidents: 'evolution.scene_accidents',
};

export const ChatVisualizer: React.FC<ChatVisualizerProps> = ({ type, qpviiData, exposureData, rciData }) => {
  const { t } = useLanguage();

  const qpviiLineConfigs: QpviiLineConfig[] = useMemo(() => [
    { dataKey: 'total', name: t('evolution.totalScoreEvolution'), color: uibRed },
    { dataKey: 'malestarGeneral', name: t('evolution.malestarGeneralEvolution'), color: uibBlack },
    { dataKey: 'subPreparatius', name: t('evolution.subPreparatiusEvolution'), color: uibWarmGray },
    { dataKey: 'subVicari', name: t('evolution.subVicariEvolution'), color: uibDarkGray },
    { dataKey: 'subVol', name: t('evolution.subVolEvolution'), color: uibBlue }, 
  ], [t]);

  if (type === 'evolution') {
    if (!qpviiData || qpviiData.length === 0) return null;
    return (
      <div className="my-3 p-3 sm:p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
        <h4 className="text-[10px] sm:text-xs font-black text-slate-500 mb-3 uppercase tracking-widest text-center">{t('evolution.qpviiEvolutionChartTitle')}</h4>
        <div className="h-48 sm:h-64">
          <QpviiEvolutionChart data={qpviiData} lines={qpviiLineConfigs} />
        </div>
        {rciData && (
          <div className={`mt-4 p-3 rounded-lg border flex items-center ${rciData.isSignificant ? 'bg-green-50/50 border-green-100' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${rciData.isSignificant ? 'bg-green-600 text-white' : 'bg-blue-600 text-white shadow-sm'}`}>
                <span className="font-black text-base">{rciData.value.toFixed(1)}</span>
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-slate-700 flex items-center uppercase tracking-wide text-[9px]">
                    {t('evolution.rciTitle')}
                    {rciData.isSignificant && (
                        <span className="ml-2 px-1.5 py-0.5 bg-green-200 text-green-800 text-[7px] rounded-md font-black uppercase">SIG.</span>
                    )}
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {t('evolution.improvement')}: {rciData.improvement} {t('evolution.points')} ({rciData.improvementPercent}%)
                </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'habituation' && exposureData && exposureData.length > 0) {
    // Show the most recent session's habituation
    const latestSession = exposureData[0];
    const sceneData: Record<string, SceneDiscomfortChartDataPoint[]> = {};
    const sceneInstanceCounters: Record<string, number> = {};

    const sortedRatings = [...(latestSession.discomfortRatings || [])].sort((a, b) => a.videoTimestamp - b.videoTimestamp);

    sortedRatings.forEach(rating => {
        const videoInfo = EXPOSURE_VIDEOS.find(v => v.id === rating.id);
        if (videoInfo) {
            const scene = videoInfo.relatedArea;
            if (!sceneData[scene]) {
                sceneData[scene] = [];
                sceneInstanceCounters[scene] = 0;
            }
            sceneInstanceCounters[scene]++;
            sceneData[scene].push({
                instance: sceneInstanceCounters[scene],
                rating: rating.rating,
                videoTitle: t(videoInfo.titleKey),
                timestamp: rating.videoTimestamp
            });
        }
    });

    const scenes = Object.keys(sceneData);
    if (scenes.length === 0) return null;

    return (
        <div className="my-3 space-y-3">
             {scenes.map(sceneKey => (
                 <div key={sceneKey} className="p-3 sm:p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest text-center">
                        {t(sceneTranslationKeys[sceneKey as ExposureSceneKey])}
                    </h4>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sceneData[sceneKey]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="instance" hide />
                                <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                                <Tooltip content={<SceneChartTooltip t={t} chartData={sceneData[sceneKey]} />} />
                                <Line type="monotone" dataKey="rating" stroke={uibBlue} strokeWidth={2.5} dot={{ r: 3, fill: uibBlue, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
             ))}
        </div>
    );
  }

  return null;
};
