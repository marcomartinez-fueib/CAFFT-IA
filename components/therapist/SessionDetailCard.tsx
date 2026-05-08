
import React, { useMemo } from 'react';
import { AnalyzedSession } from '../../types';
import { SceneChartTooltip } from '../SceneChartTooltip';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
    CalendarIcon, 
    ClockIcon, 
    TrendingDownIcon, 
    TrendingUpIcon, 
    AlertTriangleIcon, 
    VideoIcon, 
    ActivityIcon,
    ChevronRightIcon
} from 'lucide-react';
import { EXPOSURE_VIDEOS, CANONICAL_FLIGHT_STAGES_ORDER } from '../../constants';

interface SessionDetailCardProps {
    session: AnalyzedSession;
    t: (key: string, params?: any) => string;
    locale: string;
}

const formatSeconds = (totalSeconds: number): string => {
    if (totalSeconds < 60) return '0 min';
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hr`;
};

// UIB Colors
const uibRed = "#BA0C2F";
const uibBlack = "#333333";

export const SessionDetailCard: React.FC<SessionDetailCardProps> = ({ session, t, locale }) => {
    const chartData = session.ratings.map((r, i) => ({
        index: i + 1,
        rating: r.rating,
        title: r.videoTitle
    }));

    const groupedRatings = useMemo(() => {
        return CANONICAL_FLIGHT_STAGES_ORDER.map(stage => {
            const ratings = session.ratings.filter(r => {
                const video = EXPOSURE_VIDEOS.find(v => v.id === r.videoId);
                return video?.relatedArea === stage;
            });
            
            // Check for abandonment: the last rating in a sequence of >2 is high
            const hasAbandonment = ratings.length >= 3 && ratings[ratings.length - 1].rating > 6;
            
            return { stage, ratings, hasAbandonment };
        }).filter(group => group.ratings.length > 0);
    }, [session.ratings]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
            <div className="flex items-center space-x-4">
                <div className="bg-uib-red/10 p-3 rounded-2xl text-uib-red">
                    <CalendarIcon className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">
                      {session.date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t('patientDetail.sessionDate')}</p>
                </div>
            </div>
            {session.isReview && (
                <span className="text-[10px] font-black px-3 py-1 bg-amber-100 text-amber-800 rounded-full uppercase tracking-widest border border-amber-200 shadow-sm flex items-center">
                    <ActivityIcon className="w-3 h-3 mr-1.5" />
                    {t('evolution.reviewSessionLabel')}
                </span>
            )}
            {session.isCompleted && (
                <span className="text-[10px] font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-widest border border-emerald-200 shadow-sm flex items-center ml-2">
                    <TrendingDownIcon className="w-3 h-3 mr-1.5" />
                    {t('therapistDashboard.table.hierarchy_completed')}
                </span>
            )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center transition-colors hover:bg-slate-100">
                <VideoIcon className="w-5 h-5 text-slate-300 mb-2" />
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('patientDetail.videosViewed')}</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{session.ratingCount}</p>
            </div>
             <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center transition-colors hover:bg-slate-100">
                <ClockIcon className="w-5 h-5 text-slate-300 mb-2" />
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('patientDetail.session_time')}</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{formatSeconds(session.totalTimeSeconds)}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center transition-colors hover:bg-slate-100">
                <ActivityIcon className="w-5 h-5 text-slate-300 mb-2" />
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('patientDetail.avgDiscomfort')}</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{session.avgRating !== null ? session.avgRating.toFixed(1) : '-'}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center transition-colors hover:bg-slate-100">
                {session.habituationSlope && session.habituationSlope < 0 ? (
                    <TrendingDownIcon className="w-5 h-5 text-emerald-400 mb-2" />
                ) : (
                    <TrendingUpIcon className="w-5 h-5 text-amber-400 mb-2" />
                )}
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{t('patientDetail.habituationSlope')}</p>
                <div className="flex items-end">
                    <p className={`text-3xl font-black leading-none ${session.habituationSlope && session.habituationSlope < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {session.habituationSlope !== null ? session.habituationSlope.toFixed(2) : '-'}
                    </p>
                </div>
            </div>
        </div>
        
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center">
          <span className="mr-3">{t('evolution.intraSessionEvolution')}</span>
          <div className="flex-grow h-[1px] bg-slate-100"></div>
        </h3>
        
        {groupedRatings.length > 0 && (
            <div className="space-y-10">
                {groupedRatings.map(group => {
                    const groupChartData = group.ratings.map((r, i) => ({
                        instance: i + 1,
                        rating: r.rating,
                        videoTitle: r.videoTitle,
                        timestamp: r.timestamp
                    }));

                    return (
                        <div key={group.stage} className={`bg-white rounded-3xl border ${group.hasAbandonment ? 'border-red-200' : 'border-slate-100'} shadow-sm overflow-hidden`}>
                            <div className={`px-6 py-4 flex justify-between items-center ${group.hasAbandonment ? 'bg-red-50 border-b border-red-100' : 'bg-slate-50 border-b border-slate-100'}`}>
                                <div>
                                  <h5 className={`text-xs font-black uppercase tracking-widest ${group.hasAbandonment ? 'text-red-800' : 'text-slate-800'}`}>
                                      {t(`evolution.scene_${group.stage}`)}
                                  </h5>
                                  {group.hasAbandonment && (
                                    <p className="text-[9px] font-black text-red-600 uppercase tracking-tighter mt-0.5">{t('patientDetail.abandonmentWarning')}</p>
                                  )}
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${group.hasAbandonment ? 'bg-white text-red-600 border-red-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                    {group.ratings.length} {t('evolution.videoAttemptsLabel')}
                                </span>
                            </div>
                            
                            <div className="p-8">
                                <div className="h-48 w-full mb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={groupChartData}>
                                            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="instance" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fontSize: 10, fill: '#cbd5e1', fontWeight: 800}}
                                                dy={10}
                                            />
                                            <YAxis 
                                                domain={[0, 10]} 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{fontSize: 10, fill: '#cbd5e1', fontWeight: 800}}
                                                width={25}
                                            />
                                            <RechartsTooltip 
                                                content={<SceneChartTooltip t={t} chartData={groupChartData as any} />}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="rating" 
                                                stroke={group.hasAbandonment ? '#ef4444' : uibRed} 
                                                strokeWidth={4} 
                                                dot={{ fill: group.hasAbandonment ? '#ef4444' : uibRed, r: 4, strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                                animationDuration={1500}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-slate-50">
                                    <table className="min-w-full text-xs">
                                        <thead>
                                          <tr className="bg-slate-50">
                                            <th className="py-2.5 px-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('patientDetail.sequenceBreakdown')}</th>
                                            <th className="py-2.5 px-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('patientDetail.rating')}</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {group.ratings.map((rating, index) => (
                                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3 px-4 text-slate-600 font-bold">{rating.videoTitle}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className={`inline-block px-3 py-1 rounded-full font-black text-[11px] shadow-sm ${
                                                            rating.rating >= 7 ? 'bg-red-50 text-red-600' :
                                                            rating.rating >= 4 ? 'bg-amber-50 text-amber-600' :
                                                            'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                            {rating.rating}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
