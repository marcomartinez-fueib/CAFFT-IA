
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { SectionCard } from '../../components/SectionCard';
import { 
    Patient,
    QPVIIUserResult, 
    UserExposureProgress, 
    EvolutionChartDataPoint, 
    QpviiLineConfig, 
    ExposureSceneKey,
    SceneDiscomfortChartDataPoint,
    ExposureVideo,
    SimulatedEmail,
    Recommendation,
    AnalyzedSession,
    QPVIIScores,
    AiConsultation
} from '../../types';
import { 
    findUserById, 
    getQPVIIResultsForUser, 
    getAllUserExposureProgress, 
    getSimulatedEmailsForPatient, 
    getAiConsultationsForPatient,
    saveSimulatedEmail,
    toggleUserNotifications,
    toggleUserOnboarding
} from '../../utils/localStorageDB';
import { NotificationService } from '../../services/notificationService';
import { calculateQPVIIScores } from '../../utils/qpviiScoring';
import { determineVideoSequence, calculatePhaseScores, isExposureFullyCompleted } from '../../utils/exposureUtils';
import { QpviiEvolutionChart } from '../../components/QpviiEvolutionChart';
import { ExpandableText } from '../../components/ExpandableText';
import { SessionDetailCard } from '../../components/therapist/SessionDetailCard';
import { EXPOSURE_VIDEOS, AVERAGE_VIDEO_DURATION_SECONDS } from '../../constants';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Cell, Legend 
} from 'recharts';
import { 
    CheckCircleIcon, 
    AlertTriangleIcon, 
    BellIcon, 
    EyeIcon, 
    SendIcon, 
    AtSignIcon, 
    ClockIcon, 
    CalendarIcon,
    CompassIcon,
    BotIcon as Bot
} from 'lucide-react';
import { generateClinicalRecommendations, calculateLinearRegressionSlope, getPatientStatus } from '../../utils/clinicalAnalysis';

// UIB Colors
const uibRed = "#BA0C2F";
const uibBlack = "#333333";
const uibWarmGray = "#A7A596";
const uibMidGray = "#7F7F7F";
const uibBlue = "#005596"; 

// Optimized: Defined outside to prevent recreation
const getQpviiLineConfigs = (t: (key: string) => string): QpviiLineConfig[] => [
    { dataKey: 'total', name: t('evolution.totalScoreEvolution'), color: uibRed },
    { dataKey: 'malestarGeneral', name: t('evolution.malestarGeneralEvolution'), color: uibBlack },
    { dataKey: 'subPreparatius', name: t('evolution.subPreparatiusEvolution'), color: uibWarmGray },
    { dataKey: 'subVicari', name: t('evolution.subVicariEvolution'), color: uibMidGray },
    { dataKey: 'subVol', name: t('evolution.subVolEvolution'), color: uibBlue }, 
];

// --- Icons for Recommendations ---
const RecommendationIcon: React.FC<{type: Recommendation['type']}> = ({ type }) => {
    const baseClass = "w-6 h-6 mr-4 flex-shrink-0 mt-1";
    if (type === 'warning') return <AlertTriangleIcon className={`${baseClass} text-amber-500`} />;
    if (type === 'success') return <CheckCircleIcon className={`${baseClass} text-green-500`} />;
    return <EyeIcon className={`${baseClass} text-sky-500`} />;
};

const ClinicalRecommendationItem: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    const { t } = useLanguage();
    const message = t(recommendation.messageKey, recommendation.messageParams);
    
    const typeStyles = {
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-sky-50 border-sky-200 text-sky-800',
        success: 'bg-green-50 border-green-200 text-green-800',
    };

    return (
        <div className={`flex items-start p-4 rounded-md border ${typeStyles[recommendation.type]}`}>
            <RecommendationIcon type={recommendation.type} />
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
};

const formatSeconds = (totalSeconds: number, t: (key: string) => string): string => {
    if (totalSeconds < 60) return `0 ${t('common.time.minutes')}`;
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 60) {
        return `${minutes} ${t('common.time.minutes')}`;
    }
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hr`;
};

export const PatientDetailPage: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { currentUser } = useAuth();
    
    const [patient, setPatient] = useState<Patient | null>(null);
    const [qpviiHistory, setQpviiHistory] = useState<QPVIIUserResult[]>([]);
    const [exposureSessions, setExposureSessions] = useState<UserExposureProgress[]>([]);
    const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
    const [aiConsultations, setAiConsultations] = useState<AiConsultation[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
    const [sendingPush, setSendingPush] = useState(false);

    const getLocaleForDate = () => {
        switch(language) {
            case 'ca': return 'ca-ES';
            case 'es': return 'es-ES';
            case 'en': return 'en-US';
            default: return 'en-US';
        }
    };

    useEffect(() => {
        if (!patientId || !currentUser) {
            navigate('/therapist/dashboard');
            return;
        }
        const user = findUserById(patientId);
        if (!user || user.role !== 'patient') {
            console.error(`Patient with ID ${patientId} not found or is not a patient.`);
            navigate(currentUser.role === 'manager' ? '/manager/dashboard' : '/therapist/dashboard');
            return;
        }

        // Security check: If therapist, must be their patient. If manager, must be their therapist's patient.
        if (currentUser.role === 'therapist' && user.therapistId !== currentUser.id) {
            navigate('/therapist/dashboard');
            return;
        }
        if (currentUser.role === 'manager') {
            const therapist = findUserById(user.therapistId || '');
            if (!therapist || therapist.managerId !== currentUser.id) {
                navigate('/manager/dashboard');
                return;
            }
        }

        const qpvii = getQPVIIResultsForUser(patientId);
        setQpviiHistory(qpvii);
        const progress = getAllUserExposureProgress().filter(p => p.userId === patientId);
        setExposureSessions(progress);
        
        const fullPatient: Patient = {
            ...(user as Patient),
            status: getPatientStatus(patientId, qpvii, progress).status
        };
        setPatient(fullPatient);
        const emails = getSimulatedEmailsForPatient(patientId);
        setSimulatedEmails(emails);
        const consultations = getAiConsultationsForPatient(patientId);
        setAiConsultations(consultations);
        const recs = generateClinicalRecommendations(patientId, t);
        setRecommendations(recs);
        setLoading(false);
    }, [patientId, navigate, t]);

    const { analyzedSessions, totalExposureForAllSessions, totalUniqueDays, totalSequencesBySession } = useMemo(() => {
        const uniqueDays = new Set<string>();
        const sessions = exposureSessions
            .map(session => {
                const ratings = session.discomfortRatings || [];
                const ratingCount = ratings.length;
                
                // Detect abandonment in this session
                // If last rating is > 6 and there was some previous reduction followed by stop, or just stop at high
                const hasAbandonment = ratings.length >= 3 && ratings[ratings.length - 1].rating > 6;
                
                const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
                const avgRating = ratingCount > 0 ? totalRating / ratingCount : null;
                const totalTimeSeconds = ratingCount * AVERAGE_VIDEO_DURATION_SECONDS;
                
                const sessionDate = new Date(session.lastUpdated);
                uniqueDays.add(sessionDate.toDateString());

                const pointsForSlope = ratings.map((r, i) => ({ x: i + 1, y: r.rating }));
                const habituationSlope = calculateLinearRegressionSlope(pointsForSlope);
                const qpviiRecord = qpviiHistory.find(q => q.timestamp === session.qpviiTimestamp);

                // Check if hierarchy was completed in this session
                const sequence = determineVideoSequence(qpviiRecord?.answers || []);
                const isCompleted = isExposureFullyCompleted(session, sequence);

                return {
                    timestamp: session.qpviiTimestamp || session.lastUpdated,
                    // FIX: Use lastUpdated for the session display date
                    date: new Date(session.lastUpdated),
                    isReview: session.isReview || false,
                    ratingCount,
                    avgRating,
                    habituationSlope,
                    totalTimeSeconds,
                    hasAbandonment,
                    isCompleted,
                    ratings: (session.discomfortRatings || [])
                        .sort((a, b) => a.videoTimestamp - b.videoTimestamp)
                        .map(r => ({
                            videoId: r.id,
                            rating: r.rating,
                            videoTitle: t(EXPOSURE_VIDEOS.find(v => v.id === r.id)?.titleKey || 'general.unknown'),
                            timestamp: r.videoTimestamp
                        }))
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp);
        
        const totalTime = sessions.reduce((acc, curr) => acc + curr.totalTimeSeconds, 0);
        const seqPerSession = sessions.length > 0 ? (sessions.reduce((acc, curr) => acc + curr.ratingCount, 0) / sessions.length).toFixed(1) : 0;

        return { 
            analyzedSessions: sessions, 
            totalExposureForAllSessions: totalTime, 
            totalUniqueDays: uniqueDays.size,
            totalSequencesBySession: seqPerSession
        };
    }, [exposureSessions, qpviiHistory, t]);

    const chartData: EvolutionChartDataPoint[] = useMemo(() => {
        const sortedHistory = [...qpviiHistory].sort((a, b) => a.timestamp - b.timestamp);
        if (sortedHistory.length < 1) return [];
        if (sortedHistory.length === 1) {
            const singleResult = sortedHistory[0];
            return [{
                dateLabel: t('evolution.preTreatment'),
                total: singleResult.scores.total, malestarGeneral: singleResult.scores.malestarGeneral, subPreparatius: singleResult.scores.subPreparatius, subVicari: singleResult.scores.subVicari, subVol: singleResult.scores.subVol,
            }];
        }
        const pre = sortedHistory[0];
        const post = sortedHistory[sortedHistory.length - 1];
        return [
            { dateLabel: t('evolution.preTreatment'), total: pre.scores.total, malestarGeneral: pre.scores.malestarGeneral, subPreparatius: pre.scores.subPreparatius, subVicari: pre.scores.subVicari, subVol: pre.scores.subVol },
            { dateLabel: t('evolution.postTreatment'), total: post.scores.total, malestarGeneral: post.scores.malestarGeneral, subPreparatius: post.scores.subPreparatius, subVicari: post.scores.subVicari, subVol: post.scores.subVol }
        ];
    }, [qpviiHistory, t]);
    
    const lineConfigs = useMemo(() => getQpviiLineConfigs(t), [t]);

    const latestQpvii = useMemo(() => {
        if (qpviiHistory.length === 0) return null;
        const latest = [...qpviiHistory].sort((a, b) => b.timestamp - a.timestamp)[0];
        return {
            ...latest,
            scores: calculateQPVIIScores(latest.answers)
        };
    }, [qpviiHistory]);

    const rciValue = useMemo(() => {
        if (qpviiHistory.length < 2) return null;
        const sorted = [...qpviiHistory].sort((a, b) => a.timestamp - b.timestamp);
        const first = calculateQPVIIScores(sorted[0].answers).total;
        const last = calculateQPVIIScores(sorted[sorted.length - 1].answers).total;
        const sDiff = 17.6; // Updated based on QPV-II psychometric studies (SD ≈ 50, Sdiff ≈ 17.6)
        return (first - last) / sDiff;
    }, [qpviiHistory]);

    const handleSendPush = async () => {
        if (!patient || !patient.notificationPreferences?.enabled) return;
        
        setSendingPush(true);
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        NotificationService.sendNotification(
            t('profile.notificationTypes.general'),
            t('aiChat.reminder.webappMessage', { username: patient.username, days: 0 })
        );
        
        // Log it as an email too for history? Maybe a separate log in future, but for now just show success
        alert(t('therapistDashboard.reminders.reminderSentSuccess'));
        setSendingPush(false);
    };

    const handleToggleNotifications = () => {
        if (patientId && toggleUserNotifications(patientId)) {
            const user = findUserById(patientId);
            if (user) setPatient({ ...patient, ...user } as Patient);
        }
    };

    const handleToggleOnboarding = () => {
        if (patientId && toggleUserOnboarding(patientId)) {
            const user = findUserById(patientId);
            if (user) setPatient({ ...patient, ...user } as Patient);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">{t('auth.loading')}</div>;
    }
    if (!patient) {
        return <div className="p-8 text-center">{t('patientDetail.patientNotFound')}</div>;
    }
    
    return (
        <div>
            <Breadcrumbs items={[
                { 
                    label: currentUser?.role === 'manager' ? t('nav.managerDashboard') : t('nav.therapistDashboard'), 
                    path: currentUser?.role === 'manager' ? '/manager/dashboard' : '/therapist/dashboard' 
                },
                { label: `${patient.username}${patient.patientCode ? ` (${patient.patientCode})` : ''}` }
            ]} />
            <PageTitle title={t('patientDetail.pageTitle', { username: `${patient.username}${patient.patientCode ? ` [${patient.patientCode}]` : ''}` })} />

            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        patient.status.color === 'gray' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        patient.status.color === 'blue' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        patient.status.color === 'sky' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        patient.status.color === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        patient.status.color === 'red' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-uib-blue/10 text-uib-blue border-uib-blue/20'
                    }`}>
                        {t(`therapistDashboard.patient_status.${patient.status.textKey || 'in_progress'}`)}
                    </span>
                    {analyzedSessions.some(s => s.hasAbandonment) && (
                        <div className="flex items-center px-4 py-1.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse border border-rose-700">
                             <AlertTriangleIcon className="w-4 h-4 mr-2" />
                            {t('therapistDashboard.reminders.abandonmentRisk')}
                        </div>
                    )}
                </div>
                
                <div className="h-6 w-[1px] bg-slate-100 hidden md:block"></div>
                
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('therapistDashboard.table.name')}</p>
                        {patient.patientCode && <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase font-black">{patient.patientCode}</span>}
                    </div>
                    <p className="text-xs font-bold text-slate-600 leading-none truncate max-w-[200px]">{patient.email}</p>
                </div>

                <div className="md:ml-auto flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleToggleNotifications}
                            className={`p-2 rounded-xl border transition-all ${patient.notificationPreferences?.enabled !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50'}`}
                            title={patient.notificationPreferences?.enabled !== false ? t('therapistDashboard.tooltips.toggleNotificationsOff') : t('therapistDashboard.tooltips.toggleNotificationsOn')}
                        >
                            <BellIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={handleToggleOnboarding}
                            className={`p-2 rounded-xl border transition-all ${patient.onboardingEnabled !== false ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50'}`}
                            title={patient.onboardingEnabled !== false ? t('therapistDashboard.tooltips.toggleTourOff') : t('therapistDashboard.tooltips.toggleTourOn')}
                        >
                            <CompassIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                    
                    <button 
                        onClick={handleSendPush}
                        disabled={sendingPush || !patient.notificationPreferences?.enabled}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-uib-blue text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-uib-blue/90 disabled:opacity-50 transition-all shadow-md group whitespace-nowrap"
                    >
                        <BellIcon className={`w-4 h-4 shrink-0 ${sendingPush ? 'animate-bounce' : 'group-hover:rotate-12 transition-transform'}`} />
                        <span>{sendingPush ? t('auth.loading') : t('therapistDashboard.reminders.sendReminderButton')}</span>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <SectionCard title={t('patientDetail.currentPlanTitle')}>
                        {latestQpvii ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('therapistDashboard.table.last_active')}</p>
                                        <p className="text-sm font-bold text-slate-700">{totalUniqueDays} {t(`common.time.day${totalUniqueDays !== 1 ? 's' : ''}`)}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('therapistDashboard.table.sessions')}</p>
                                        <p className="text-sm font-bold text-slate-700">{analyzedSessions.length}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('patientDetail.videosViewed')}</p>
                                        <p className="text-sm font-bold text-slate-700">{totalSequencesBySession} seq/sess</p>
                                    </div>
                                    {lineConfigs.slice(0, 2).map(line => (
                                        <div key={line.dataKey} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{line.name}</p>
                                            <p className="text-sm font-bold text-slate-700">{(latestQpvii.scores as any)[line.dataKey]}</p>
                                        </div>
                                    ))}
                                </div>

                                {rciValue !== null && (
                                    <div className={`mb-6 p-4 rounded-lg border flex items-center ${Math.abs(rciValue) >= 1.96 ? 'bg-green-50 border-green-200' : 'bg-sky-50 border-sky-200'}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${Math.abs(rciValue) >= 1.96 ? 'bg-green-600 text-white' : 'bg-sky-600 text-white'}`}>
                                            <span className="font-black text-lg">{rciValue.toFixed(1)}</span>
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-uib-black flex items-center uppercase tracking-wide text-xs">
                                                {t('evolution.rciTitle')}
                                                {Math.abs(rciValue) >= 1.96 && (
                                                    <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-[10px] rounded-full font-black">SIG.</span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-gray-700 mt-1 font-medium leading-relaxed">{t('evolution.rciExplanation')}</p>
                                            {qpviiHistory.length >= 2 && (
                                                <p className="text-[10px] text-gray-500 mt-2 font-mono bg-white inline-block px-2 py-0.5 rounded border border-gray-100">
                                                    {t('evolution.rciMathInfo', { 
                                                        pre: calculateQPVIIScores(qpviiHistory.sort((a,b)=>a.timestamp-b.timestamp)[0].answers).total.toFixed(1),
                                                        post: calculateQPVIIScores(qpviiHistory.sort((a,b)=>a.timestamp-b.timestamp)[qpviiHistory.length-1].answers).total.toFixed(1)
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 font-medium mb-4">{t('patientDetail.basedOnEvaluation', { date: new Date(latestQpvii.date + 'T00:00:00').toLocaleDateString(getLocaleForDate()) })}</p>
                                
                                <h4 className="font-bold text-uib-black mb-3 uppercase tracking-widest text-xs">{t('patientDetail.hierarchyTitle')}</h4>
                                <div className="space-y-1.5">
                                    {(() => {
                                        const phaseScores = calculatePhaseScores(latestQpvii.answers);
                                        const allCompletedVideoIds = new Set<string>();
                                        exposureSessions.forEach(p => {
                                            if (p.completedVideoIds) {
                                                p.completedVideoIds.forEach(id => allCompletedVideoIds.add(id));
                                            }
                                        });

                                        return determineVideoSequence(latestQpvii.answers).map((video, idx) => {
                                            const scoreValue = phaseScores[video.relatedArea] || 0;
                                            const isCompleted = allCompletedVideoIds.has(video.id);

                                            return (
                                                <div key={video.id} className={`flex items-center text-sm p-3 rounded-lg border transition-all ${isCompleted ? 'bg-emerald-50 border-emerald-100 opacity-80' : 'bg-slate-50 border-slate-100'}`}>
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-black mr-3 flex-shrink-0 ${isCompleted ? 'bg-emerald-500 text-white shadow-sm' : 'bg-uib-blue text-white'}`}>
                                                        {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : idx + 1}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className={`font-bold ${isCompleted ? 'text-emerald-800' : 'text-slate-700'}`}>{t(video.titleKey)}</p>
                                                        {isCompleted && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{t('patientDetail.habituatedLabel')}</span>}
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className={`px-2 py-0.5 rounded-md font-black text-[10px] whitespace-nowrap shadow-sm border ${isCompleted ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-sky-100 text-sky-800 border-sky-200'}`}>
                                                            {scoreValue.toFixed(2)} / 9
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500">{t('patientDetail.noEvaluationsFound')}</p>
                        )}
                    </SectionCard>
                    
                    <SectionCard title={t('patientDetail.sessionDetailsTitle')}>
                        <div className="flex justify-between items-baseline mb-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('patientDetail.totalExposure_time')}</h3>
                            <p className="text-3xl font-black text-uib-red">{formatSeconds(totalExposureForAllSessions, t)}</p>
                        </div>

                        {analyzedSessions.length > 0 && (
                            <div className="mb-8 overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('patientDetail.sessionDate')}</th>
                                            <th className="text-center py-3 px-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('therapistDashboard.table.sessions')}</th>
                                            <th className="text-center py-3 px-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('patientDetail.avgDiscomfort')}</th>
                                            <th className="text-right py-3 px-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t('patientDetail.habituationSlope')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {analyzedSessions.map(session => (
                                            <tr key={session.timestamp} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-2.5 px-4 font-bold text-slate-700">{session.date.toLocaleDateString(getLocaleForDate(), { month: 'short', day: 'numeric' })}</td>
                                                <td className="py-2.5 px-4 text-center font-mono text-slate-500">{session.ratingCount}</td>
                                                <td className="py-2.5 px-4 text-center font-bold text-slate-700">{session.avgRating?.toFixed(1) || '-'}</td>
                                                <td className={`py-2.5 px-4 text-right font-bold ${session.habituationSlope && session.habituationSlope < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {session.habituationSlope?.toFixed(2) || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {analyzedSessions.length > 0 ? (
                            <div className="space-y-6">
                                {analyzedSessions.map(session => (
                                    <SessionDetailCard key={session.timestamp} session={session} t={t} locale={getLocaleForDate()} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-center py-8 font-medium italic">{t('patientDetail.noExposureSessions')}</p>
                        )}
                    </SectionCard>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    <SectionCard title={t('patientDetail.recommendationsTitle')}>
                        <div className="space-y-3">
                            {recommendations.map(rec => <ClinicalRecommendationItem key={rec.id} recommendation={rec} />)}
                        </div>
                    </SectionCard>

                    <SectionCard title={t('patientDetail.qpviiHistoryTitle')}>
                        {chartData.length > 0 ? (
                            <div className="h-64">
                                <QpviiEvolutionChart data={chartData} lines={lineConfigs} />
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">{t('evolution.noHistoryForChart', {count: 1})}</p>
                        )}
                    </SectionCard>

                    <SectionCard title={t('patientDetail.communicationsTitle')}>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{t('patientDetail.emailLogTitle')}</h4>
                                {simulatedEmails.length > 0 ? (
                                    <ul className="space-y-2">
                                        {simulatedEmails.map(email => (
                                            <li key={email.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{t(`patientDetail.emailType.${email.type}`)}</p>
                                                    <p className="text-xs text-gray-500">{new Date(email.timestamp).toLocaleDateString(getLocaleForDate())}</p>
                                                </div>
                                                <button onClick={() => setSelectedEmail(email)} className="text-sm text-uib-red font-bold hover:underline uppercase tracking-wide">{t('patientDetail.viewEmailButton')}</button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-center py-4">{t('patientDetail.noEmailsSent')}</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('patientDetail.aiConsultationsTitleForPatient')}</h4>
                                {aiConsultations.length > 0 ? (
                                    <div className="space-y-3">
                                        {aiConsultations.slice(0, 5).map(consultation => (
                                            <div key={consultation.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-[10px] font-bold text-uib-blue truncate pr-2">{consultation.query}</p>
                                                    <span className="text-[8px] text-slate-400 whitespace-nowrap">{new Date(consultation.timestamp).toLocaleDateString(getLocaleForDate())}</span>
                                                </div>
                                                <div className="text-xs text-slate-600 italic">
                                                    <ExpandableText text={consultation.response} maxLength={80} />
                                                </div>
                                            </div>
                                        ))}
                                        {aiConsultations.length > 5 && (
                                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">{t('therapistDashboard.moreConsultations', { count: aiConsultations.length - 5 })}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-center py-4 text-xs italic">{t('patientDetail.noAiConsultationsForPatient')}</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('profile.notificationsSectionTitle')}</h4>
                                {patient.notificationPreferences?.enabled ? (
                                    <button 
                                        onClick={handleSendPush}
                                        disabled={sendingPush}
                                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition-colors disabled:bg-indigo-300 flex items-center justify-center gap-2"
                                    >
                                        {sendingPush ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                                        {t('therapistDashboard.reminders.sendReminderButton')}
                                    </button>
                                ) : (
                                    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 italic text-slate-400 text-xs text-center w-full">
                                        {NotificationService.getPermissionStatus() === 'denied' ? t('profile.consentWithdrawn') : t('patientDetail.notificationsNotEnabled')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>

            {selectedEmail && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col h-auto max-h-[95vh] overflow-y-auto">
                        <div className="sm:hidden flex justify-center pb-4">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">{t('patientDetail.emailModalTitle')}</h3>
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-8 overflow-y-auto scrollbar-hide shadow-inner">
                            <div className="mb-4 pb-4 border-b border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject</p>
                                <p className="text-sm font-bold text-slate-800">{selectedEmail.subject}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Message</p>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{selectedEmail.body}</p>
                            </div>
                        </div>
                        <div className="flex justify-end pb-8 sm:pb-0">
                            <button 
                                onClick={() => setSelectedEmail(null)} 
                                className="w-full sm:w-auto px-10 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all uppercase text-xs tracking-widest font-black shadow-lg"
                            >
                                {t('patientDetail.closeButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};