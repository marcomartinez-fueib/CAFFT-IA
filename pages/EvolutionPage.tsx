import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { PostTreatmentGuidelines } from '../components/PostTreatmentGuidelines';
import { 
    QPVIIUserResult, 
    UserExposureProgress, 
    EvolutionChartDataPoint, 
    QpviiLineConfig, 
    ExposureVideo,
    ExposureSceneKey,
    SceneDiscomfortChartDataPoint
} from '../types';
import { getQPVIIResultsForUser, getAllUserExposureProgress } from '../utils/localStorageDB';
import { calculateQPVIIScores } from '../utils/qpviiScoring';
import { QpviiEvolutionChart } from '../components/QpviiEvolutionChart';
import { SceneChartTooltip } from '../components/SceneChartTooltip';
import { EXPOSURE_VIDEOS } from '../constants';
import { isExposureFullyCompleted } from '../utils/exposureUtils';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck } from 'lucide-react';

// UIB Official Colors
const uibBlue = "#005596";
const uibRed = "#BA0C2F";
const uibBlack = "#333333";
const uibWarmGray = "#A7A596";
const uibLightGray = "#D9D9D6";
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

const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    const value = payload.rating;
    const ratio = value / 10;
    let fill = '#10B981';
    if (ratio >= 0.7) fill = '#EF4444';
    else if (ratio >= 0.4) fill = '#F59E0B';
    
    return (
        <circle cx={cx} cy={cy} r={4} fill={fill} strokeWidth={1.5} stroke="#fff" />
    );
};

const HabituationGradient = () => (
  <defs>
    <linearGradient id="habituationGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#EF4444" />   {/* 10 - Red */}
      <stop offset="30%" stopColor="#EF4444" />  {/* 7 - Red */}
      <stop offset="35%" stopColor="#F59E0B" />  {/* Transition */}
      <stop offset="60%" stopColor="#F59E0B" />  {/* 4 - Yellow */}
      <stop offset="65%" stopColor="#10B981" />  {/* Transition */}
      <stop offset="100%" stopColor="#10B981" /> {/* 0 - Green */}
    </linearGradient>
  </defs>
);

export const EvolutionPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Raw Data State
  const [rawQpviiHistory, setRawQpviiHistory] = useState<QPVIIUserResult[]>([]);
  const [rawExposureSessions, setRawExposureSessions] = useState<UserExposureProgress[]>([]);
  
  // Context/Nav State
  const fromExposureCompletion = location.state?.fromExposureCompletion;
  const fromFullCycleCompletion = location.state?.fromFullCycleCompletion;
  const qpviiTimestamp = location.state?.qpviiTimestamp;

  const getLocaleForDate = () => {
    switch(language) {
      case 'ca': return 'ca-ES';
      case 'es': return 'es-ES';
      case 'en': return 'en-US';
      default: return 'en-US';
    }
  };

  // 1. Load Raw Data (Side Effect)
  useEffect(() => {
    if (!currentUser) return;
    const allQpviiHistory = getQPVIIResultsForUser(currentUser.id);
    const allProgressForUser = getAllUserExposureProgress().filter(p => p.userId === currentUser.id);
    
    setRawQpviiHistory(allQpviiHistory);
    setRawExposureSessions(allProgressForUser);
  }, [currentUser]);

    const consolidatedQpviiData: EvolutionChartDataPoint[] = useMemo(() => {
        const sortedHistory = [...rawQpviiHistory].sort((a, b) => a.timestamp - b.timestamp);
        let data: EvolutionChartDataPoint[] = [];

        if (sortedHistory.length >= 2) {
            const preResult = sortedHistory[0];
            const postResult = sortedHistory[sortedHistory.length - 1];
            
            const preScores = calculateQPVIIScores(preResult.answers);
            const postScores = calculateQPVIIScores(postResult.answers);

            data = [
                {
                    dateLabel: t('evolution.preTreatment'),
                    total: preScores.total,
                    malestarGeneral: preScores.malestarGeneral,
                    subPreparatius: preScores.subPreparatius,
                    subVicari: preScores.subVicari,
                    subVol: preScores.subVol,
                },
                {
                    dateLabel: t('evolution.postTreatment'),
                    total: postScores.total,
                    malestarGeneral: postScores.malestarGeneral,
                    subVicari: postScores.subVicari,
                    subPreparatius: postScores.subPreparatius,
                    subVol: postScores.subVol,
                },
            ];
        } else if (sortedHistory.length === 1) {
            const singleResult = sortedHistory[0];
            const scores = calculateQPVIIScores(singleResult.answers);
            const locale = getLocaleForDate();
            data = [{
                dateLabel: new Date(singleResult.date + 'T00:00:00').toLocaleDateString(locale, { year: '2-digit', month: 'short', day: 'numeric' }),
                total: scores.total,
                malestarGeneral: scores.malestarGeneral,
                subPreparatius: scores.subPreparatius,
                subVicari: scores.subVicari,
                subVol: scores.subVol,
            }];
        }
        return data;
    }, [rawQpviiHistory, t, language]);

    const rciData = useMemo(() => {
        if (rawQpviiHistory.length < 2) return null;
        const sorted = [...rawQpviiHistory].sort((a, b) => a.timestamp - b.timestamp);
        const firstTotal = calculateQPVIIScores(sorted[0].answers).total;
        const lastTotal = calculateQPVIIScores(sorted[sorted.length - 1].answers).total;
        const sDiff = 17.6; 
        const rci = (firstTotal - lastTotal) / sDiff;
        return { 
            value: rci, 
            isSignificant: rci >= 1.96,
            firstTotal,
            lastTotal,
            improvement: firstTotal - lastTotal,
            improvementPercent: firstTotal > 0 ? ((firstTotal - lastTotal) / firstTotal * 100).toFixed(1) : '0'
        };
    }, [rawQpviiHistory]);

    // 2. Derive Display Data (Computation) - Optimized with useMemo
    const { 
        filteredExposureSessions, 
        showSessionDebrief, 
        showProgramCompleteCard, 
        isCurrentHierarchyCompleted,
        activeSessionTimestamp,
        originalTimestampForDebrief
    } = useMemo(() => {
        
        // --- Session Filtering Logic ---
        let sessions = [];
        let isDebrief = false;
        let isCompleteCard = false;
        let isCompleted = false;
        let activeTimestamp: number | null = null;
        let origTimestamp: number | null = null;

        if (fromExposureCompletion && qpviiTimestamp) {
            // MODE 1: Session Debrief
            isDebrief = true;
            activeTimestamp = qpviiTimestamp;
            const sessionProgress = rawExposureSessions.find(p => p.qpviiTimestamp === qpviiTimestamp);
            sessions = sessionProgress ? [sessionProgress] : [];

            if (sessionProgress) {
                origTimestamp = sessionProgress.isReview ? sessionProgress.originalQpviiTimestamp || qpviiTimestamp : qpviiTimestamp;
                const sequenceToCheck = sessionProgress.videoSequence
                    .map(id => EXPOSURE_VIDEOS.find(v => v.id === id))
                    .filter((v): v is ExposureVideo => !!v);

                if (isExposureFullyCompleted(sessionProgress, sequenceToCheck)) {
                    isCompleted = true;
                }
            }
        } else {
            // MODE 2: Full Evolution
            sessions = [...rawExposureSessions].sort((a, b) => (b.qpviiTimestamp || b.lastUpdated) - (a.qpviiTimestamp || a.lastUpdated));
            
            if (fromFullCycleCompletion && qpviiTimestamp) {
                isCompleteCard = true;
                activeTimestamp = qpviiTimestamp;
            } else {
                for (const result of rawQpviiHistory) {
                    const progress = rawExposureSessions.find(p => p.qpviiTimestamp === result.timestamp);
                    if (progress?.programCompleted) {
                        isCompleteCard = true;
                        activeTimestamp = result.timestamp;
                        break; 
                    }
                }
            }
        }

        return {
            filteredExposureSessions: sessions,
            showSessionDebrief: isDebrief,
            showProgramCompleteCard: isCompleteCard,
            isCurrentHierarchyCompleted: isCompleted,
            activeSessionTimestamp: activeTimestamp,
            originalTimestampForDebrief: origTimestamp
        };

    }, [rawQpviiHistory, rawExposureSessions, fromExposureCompletion, fromFullCycleCompletion, qpviiTimestamp]);


  const handleFinishProgram = () => {
    if (activeSessionTimestamp) {
        navigate('/celebration', { state: { qpviiTimestamp: activeSessionTimestamp } });
    } else {
        navigate('/');
    }
  };

  const handleReviewScenes = () => {
    const timestampForReview = originalTimestampForDebrief || (showSessionDebrief ? activeSessionTimestamp : (rawQpviiHistory.length > 0 ? rawQpviiHistory[0].timestamp : null));
    if (timestampForReview) {
        navigate('/review-selection', { state: { qpviiTimestamp: timestampForReview } });
    } else {
        navigate('/qpvii-evaluation');
    }
  };

  const handleLogout = () => {
      logout();
      navigate('/');
  };
  
  const handleGoToHome = () => {
    navigate('/');
  };

  const handleReEvaluate = () => {
    if (originalTimestampForDebrief) {
        navigate('/qpvii-evaluation', { 
            state: { 
                isPostExposureEval: true, 
                originalQpviiTimestamp: originalTimestampForDebrief
            } 
        });
    }
  };

  const handleResumeSession = () => {
    if (activeSessionTimestamp) {
        const progress = filteredExposureSessions.length > 0 ? filteredExposureSessions[0] : null;
        const scores = rawQpviiHistory.find(r => r.timestamp === (progress?.originalQpviiTimestamp || activeSessionTimestamp))?.scores;

        if (progress?.isReview) {
             navigate('/exposure', { 
                state: { 
                    reviewScenes: progress.videoSequence.map(id => EXPOSURE_VIDEOS.find(v => v.id === id)?.relatedArea).filter((v): v is ExposureSceneKey => !!v),
                    reviewSessionTimestamp: progress.qpviiTimestamp,
                    originalQpviiTimestamp: progress.originalQpviiTimestamp,
                },
                replace: true 
            });
        } else {
            navigate('/exposure', { 
                state: { qpviiTimestamp: activeSessionTimestamp, scores },
                replace: true 
            });
        }
    }
  };

  // Optimized Memoized line configs with UIB Colors
  const qpviiLineConfigs: QpviiLineConfig[] = useMemo(() => [
    { dataKey: 'total', name: t('evolution.totalScoreEvolution'), color: uibRed },
    { dataKey: 'malestarGeneral', name: t('evolution.malestarGeneralEvolution'), color: uibBlack },
    { dataKey: 'subPreparatius', name: t('evolution.subPreparatiusEvolution'), color: uibWarmGray },
    { dataKey: 'subVicari', name: t('evolution.subVicariEvolution'), color: uibDarkGray },
    { dataKey: 'subVol', name: t('evolution.subVolEvolution'), color: uibBlue }, 
  ], [t]);

  if (!currentUser) {
    return <p>{t('auth.loading')}</p>; 
  }
  
  const processSceneDataForChart = (sessionProgress: UserExposureProgress): Record<ExposureSceneKey, SceneDiscomfortChartDataPoint[]> => {
    const sceneData: Record<string, SceneDiscomfortChartDataPoint[]> = {};
    const sceneInstanceCounters: Record<string, number> = {};

    const sortedRatings = [...(sessionProgress.discomfortRatings || [])].sort((a, b) => a.videoTimestamp - b.videoTimestamp);

    sortedRatings.forEach(rating => {
        const videoInfo = EXPOSURE_VIDEOS.find(v => v.id === (rating.id || (rating as any).videoId));
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
    return sceneData as Record<ExposureSceneKey, SceneDiscomfortChartDataPoint[]>;
  };


  const calculateHabituationSlope = (ratings: number[]) => {
    if (ratings.length < 2) return 0;
    const n = ratings.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = ratings;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((prev, curr, i) => prev + curr * y[i], 0);
    const sumXX = x.reduce((prev, curr) => prev + curr * curr, 0);
    
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return 0;
    
    return (n * sumXY - sumX * sumY) / denominator;
  };

  const getSlopeLabel = (slope: number) => {
    if (slope < -0.2) return { label: t('evolution.slopeImproving'), color: 'text-green-600', bg: 'bg-green-50' };
    if (slope > 0.2) return { label: t('evolution.slopeWorsening'), color: 'text-red-600', bg: 'bg-red-50' };
    return { label: t('evolution.slopeStable'), color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const SessionDetailCardInternal: React.FC<{ progress: UserExposureProgress }> = ({ progress }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const locale = getLocaleForDate();
    let sessionDateStr: string;
    let title: string;

    if (progress.isReview) {
      sessionDateStr = new Date(progress.lastUpdated).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
      const baseTitle = t('evolution.sessionDate', { date: sessionDateStr });
      title = `${baseTitle} (${t('evolution.reviewSessionLabel')})`;
    } else {
      const qpviiResult = rawQpviiHistory.find(q => q.timestamp === progress.qpviiTimestamp);
      
      // FIX: Use lastUpdated to show when the exposure ACTUALLY happened, 
      // but keep qpviiResult date as fallback for standard sessions if lastUpdated is missing (legacy)
      const displayDate = progress.lastUpdated || (qpviiResult ? new Date(qpviiResult.date + 'T00:00:00').getTime() : Date.now());
      
      sessionDateStr = new Date(displayDate).toLocaleDateString(locale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      title = t('evolution.sessionDate', { date: sessionDateStr });
    }

    const ratings = progress.discomfortRatings.map(r => r.rating);
    const avgDiscomfort = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';
    const slope = calculateHabituationSlope(ratings);
    const slopeInfo = getSlopeLabel(slope);
    const videosWatchedCount = progress.completedVideoIds.length;

    const sceneChartsData = processSceneDataForChart(progress);

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-md">
        <div 
          className="p-5 flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-uib-black mb-1">{title}</h3>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center text-xs text-uib-darkGray">
                <span className="font-bold mr-1">{t('evolution.videosWatched')}:</span>
                {videosWatchedCount}
              </div>
              <div className="flex items-center text-xs text-uib-darkGray">
                <span className="font-bold mr-1">{t('evolution.averageDiscomfort')}:</span>
                {avgDiscomfort}/10
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${slopeInfo.bg} ${slopeInfo.color}`}>
                {t('evolution.habituationSlope')}: {slopeInfo.label} ({slope.toFixed(2)})
              </div>
            </div>
          </div>
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 pt-0 border-t border-gray-100 bg-gray-50/30">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 mt-4">{t('evolution.intraSessionEvolution')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                  {(Object.keys(sceneChartsData) as ExposureSceneKey[]).map(sceneKey => {
                    const dataForSceneChart = sceneChartsData[sceneKey];
                    if (!dataForSceneChart || dataForSceneChart.length === 0) {
                      return null;
                    }
                    const sceneName = t(sceneTranslationKeys[sceneKey] as any);
                    
                    return (
                      <div key={sceneKey} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <h5 className="font-bold text-uib-black text-center uppercase tracking-wide text-[10px] mb-4">
                          {t('evolution.sceneHabituationChartTitle', { sceneName: sceneName })}
                        </h5>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dataForSceneChart} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                              <HabituationGradient />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="instance" 
                                hide
                              />
                              <YAxis 
                                domain={[0, 10]} 
                                ticks={[0, 2, 4, 6, 8, 10]} 
                                tick={{ fontSize: 9, fill: '#94a3b8' }} 
                                axisLine={false}
                                tickLine={false}
                                label={{ value: t('evolution.ratingAxisLabel'), angle: -90, position: 'insideLeft', style: { fontSize: '8px', fontWeight: 'bold', fill: '#1e293b' } }}
                              />
                              <Tooltip content={<SceneChartTooltip t={t} chartData={dataForSceneChart} />} />
                              <Line 
                                type="monotone" 
                                dataKey="rating" 
                                stroke="#cbd5e1" 
                                strokeWidth={3} 
                                dot={<CustomizedDot />} 
                                activeDot={{ r: 6, strokeWidth: 0 }} 
                                animationDuration={1000}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {Object.keys(sceneChartsData).length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-8">{t('evolution.noDiscomfortRatingsRecorded')}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };


  // --- Global Calculations ---
  const globalStats = useMemo(() => {
    if (rawExposureSessions.length === 0) return null;
    
    const totalVideos = rawExposureSessions.reduce((acc, s) => acc + s.completedVideoIds.length, 0);
    const allRatings = rawExposureSessions.flatMap(s => s.discomfortRatings.map(r => r.rating));
    const avgDiscomfort = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length) : 0;
    
    // Global habituation slope (average slope across sessions weighted by ratings count)
    const sessionSlopes = rawExposureSessions.map(s => {
      const ratings = s.discomfortRatings.map(r => r.rating);
      return ratings.length >= 2 ? calculateHabituationSlope(ratings) : 0;
    });
    const avgSlope = sessionSlopes.length > 0 ? (sessionSlopes.reduce((a, b) => a + b, 0) / sessionSlopes.length) : 0;
    
    return {
      totalSessions: rawExposureSessions.length,
      totalVideos,
      avgDiscomfort,
      avgSlope
    };
  }, [rawExposureSessions]);

  const globalTrendData = useMemo(() => {
    if (rawExposureSessions.length < 2) return [];
    
    // Group by session index, and average discomfort per scene category
    return rawExposureSessions.sort((a,b) => a.lastUpdated - b.lastUpdated).map((session, index) => {
      const sceneDiscomforts: Record<string, number[]> = {};
      
      session.discomfortRatings.forEach(rating => {
        const video = EXPOSURE_VIDEOS.find(v => v.id === (rating.id || (rating as any).videoId));
        if (video) {
          if (!sceneDiscomforts[video.relatedArea]) sceneDiscomforts[video.relatedArea] = [];
          sceneDiscomforts[video.relatedArea].push(rating.rating);
        }
      });
      
      const point: any = { sessionIndex: index + 1 };
      Object.keys(sceneDiscomforts).forEach(scene => {
        const avg = sceneDiscomforts[scene].reduce((a, b) => a + b, 0) / sceneDiscomforts[scene].length;
        point[scene] = parseFloat(avg.toFixed(1));
      });
      
      return point;
    });
  }, [rawExposureSessions, EXPOSURE_VIDEOS]);

  const habituationProgressData = useMemo(() => {
    if (rawExposureSessions.length === 0) return [];
    
    return rawExposureSessions.sort((a,b) => a.lastUpdated - b.lastUpdated).map((session, index) => {
      const ratings = session.discomfortRatings.map(r => r.rating);
      const startRating = ratings.length > 0 ? ratings[0] : 0;
      const endRating = ratings.length > 1 ? ratings[ratings.length - 1] : startRating;
      const reduction = Math.max(0, startRating - endRating);
      
      return {
        sessionIndex: index + 1,
        reduction: parseFloat(reduction.toFixed(1)),
        avg: parseFloat((ratings.reduce((a,b) => a+b, 0) / ratings.length || 0).toFixed(1))
      };
    });
  }, [rawExposureSessions]);

  const sceneColors: Record<string, string> = {
    landing: '#EF4444', 
    preparation: '#F59E0B',
    takeoff: '#10B981',
    inflight: '#3B82F6',
    boarding: '#6366F1',
    accidents: '#8B5CF6',
    psychoed: '#A7A596'
  };

  const GlobalTrendDot = (props: any) => {
    const { cx, cy, value } = props;
    if (value === undefined) return null;
    const ratio = value / 10;
    let fill = '#10B981';
    if (ratio >= 0.7) fill = '#EF4444';
    else if (ratio >= 0.4) fill = '#F59E0B';
    
    return (
        <circle cx={cx} cy={cy} r={3} fill={fill} strokeWidth={1} stroke="#fff" />
    );
  };

  // Intensity color helper based on scale (0-10 for discomfort, 0-45 for QPV)
  const getIntensityColor = (value: number, max: number = 10) => {
    const ratio = value / max;
    if (ratio >= 0.7) return '#EF4444'; // Red-500
    if (ratio >= 0.4) return '#F59E0B'; // Amber-500
    return '#10B981'; // Emerald-500
  };

  // Aggregated habituation per scene type
  const sceneAggregatedData = useMemo(() => {
    const data: Record<string, { ratings: number[], count: number }> = {};
    
    rawExposureSessions.forEach(session => {
        session.discomfortRatings.forEach(rating => {
            const video = EXPOSURE_VIDEOS.find(v => v.id === (rating.id || (rating as any).videoId));
            if (video) {
                if (!data[video.relatedArea]) data[video.relatedArea] = { ratings: [], count: 0 };
                data[video.relatedArea].ratings.push(rating.rating);
                data[video.relatedArea].count++;
            }
        });
    });

    return Object.keys(data).map(sceneKey => {
        const ratings = data[sceneKey].ratings;
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        const slope = calculateHabituationSlope(ratings);
        return {
            scene: sceneKey,
            name: t(sceneTranslationKeys[sceneKey as ExposureSceneKey] || sceneKey),
            avg: parseFloat(avg.toFixed(1)),
            slope,
            slopeLabel: getSlopeLabel(slope).label,
            color: getIntensityColor(avg)
        };
    }).sort((a, b) => b.avg - a.avg);
  }, [rawExposureSessions, EXPOSURE_VIDEOS, t]);

  // Individual habituation curves per scene
  const sceneEvolutionData = useMemo(() => {
     const sceneData: Record<string, { sessionIndex: number, rating: number, date: string }[]> = {};
     
     // Sort sessions by lastUpdated to ensure chronological order
     const sortedSessions = [...rawExposureSessions].sort((a, b) => 
       a.lastUpdated - b.lastUpdated
     );
     
     sortedSessions.forEach((session, sIdx) => {
        session.discomfortRatings.forEach(rating => {
            const video = EXPOSURE_VIDEOS.find(v => v.id === (rating.id || (rating as any).videoId));
            if (video) {
                if (!sceneData[video.relatedArea]) sceneData[video.relatedArea] = [];
                sceneData[video.relatedArea].push({
                    sessionIndex: sIdx + 1,
                    rating: rating.rating,
                    date: new Date(session.lastUpdated).toLocaleDateString()
                });
            }
        });
     });
     
     return sceneData;
  }, [rawExposureSessions, EXPOSURE_VIDEOS]);

  const hasEnoughDataForTrends = rawExposureSessions.length >= 2;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageTitle title={t('evolution.pageTitle')} />
      
      {!hasEnoughDataForTrends && (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-dashed border-gray-200 text-center mb-8">
              <div className="w-20 h-20 bg-blue-50 text-uib-blue rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <h2 className="text-xl font-bold text-uib-black mb-2">{t('evolution.needMoreDataTitle')}</h2>
              <p className="text-gray-500 max-w-md mx-auto">{t('evolution.needMoreDataDesc', { count: 2 })}</p>
          </div>
      )}

      {/* Clinical Progress - MOVE TO TOP */}
      {rawQpviiHistory.length >= 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <SectionCard title={t('evolution.qpviiEvolutionChartTitle')}>
                <div className="h-80">
                    <QpviiEvolutionChart
                        data={consolidatedQpviiData}
                        lines={qpviiLineConfigs}
                    />
                </div>
            </SectionCard>

            <SectionCard title={t('evolution.prePostComparisonTitle')}>
                {rciData && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                           <div className="h-32 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={consolidatedQpviiData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="dateLabel" tick={{fontSize: 10}} />
                                        <YAxis tick={{fontSize: 10}} label={{ value: t('evolution.ratingAxisLabel'), angle: -90, position: 'insideLeft', style: { fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' } }} />
                                        <Tooltip />
                                        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                            {consolidatedQpviiData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getIntensityColor(Number(entry.total), 45)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                           </div>
                           <div className="ml-6 flex-shrink-0 text-center">
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">{t('evolution.differenceLabel')}</p>
                                <p className="text-3xl font-black text-uib-red">-{rciData.improvement}</p>
                                <p className="text-xs font-bold text-green-600">({rciData.improvementPercent}%)</p>
                           </div>
                        </div>

                        <div className={`p-4 rounded-lg border flex items-center ${rciData.isSignificant ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${rciData.isSignificant ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                <span className="font-black text-lg">{rciData.value.toFixed(1)}</span>
                            </div>
                            <div className="flex-grow">
                                <h4 className="font-bold text-uib-black flex items-center uppercase tracking-wide text-xs">
                                    {t('evolution.rciTitle')}
                                    {rciData.isSignificant && (
                                        <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-[10px] rounded-full font-black">SIG.</span>
                                    )}
                                </h4>
                                <p className="text-xs text-gray-700 mt-1 font-medium leading-relaxed">{t('evolution.rciExplanation')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </SectionCard>
        </div>
      ) : (
          <div className="mb-10 p-10 bg-white rounded-3xl shadow-sm border border-gray-100 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500 italic max-w-md mx-auto leading-relaxed">
                  {t('evolution.noHistoryForChart', { count: 2 })}
              </p>
          </div>
      )}

      {/* Habituation Dashboard */}
      <div className="mt-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-uib-black mb-2">{t('evolution.habituationExplanationTitle')}</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{t('evolution.habituationExplanationText')}</p>
        </div>

        {hasEnoughDataForTrends && globalStats && (
        <>
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('evolution.totalSessions')}</span>
                  <span className="text-3xl font-black text-uib-blue">{globalStats.totalSessions}</span>
               </div>
               <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('evolution.totalVideos')}</span>
                  <span className="text-3xl font-black text-uib-blue">{globalStats.totalVideos}</span>
               </div>
               <div className="bg-gradient-to-br from-uib-blue to-blue-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-2 block">{t('evolution.globalHabituation')}</span>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-4xl font-black">{Math.min(10, Math.max(0, Math.abs(globalStats.avgSlope) * 10)).toFixed(1)}/10</span>
                        <span className="text-[10px] text-blue-100 font-bold uppercase mt-1">{t('evolution.habituationStrength')}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20`}>
                            {getSlopeLabel(globalStats.avgSlope).label}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] leading-tight text-blue-50 font-medium opacity-90 border-t border-white/10 pt-3">
                      {t('evolution.habituationStrengthExplanation')}
                    </p>
                  </div>
                  {/* Decorative background element */}
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
               </div>
            </div>
          </div>

          <div className="mb-12">
              <h3 className="text-sm font-bold text-uib-black uppercase tracking-widest mb-6 px-2 flex items-center">
                  <span className="w-8 h-px bg-uib-blue mr-3"></span>
                  {t('evolution.detailedHabitutationTitle')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Object.entries(sceneEvolutionData).map(([sceneKey, data]) => (
                      <div key={sceneKey} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-72">
                          <h4 className="text-center text-xs font-black text-uib-black uppercase tracking-tighter mb-6">
                              {t('evolution.sceneHabituationChartTitle', { sceneName: t(sceneTranslationKeys[sceneKey as ExposureSceneKey] as any || sceneKey) })}
                          </h4>
                          <div className="flex-grow">
                              <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={data} margin={{ top: 5, right: 20, left: -25, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                      <XAxis 
                                          dataKey="sessionIndex" 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fontSize: 9, fill: '#94a3b8' }}
                                      />
                                      <YAxis 
                                          domain={[0, 10]} 
                                          ticks={[0, 2, 4, 6, 8, 10]} 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fontSize: 9, fill: '#94a3b8' }} 
                                      />
                                      <Tooltip 
                                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                      />
                                      <Line 
                                          type="monotone" 
                                          dataKey="rating" 
                                          stroke="#cbd5e1" 
                                          strokeWidth={3} 
                                          dot={<CustomizedDot />} 
                                          activeDot={{ r: 6, strokeWidth: 0 }} 
                                          animationDuration={1500}
                                      />
                                  </LineChart>
                              </ResponsiveContainer>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </>
        )}
      </div>

      {showSessionDebrief && (

        <SectionCard className="mb-8 bg-gray-50 border-gray-200">
            <div className="text-center">
                <p className="text-lg font-bold text-uib-black mb-3">
                    {isCurrentHierarchyCompleted ? t('evolution.sessionCompleteTitle') : t('evolution.sessionPausedTitle')}
                </p>
                <p className="text-sm text-uib-darkGray mb-4">
                    {isCurrentHierarchyCompleted ? t('evolution.sessionCompleteText') : t('evolution.sessionPausedText')}
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center flex-wrap gap-4 mt-6">
                    {isCurrentHierarchyCompleted ? (
                        <>
                            <button
                                onClick={handleReEvaluate}
                                className="w-full sm:w-auto py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue transition-colors uppercase"
                            >
                                {t('evolution.reEvaluateButton')}
                            </button>
                            <button
                                onClick={handleReviewScenes}
                                className="w-full sm:w-auto py-2.5 px-6 border border-uib-black text-uib-black rounded-md shadow-sm text-sm font-bold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-black transition-colors uppercase"
                            >
                                {t('evolution.reviewScenesButton')}
                            </button>
                        </>
                    ) : (
                         <button
                            onClick={handleResumeSession}
                            className="w-full sm:w-auto py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-uib-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-black transition-colors uppercase"
                         >
                            {t('evolution.resumeSessionButton')}
                        </button>
                    )}
                    <button
                        onClick={handleGoToHome}
                        className="w-full sm:w-auto py-2.5 px-6 border border-gray-400 text-gray-700 rounded-md shadow-sm text-sm font-bold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors uppercase"
                    >
                        {t('evolution.goToHomeButton')}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto py-2.5 px-6 border border-red-300 text-red-700 rounded-md shadow-sm text-sm font-bold hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition-colors uppercase"
                    >
                        {t('evolution.logoutButton')}
                    </button>
                </div>
            </div>
        </SectionCard>
      )}

      {showProgramCompleteCard && (
        <SectionCard className="mb-8 bg-gray-50 border-l-4 border-uib-blue">
            <div className="text-center">
                <p className="text-lg font-bold text-uib-blue mb-3">
                    {t('celebration.congratulations', { username: currentUser.username })}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                    {t('evolution.programCompleteSuccessMessage')}
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                        onClick={handleFinishProgram}
                        className="w-full sm:w-auto py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue transition-colors uppercase"
                    >
                        {t('evolution.finishProgramButton')}
                    </button>
                    <button
                        onClick={handleReviewScenes}
                        className="w-full sm:w-auto py-2.5 px-6 border border-uib-black text-uib-black rounded-md shadow-sm text-sm font-bold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-black transition-colors uppercase"
                    >
                        {t('evolution.reviewScenesButton')}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto py-2.5 px-6 border border-gray-400 text-gray-700 rounded-md shadow-sm text-sm font-bold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors uppercase"
                    >
                        {t('evolution.logoutButton')}
                    </button>
                </div>
            </div>
        </SectionCard>
      )}

      <SectionCard title={t('evolution.exposureTitle')}>
        {filteredExposureSessions.length === 0 ? ( 
          <p className="text-gray-600 p-4 text-center">{t('evolution.noExposureData')}</p>
        ) : (
          <div className="space-y-6">
            {filteredExposureSessions.map(progress => (
              <SessionDetailCardInternal key={`${progress.qpviiTimestamp || 0}-${progress.lastUpdated}`} progress={progress} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};