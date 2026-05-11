
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
    ResponsiveContainer,
    ReferenceArea
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

  if (type === 'habituation_tutorial') {
    const tutorialData = [
      { time: 0, anxiety: 2, escape: 2 },
      { time: 5, anxiety: 6, escape: 6 },
      { time: 10, anxiety: 9, escape: 9 },
      { time: 11, anxiety: 8, escape: 1 }, // Escape happens
      { time: 15, anxiety: 7, escape: 0.5 },
      { time: 25, anxiety: 4, escape: 0.2 },
      { time: 40, anxiety: 1.5, escape: 0.1 },
    ];

    const labels = {
      title: t('aiChat.didactic.habituationTitle') || "Com funciona l'habituació?",
      up: t('aiChat.didactic.upLabel') || 'Pujada',
      habituation: t('aiChat.didactic.habituationLabel') || 'Habituació',
      good: t('aiChat.didactic.exposureGood') || 'Exposició (Bé)',
      goodDesc: t('aiChat.didactic.exposureGoodDesc') || "L'ansietat puja però si et quedes, el teu cervell aprèn que no hi ha perill i baixa sola.",
      bad: t('aiChat.didactic.avoidanceBad') || 'Evitació (Malament)',
      badDesc: t('aiChat.didactic.avoidanceBadDesc') || "Si fuges, l'ansietat baixa ràpid però el cervell NO aprèn. La pròxima vegada serà igual de forta.",
      anxietyLevel: t('aiChat.didactic.anxietyLevel') || "Nivell d'ansietat"
    };

    return (
      <div className="my-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-md">
        <div className="flex items-center space-x-3 mb-4">
            <div className="bg-sky-500 p-2 rounded-xl text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="text-sm font-black text-uib-blue uppercase tracking-tight">{labels.title}</h4>
        </div>
        
        <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tutorialData} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <Tooltip content={<div className="bg-white p-2 rounded-lg border shadow-sm text-[10px] font-bold text-slate-500">{labels.anxietyLevel}</div>} />
                    <ReferenceArea x1={0} x2={10} fill="#fee2e2" fillOpacity={0.3} label={{ position: 'top', value: labels.up, fontSize: 10, fill: '#ef4444', fontWeight: 'bold' }} />
                    <ReferenceArea x1={10} x2={40} fill="#f0fdf4" fillOpacity={0.3} label={{ position: 'top', value: labels.habituation, fontSize: 10, fill: '#22c55e', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="anxiety" stroke={uibBlue} strokeWidth={3} dot={false} name={labels.habituation} />
                    <Line type="monotone" dataKey="escape" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} dot={false} name={labels.bad} />
                </LineChart>
            </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-black text-uib-blue uppercase mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-uib-blue mr-2 animate-pulse" />
                    {labels.good}
                </p>
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{labels.goodDesc}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 mr-2" />
                    {labels.bad}
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{labels.badDesc}</p>
            </div>
        </div>
      </div>
    );
  }

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
