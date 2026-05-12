

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Patient, StoredUser, SimulatedEmail, QPVIIUserResult, UserExposureProgress, PatientStatus, TranslationContent, QPVIIScores } from '../../types';
import { 
    getUsers,
    getQPVIIResultsForUser, 
    getAllQPVIIResults,
    getAllUserExposureProgress,
    saveUser, 
    deletePatientData, 
    resetPatientPassword, 
    saveSimulatedEmail,
    toggleUserNotifications,
    getAiConsultationsByUserIds,
    toggleUserOnboarding,
    generatePatientCode,
    getDaysSinceLastActivity,
    sendAdherenceRemindersToAllInactive
} from '../../utils/localStorageDB';
import { calculateQPVIIScores } from '../../utils/qpviiScoring';
import { hashPassword } from '../../utils/hash';
import { exportDataToCSV } from '../../utils/export';
import { determineVideoSequence, isExposureFullyCompleted } from '../../utils/exposureUtils';
import { getPatientStatus } from '../../utils/clinicalAnalysis';
import { AVERAGE_VIDEO_DURATION_SECONDS } from '../../constants';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip as RechartsTooltip, 
    BarChart, 
    Bar, 
    XAxis as RechartsXAxis, 
    YAxis as RechartsYAxis,
    CartesianGrid,
    Legend
} from 'recharts';


// --- Icons ---
import { 
    Users as UsersIcon, 
    PieChart as ActivityIcon, 
    CheckCircle2 as CheckBadgeIcon, 
    BarChart3 as ChartBarIcon, 
    UserPlus as AddUserIcon, 
    FolderOutput as ExportIcon, 
    Eye as ViewIcon, 
    Key as ResetIcon, 
    Trash2 as DeleteIcon, 
    Clock as ClockIcon, 
    Bell as BellIcon, 
    Send as SendIcon, 
    Navigation as CompassIcon,
    PlayCircle,
    Activity,
    FileSearch,
    PauseCircle,
    AlertCircle,
    UserMinus,
    MessageSquare,
    Bot
} from 'lucide-react';


// --- Local Components ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3 md:space-x-4 transition-all hover:shadow-md hover:-translate-y-0.5`}>
        <div className={`${color} p-2 md:p-3 rounded-xl text-white shadow-sm shrink-0`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1 truncate">{title}</p>
            <p className="text-xl md:text-2xl font-black text-slate-900 leading-none truncate">{value}</p>
        </div>
    </div>
);

const PatientStatusBadge: React.FC<{ status: PatientStatus, t: (key: string) => string }> = ({ status, t }) => {
    const config = {
        new: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <AddUserIcon className="w-3 h-3 mr-1" /> },
        ready: { color: 'bg-sky-50 text-sky-700 border-sky-200', icon: <PlayCircle className="w-3 h-3 mr-1" /> },
        in_progress: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Activity className="w-3 h-3 mr-1" /> },
        needs_review: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <FileSearch className="w-3 h-3 mr-1" /> },
        completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckBadgeIcon className="w-3 h-3 mr-1" /> },
        stalled: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: <PauseCircle className="w-3 h-3 mr-1" /> },
        dropping_out: { color: 'bg-red-50 text-red-700 border-red-200', icon: <UserMinus className="w-3 h-3 mr-1" /> },
    };

    const currentConfig = config[status.textKey] || config.new;

    return (
        <span className={`px-2.5 py-0.5 inline-flex items-center text-[10px] leading-5 font-black uppercase tracking-wider rounded-full border ${currentConfig.color}`}>
            {currentConfig.icon}
            {t(`therapistDashboard.patient_status.${status.textKey}`)}
        </span>
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


import { useOnboarding } from '../../hooks/useOnboarding';

export const TherapistDashboardPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { startTour, hasCompletedTour, checkTourStatus } = useOnboarding();

  const [allData, setAllData] = useState<{
    users: StoredUser[], 
    qpvii: QPVIIUserResult[], 
    progress: UserExposureProgress[],
    consultations: any[]
  }>({
    users: [], 
    qpvii: [], 
    progress: [],
    consultations: []
  });
  
  useEffect(() => {
    // Auto start tour for therapists if not completed and not already auto-started
    if (currentUser && currentUser.role === 'therapist') {
      const autoStartKey = `cafft_onboarding_autostart_done_${currentUser.id}`;
      if (localStorage.getItem(autoStartKey) === 'true') return;

      const completed = checkTourStatus(currentUser.id, 'therapist');
      if (!completed) {
        localStorage.setItem(autoStartKey, 'true');
        startTour('therapist', currentUser.id);
      }
    }
  }, [currentUser, startTour, checkTourStatus]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setResetModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

  const [patientToProcess, setPatientToProcess] = useState<Patient | StoredUser | null>(null);
  const [newPatientData, setNewPatientData] = useState({ username: '', email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [anonymizeExport, setAnonymizeExport] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [invitationContent, setInvitationContent] = useState<{subject: string, body: string} | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const fetchAllData = useCallback(() => {
    if (currentUser) {
        const patients = getUsers().filter(u => u.role === 'patient');
        const patientIds = patients.map(p => p.id);
        
        setAllData({
            users: getUsers(),
            qpvii: getAllQPVIIResults(),
            progress: getAllUserExposureProgress(),
            consultations: getAiConsultationsByUserIds(patientIds)
        });
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, location]);

  const { dashboardStats, phaseDistribution, activityData, patientsWithStats } = useMemo(() => {
    const defaultData = { 
        dashboardStats: { totalPatients: 0, activeSessions: 0, completedPrograms: 0, completionRate: '0', avgImprovement: 'N/A', avgExposureTime: 'N/A', totalSessions: 0, highRiskCount: 0, inactiveCount: 0 }, 
        phaseDistribution: [],
        activityData: [],
        patientsWithStats: []
    };

    if (!currentUser) return defaultData;

    const patients = allData.users.filter(u => u.role === 'patient' && u.therapistId === currentUser.id);

    const getPatientStatsInternal = (patientId: string) => {
        const patientProgressItems = allData.progress.filter(progressItem => progressItem.userId === patientId);
        const totalRatings = patientProgressItems.reduce((acc, curr) => acc + (curr.discomfortRatings?.length || 0), 0);
        const effectiveExposureSeconds = totalRatings * AVERAGE_VIDEO_DURATION_SECONDS;

        const { status } = getPatientStatus(patientId, allData.qpvii, allData.progress);
        return { status, effectiveExposureSeconds, patientProgressItems };
    };

    // --- Calculate KPI Stats ---
    let totalSessions = 0;
    let highRiskCount = 0;
    let inactiveCount = 0;
    const activeSessionsSet = new Set<string>();
    const completedProgramsSet = new Set<string>();
    
    allData.progress.forEach(p => {
        totalSessions += (p.discomfortRatings?.length || 0);
        if (p.programCompleted) {
            completedProgramsSet.add(p.userId);
        } else {
            activeSessionsSet.add(p.userId);
        }
    });

    const improvementScores: number[] = [];
    const exposureTimes: number[] = [];
    const phases: Record<string, number> = { new: 0, ready: 0, in_progress: 0, stalled: 0, dropping_out: 0, needs_review: 0, completed: 0 };
    const dailyActivityData: Record<string, { started: number, completed: number, evaluations: number }> = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        dailyActivityData[dateStr] = { started: 0, completed: 0, evaluations: 0 };
    }

    // Process QPVII activity
    allData.qpvii.forEach(q => {
        const date = new Date(q.timestamp);
        const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        if (dailyActivityData.hasOwnProperty(dateStr)) {
            dailyActivityData[dateStr].evaluations += 1;
        }
    });

    // Process all sessions and evaluations
    allData.progress.forEach(progressEntry => {
        // Track sessions started (we use lastUpdated for individual entries in this context if they correspond to an activity day)
        // or more specifically, if they have ratings.
        if (progressEntry.discomfortRatings && progressEntry.discomfortRatings.length > 0) {
            // Get unique days where ratings happened in this session
            const activeDays = new Set<string>();
            progressEntry.discomfortRatings.forEach(r => {
                const d = new Date(r.videoTimestamp);
                activeDays.add(d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }));
            });
            
            activeDays.forEach(dateStr => {
                if (dailyActivityData.hasOwnProperty(dateStr)) {
                    dailyActivityData[dateStr].started += 1;
                }
            });
        }

        if (progressEntry.programCompleted) {
            const date = new Date(progressEntry.lastUpdated);
            const dateStr = date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
            if (dailyActivityData.hasOwnProperty(dateStr)) {
                dailyActivityData[dateStr].completed += 1;
            }
        }
    });

    patients.forEach(p => {
        const patientQpvii = allData.qpvii.filter(q => q.userId === p.id).sort((a,b) => a.timestamp - b.timestamp);
        if (patientQpvii.length >= 2) {
            const first = calculateQPVIIScores(patientQpvii[0].answers).total;
            const last = calculateQPVIIScores(patientQpvii[patientQpvii.length - 1].answers).total;
            improvementScores.push(first - last);
        }

        const statsInternal = getPatientStatsInternal(p.id);

        if (statsInternal.status.textKey === 'stalled' || statsInternal.status.textKey === 'dropping_out' || statsInternal.status.textKey === 'needs_review') {
            highRiskCount++;
        }

        const daysInactive = getDaysSinceLastActivity(p.id);
            
        if (daysInactive !== null && daysInactive >= 3) { // Using 3 days for general "inactive" stat
            inactiveCount++;
        }

        if (statsInternal.effectiveExposureSeconds > 0) {
            exposureTimes.push(statsInternal.effectiveExposureSeconds);
        }

        if (phases.hasOwnProperty(statsInternal.status.textKey)) {
            phases[statsInternal.status.textKey as keyof typeof phases]++;
        }
    });

    const avgImprovement = improvementScores.length > 0 ? (improvementScores.reduce((a,b) => a+b, 0) / improvementScores.length).toFixed(1) : 'N/A';
    const totalExposureTimeCalc = exposureTimes.reduce((a, b) => a + b, 0);
    const avgExposureTime = exposureTimes.length > 0 ? formatSeconds(totalExposureTimeCalc / exposureTimes.length, t) : t('common.time.none');

    const stats = {
        totalPatients: patients.length,
        activeSessions: activeSessionsSet.size,
        completedPrograms: completedProgramsSet.size,
        completionRate: patients.length > 0 ? ((completedProgramsSet.size / patients.length) * 100).toFixed(1) : '0',
        avgImprovement,
        avgExposureTime,
        totalSessions,
        highRiskCount,
        inactiveCount
    };

    const phaseChartData = [
        { name: t('therapistDashboard.patient_status.new'), value: phases.new, color: '#94a3b8' },
        { name: t('therapistDashboard.patient_status.ready'), value: phases.ready, color: '#3b82f6' },
        { name: t('therapistDashboard.patient_status.in_progress'), value: phases.in_progress, color: '#0ea5e9' },
        { name: t('therapistDashboard.patient_status.stalled'), value: phases.stalled, color: '#f59e0b' },
        { name: t('therapistDashboard.patient_status.dropping_out'), value: phases.dropping_out, color: '#ef4444' },
        { name: t('therapistDashboard.patient_status.needs_review'), value: phases.needs_review, color: '#fbbf24' },
        { name: t('therapistDashboard.patient_status.completed'), value: phases.completed, color: '#10b981' },
    ].filter(d => d.value > 0);

    const activityChartData = Object.entries(dailyActivityData).map(([date, counts]) => ({
        date,
        ...counts
    }));

    const patientsWithStats = patients.map(p => {
        const { status, effectiveExposureSeconds } = getPatientStatsInternal(p.id);
        const patientQpvii = allData.qpvii.filter(q => q.userId === p.id).sort((a,b) => b.timestamp - a.timestamp);
        const patientProgress = allData.progress.filter(prog => prog.userId === p.id).sort((a, b) => b.lastUpdated - a.lastUpdated);
        
        return {
            ...p,
            status,
            exposureTime: effectiveExposureSeconds,
            lastActive: patientProgress.length > 0 ? patientProgress[0].lastUpdated : null,
            latestQpvii: patientQpvii.length > 0 ? calculateQPVIIScores(patientQpvii[0].answers).total : null,
            sessionsCount: patientProgress.reduce((acc, curr) => acc + ((curr.discomfortRatings?.length || 0) > 0 ? 1 : 0), 0)
        };
    }).sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

    return { 
        dashboardStats: stats, 
        phaseDistribution: phaseChartData,
        activityData: activityChartData,
        patientsWithStats
    };
    
  }, [allData, currentUser, t]);

  const criticalPatients = useMemo(() => {
    return dashboardStats ? patientsWithStats.filter(p => 
        p.status.textKey === 'stalled' || 
        p.status.textKey === 'dropping_out' || 
        p.status.textKey === 'needs_review' ||
        (getDaysSinceLastActivity(p.id) !== null && (getDaysSinceLastActivity(p.id) || 0) >= 3)
    ) : [];
  }, [patientsWithStats, dashboardStats]);

  const handleSendAllReminders = () => {
    if (!currentUser) return;
    const count = sendAdherenceRemindersToAllInactive(
        currentUser.id,
        3, // threshold
        t('aiChat.reminder.emailSubject'),
        t('aiChat.reminder.emailBody')
    );
    
    if (count > 0) {
        alert(t('therapistDashboard.reminders.reminderSentSuccess') + ` (${count})`);
        fetchAllData();
    } else {
        alert(t('therapistDashboard.noPatients') + " " + t('nav.help')); // Or just a generic "nothing to send"
    }
  };

  
  const handleOpenAddModal = () => {
    setError(null);
    setNewPatientData({ username: '', email: '', password: '' });
    setAddModalOpen(true);
  };

  const handleAddPatient = async () => {
    if (!currentUser) return;
    if (!newPatientData.username || !newPatientData.email || !newPatientData.password) {
      setError(t('auth.fillAllFieldsError'));
      return;
    }
    setError(null);
    try {
        const hashedPassword = await hashPassword(newPatientData.password);
        const newPatient: StoredUser = {
          id: crypto.randomUUID(),
          patientCode: generatePatientCode(),
          username: newPatientData.username,
          email: newPatientData.email,
          hashedPassword,
          consentGiven: true, 
          role: 'patient',
          therapistId: currentUser.id,
        };
        const success = saveUser(newPatient);
        if (!success) {
          setError(t('auth.usernameTakenError'));
          return;
        }
        fetchAllData();
        const subject = t('therapistDashboard.inviteEmail.subject');
        const body = t('therapistDashboard.inviteEmail.body', { patientName: newPatient.username, therapistName: currentUser.username, username: newPatient.username, password: newPatientData.password });
        const invite = { subject, body };
        setInvitationContent(invite);
        saveSimulatedEmail({ id: crypto.randomUUID(), patientId: newPatient.id, type: 'invitation', subject, body, status: 'generated', timestamp: Date.now() });
        setPatientToProcess(newPatient);
        setAddModalOpen(false);
        setInviteModalOpen(true);
    } catch (e) {
        setError(t('auth.registrationFailedError'));
    }
  };

  const handleOpenDeleteModal = (patient: Patient) => {
    setPatientToProcess(patient);
    setDeleteModalOpen(true);
  };

  const handleDeletePatient = () => {
    if (patientToProcess) {
      deletePatientData(patientToProcess.id);
      fetchAllData();
      setDeleteModalOpen(false);
      setPatientToProcess(null);
    }
  };
  
  const handleOpenResetModal = async (patient: Patient) => {
    setPatientToProcess(patient);
    const tempPassword = await resetPatientPassword(patient.id);
    if (tempPassword) {
        setNewPassword(tempPassword);
        setPasswordCopied(false);
        setResetModalOpen(true);
    } else {
        alert('Failed to reset password.');
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleOpenExportModal = () => setExportModalOpen(true);

  const handleExportData = () => {
    exportDataToCSV(anonymizeExport);
    setExportModalOpen(false);
  };

  const handleSendInviteEmail = () => {
    if (patientToProcess && invitationContent) {
        const mailtoLink = `mailto:${patientToProcess.email}?subject=${encodeURIComponent(invitationContent.subject)}&body=${encodeURIComponent(invitationContent.body)}`;
        window.location.href = mailtoLink;
    }
  };

  const handleCopyInvite = () => {
    if(invitationContent){
        const fullContent = `Subject: ${invitationContent.subject}\n\n${invitationContent.body}`;
        navigator.clipboard.writeText(fullContent);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const handleSendReminder = (patient: any) => {
    if (!currentUser) return;
    
    const subject = t('aiChat.reminder.emailSubject');
    const body = t('aiChat.reminder.emailBody', { username: patient.username });
    
    saveSimulatedEmail({
        id: crypto.randomUUID(),
        patientId: patient.id,
        type: 'reminder',
        subject,
        body,
        status: 'sent',
        timestamp: Date.now()
    });

    // Update patient's last reminder date
    const updatedUser = { ...patient, lastReminderSentDate: Date.now() };
    saveUser(updatedUser as StoredUser);
    
    // Refresh data
    fetchAllData();
    
    // Simple alert for feedback
    alert(t('therapistDashboard.reminders.reminderSentSuccess'));
  };

  const handleToggleNotifications = (userId: string) => {
    if (toggleUserNotifications(userId)) {
        fetchAllData();
    }
  };

  const handleToggleOnboarding = (userId: string) => {
    if (toggleUserOnboarding(userId)) {
        fetchAllData();
    }
  };

  const timeAgo = (timestamp: number | null, t: (key: any, options?: any) => string) => {
    if (!timestamp) return t('common.time.none');
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const format = (val: number, unit: string) => t('common.time.ago', { val: Math.floor(val), unit: t(`common.time.${unit}${Math.floor(val) !== 1 ? 's' : ''}`) });

    let interval = seconds / 31536000;
    if (interval > 1) return format(interval, 'year');
    interval = seconds / 2592000;
    if (interval > 1) return format(interval, 'month');
    interval = seconds / 86400;
    if (interval > 1) return format(interval, 'day');
    interval = seconds / 3600;
    if (interval > 1) return format(interval, 'hour');
    interval = seconds / 60;
    if (interval > 1) return format(interval, 'minute');
    return format(seconds, 'second');
  };

  return (
    <>
      <Breadcrumbs items={[{ label: t('nav.therapistDashboard') }]} />
      <div id="onboarding-welcome" className="flex justify-between items-center mb-2">
          <PageTitle title={t('therapistDashboard.pageTitle')} />
          <button 
              id="tour-help-button"
              onClick={() => startTour('therapist', undefined, true)}
              className="text-xs font-bold text-uib-blue hover:underline cursor-pointer flex items-center bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100"
          >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t('onboarding.startManual')}
          </button>
      </div>
      
      <div id="therapist-stats" className="space-y-6 mb-10">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <ActivityIcon className="w-4 h-4 mr-2" />
            {t('therapistDashboard.kpi.title_overview')}
        </h2>
        
        {/* Main Hero KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-slate-800 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-slate-800 p-2 rounded-lg text-white">
                        <UsersIcon className="w-5 h-5"/>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-1">{t('therapistDashboard.kpi.total_patients')}</p>
                <p className="text-3xl font-black text-slate-900">{dashboardStats.totalPatients}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-blue-500 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-blue-500 p-2 rounded-lg text-white">
                        <ActivityIcon className="w-5 h-5"/>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-1">{t('therapistDashboard.kpi.active_sessions')}</p>
                <p className="text-3xl font-black text-slate-900">{dashboardStats.activeSessions}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-500 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-emerald-500 p-2 rounded-lg text-white">
                        <CheckBadgeIcon className="w-5 h-5"/>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{dashboardStats.completionRate}% {t('therapistDashboard.kpi.sessions_rate')}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-1">{t('therapistDashboard.kpi.completed_programs')}</p>
                <p className="text-3xl font-black text-slate-900">{dashboardStats.completedPrograms}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-uib-red transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-uib-red p-2 rounded-lg text-white">
                        <ChartBarIcon className="w-5 h-5"/>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-1">{t('therapistDashboard.kpi.avg_improvement')}</p>
                <p className="text-3xl font-black text-slate-900">{dashboardStats.avgImprovement}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-sky-500 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-sky-500 p-2 rounded-lg text-white">
                        <ClockIcon className="w-5 h-5"/>
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-500 mb-1">{t('therapistDashboard.kpi.avg_exposure_time')}</p>
                <p className="text-3xl font-black text-slate-900 truncate">{dashboardStats.avgExposureTime}</p>
            </div>
        </div>

        {/* Secondary Info Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title={t('therapistDashboard.kpi.total_sessions')} value={dashboardStats.totalSessions} icon={<ClockIcon className="w-5 h-5"/>} color="bg-indigo-500" />
            <StatCard title={t('therapistDashboard.kpi.high_risk')} value={dashboardStats.highRiskCount} icon={<BellIcon className="w-5 h-5"/>} color="bg-rose-500" />
            <StatCard title={t('therapistDashboard.kpi.inactive_patients')} value={dashboardStats.inactiveCount} icon={<UsersIcon className="w-5 h-5"/>} color="bg-amber-500" />
        </div>
      </div>

      {criticalPatients.length > 0 && (
        <div className="mb-8">
            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center">
                <BellIcon className="w-4 h-4 mr-2" />
                {t('therapistDashboard.criticalAlertsTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criticalPatients.map(patient => (
                    <div key={patient.id} className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start justify-between">
                        <div>
                            <p className="font-bold text-slate-900">
                                {patient.username}
                                {patient.patientCode && <span className="ml-2 text-[10px] font-mono bg-white/50 px-1.5 py-0.5 rounded text-slate-500">{patient.patientCode}</span>}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                                <PatientStatusBadge status={patient.status} t={t} />
                                {patient.lastActive && (Date.now() - patient.lastActive) > (3 * 24 * 60 * 60 * 1000) && (
                                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">
                                        {t('therapistDashboard.patient_status.inactive_badge', { days: Math.floor((Date.now() - patient.lastActive) / (24 * 60 * 60 * 1000)) })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => navigate(`/therapist/patient/${patient.id}`)}
                                className="p-2 bg-white text-slate-600 hover:text-sky-600 rounded-lg shadow-sm border border-slate-200 transition-colors"
                                title={t('therapistDashboard.actionOptions.viewDetails')}
                            >
                                <ViewIcon className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleSendReminder(patient)}
                                className="p-2 bg-white text-slate-600 hover:text-emerald-600 rounded-lg shadow-sm border border-slate-200 transition-colors"
                                title={t('therapistDashboard.table.remind')}
                            >
                                <SendIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Phase Distribution Chart */}
        <div id="phase-distribution" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{t('therapistDashboard.charts.phaseDistribution')}</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={phaseDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {phaseDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center">
                {phaseDistribution.map((entry: any) => (
                    <div key={entry.name} className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entry.name} ({entry.value})</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Recent Activity Chart */}
        <div id="recent-activity" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 lg:col-span-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{t('therapistDashboard.charts.dailyActivity')}</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <RechartsXAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <RechartsYAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            allowDecimals={false}
                        />
                        <RechartsTooltip 
                            cursor={{ fill: '#f8fafc', radius: 4 }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle"
                            wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px' }}
                        />
                        <Bar 
                            dataKey="started" 
                            name={t('therapistDashboard.charts.sessionsStarted')} 
                            fill="#3b82f6" 
                            radius={[4, 4, 0, 0]} 
                            barSize={12}
                        />
                        <Bar 
                            dataKey="completed" 
                            name={t('therapistDashboard.charts.sessionsCompleted')} 
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]} 
                            barSize={12}
                        />
                        <Bar 
                            dataKey="evaluations" 
                            name={t('therapistDashboard.charts.evaluations')} 
                            fill="#E2001A" 
                            radius={[4, 4, 0, 0]} 
                            barSize={12}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Patient Table (Consolidated) */}
      <div id="patient-table" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.myPatientsTitle')}</h3>
              <div className="flex w-full sm:w-auto space-x-2">
                  <div className="relative flex-grow">
                      <input 
                        type="text" 
                        placeholder={t('therapistDashboard.search')} 
                        className="w-full pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <button 
                    onClick={handleSendAllReminders}
                    className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
                    title={t('therapistDashboard.reminders.sendReminderButton')}
                  >
                        <BellIcon className="w-5 h-5"/>
                  </button>
                  <button id="add-patient-btn" onClick={handleOpenAddModal} className="p-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors shadow-sm">
                      <AddUserIcon className="w-5 h-5"/>
                  </button>
                  <button onClick={handleOpenExportModal} className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors shadow-sm">
                      <ExportIcon className="w-5 h-5"/>
                  </button>
              </div>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left min-w-[1000px]">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.name')}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.status')}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.qpvii_latest')}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.exposure_time')}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.last_active')}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('therapistDashboard.table.notifications')}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('therapistDashboard.table.onboarding_tour')}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('therapistDashboard.table.actions')}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {patientsWithStats.filter(p => !searchTerm || p.username.toLowerCase().includes(searchTerm.toLowerCase())).map(patient => (
                          <tr key={patient.id} className="hover:bg-slate-50/30 transition-colors group">
                              <td className="px-6 py-4">
                                  <div 
                                    className="font-bold text-slate-900 cursor-pointer hover:text-sky-600 flex items-center"
                                    onClick={() => navigate(`/therapist/patient/${patient.id}`)}
                                  >
                                      {patient.username}
                                      {patient.patientCode && <span className="ml-2 text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors uppercase">{patient.patientCode}</span>}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{patient.email}</div>
                                  {getDaysSinceLastActivity(patient.id) !== null && (getDaysSinceLastActivity(patient.id) || 0) >= 3 && (
                                       <span className="mt-1 inline-block text-[8px] font-black bg-amber-100 px-1.5 py-0.5 rounded text-amber-700 uppercase tracking-widest">
                                           {t('therapistDashboard.reminders.inactivityBadge', { days: getDaysSinceLastActivity(patient.id) })}
                                       </span>
                                   )}
                              </td>
                              <td className="px-6 py-4">
                                  <PatientStatusBadge status={patient.status} t={t} />
                              </td>
                              <td className="px-6 py-4">
                                  <span className="font-bold text-slate-700">{patient.latestQpvii || '-'}</span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                      <span className="font-bold text-slate-700">{formatSeconds(patient.exposureTime, t)}</span>
                                      <span className="text-[10px] text-slate-400">{patient.sessionsCount} {patient.sessionsCount === 1 ? t('common.time.session') : t('common.time.sessions')}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                  {timeAgo(patient.lastActive, t)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <button
                                      onClick={() => handleToggleNotifications(patient.id)}
                                      className={`p-2 rounded-lg transition-all border ${patient.notificationPreferences?.enabled !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-50'}`}
                                      title={patient.notificationPreferences?.enabled !== false ? t('therapistDashboard.tooltips.toggleNotificationsOff') : t('therapistDashboard.tooltips.toggleNotificationsOn')}
                                  >
                                      <BellIcon className="w-5 h-5 mx-auto" />
                                  </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <button
                                      onClick={() => handleToggleOnboarding(patient.id)}
                                      className={`p-2 rounded-lg transition-all border ${patient.onboardingEnabled !== false ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-50'}`}
                                      title={patient.onboardingEnabled !== false ? t('therapistDashboard.tooltips.toggleTourOff') : t('therapistDashboard.tooltips.toggleTourOn')}
                                  >
                                      <CompassIcon className="w-5 h-5 mx-auto" />
                                  </button>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end space-x-1">
                                      <button 
                                        onClick={() => navigate(`/therapist/patient/${patient.id}`)} 
                                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"
                                        title={t('therapistDashboard.actionOptions.viewDetails')}
                                      >
                                          <ViewIcon className="w-5 h-5"/>
                                      </button>
                                      <button 
                                        onClick={() => handleOpenResetModal(patient as any)} 
                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                                        title={t('therapistDashboard.actionOptions.resetPassword')}
                                      >
                                          <ResetIcon className="w-5 h-5"/>
                                      </button>
                                      <button 
                                        onClick={() => handleOpenDeleteModal(patient as any)} 
                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                        title={t('therapistDashboard.actionOptions.delete')}
                                      >
                                          <DeleteIcon className="w-5 h-5"/>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {patientsWithStats.length === 0 && (
                          <tr>
                              <td colSpan={6} className="px-6 py-20 text-center">
                                  <div className="flex flex-col items-center">
                                      <UsersIcon className="w-12 h-12 text-slate-200 mb-4" />
                                      <p className="text-slate-500 font-bold">{t('therapistDashboard.noPatients')}</p>
                                  </div>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* AI Consultations Log */}
      <div id="ai-log" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Bot className="w-4 h-4 mr-2 text-uib-blue" />
                  {t('therapistDashboard.aiConsultationsTitle')}
              </h3>
              <button 
                  onClick={() => navigate('/chat')}
                  className="text-[10px] font-black text-uib-blue uppercase tracking-widest hover:underline flex items-center"
              >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {t('therapistDashboard.newConsultation')}
              </button>
          </div>
          <div className="p-6">
              {allData.consultations.length > 0 ? (
                  <div className="space-y-4">
                      {allData.consultations.slice(0, 5).map((consultation, idx) => (
                          <div key={consultation.id || idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                          <UsersIcon className="w-3 h-3 text-slate-500" />
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                                              {t('therapistDashboard.patientLabel')}: {consultation.userName}
                                          </p>
                                          <p className="text-[10px] font-bold text-uib-blue truncate max-w-[200px] md:max-w-md">
                                              {t('therapistDashboard.queryLabel')}: {consultation.query}
                                          </p>
                                      </div>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-4">
                                      {new Date(consultation.timestamp).toLocaleString(language === 'ca' ? 'ca-ES' : language === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-uib-blue/10 flex items-center justify-center shrink-0">
                                      <Bot className="w-3 h-3 text-uib-blue" />
                                  </div>
                                  <div className="p-3 bg-white rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed max-h-24 overflow-y-auto w-full scrollbar-hide">
                                      {consultation.response}
                                  </div>
                              </div>
                          </div>
                      ))}
                      {allData.consultations.length > 5 && (
                          <div className="pt-2 text-center">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                   {t('therapistDashboard.moreConsultations', { count: allData.consultations.length - 5 })}
                               </p>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Bot className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-medium">{t('therapistDashboard.noAiConsultations')}</p>
                  </div>
              )}
          </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 flex flex-col h-auto max-h-[90vh] overflow-y-auto">
            <div className="sm:hidden flex justify-center pb-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">{t('therapistDashboard.addPatientModal.title')}</h3>
            {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl font-medium">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('therapistDashboard.addPatientModal.usernameLabel')}</label>
                <input type="text" value={newPatientData.username} onChange={(e) => setNewPatientData({...newPatientData, username: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('therapistDashboard.addPatientModal.emailLabel')}</label>
                <input type="email" value={newPatientData.email} onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('therapistDashboard.addPatientModal.passwordLabel')}</label>
                <input type="password" value={newPatientData.password} onChange={(e) => setNewPatientData({...newPatientData, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all" />
              </div>
            </div>
            <div className="mt-8 flex gap-3 pb-8 sm:pb-0">
              <button onClick={() => setAddModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest">{t('therapistDashboard.addPatientModal.cancelButton')}</button>
              <button onClick={handleAddPatient} className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-sky-200">{t('therapistDashboard.addPatientModal.createButton')}</button>
            </div>
          </div>
        </div>
      )}

      {isInviteModalOpen && patientToProcess && invitationContent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col h-auto max-h-[90vh] overflow-y-auto">
            <div className="sm:hidden flex justify-center pb-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{t('therapistDashboard.inviteModal.title')}</h3>
            <p className="text-sm text-slate-500 mb-6">{t('therapistDashboard.inviteModal.subtitle', { username: (patientToProcess as any).username })}</p>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
               <div className="mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('therapistDashboard.inviteEmail.subject')}</p>
                  <p className="text-sm font-bold text-slate-800">{invitationContent.subject}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('therapistDashboard.inviteEmail.bodyLabel')}</p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{invitationContent.body}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8 sm:pb-0">
               <button 
                  onClick={handleCopyInvite} 
                  className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all uppercase text-xs tracking-widest border border-slate-200 ${inviteCopied ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
               >
                  {inviteCopied ? t('therapistDashboard.inviteModal.copied') : t('therapistDashboard.inviteModal.copy')}
               </button>
               <button 
                  onClick={handleSendInviteEmail} 
                  className="flex items-center justify-center px-4 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-sky-200"
               >
                  <SendIcon className="w-4 h-4 mr-2" />
                  {t('therapistDashboard.inviteModal.sendEmail')}
               </button>
               <button 
                  onClick={() => setInviteModalOpen(false)} 
                  className="sm:col-span-2 mt-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest"
               >
                  {t('therapistDashboard.inviteModal.done')}
               </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && patientToProcess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100">
            <div className="sm:hidden flex justify-center pb-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">{t('therapistDashboard.deletePatientModal.title')}</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">{t('therapistDashboard.deletePatientModal.confirmationText', { username: (patientToProcess as any).username })}</p>
            <div className="flex gap-3 pb-8 sm:pb-0">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest">{t('therapistDashboard.deletePatientModal.cancelButton')}</button>
              <button onClick={handleDeletePatient} className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-rose-200">{t('therapistDashboard.deletePatientModal.deleteButton')}</button>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && patientToProcess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 text-center">
            <div className="sm:hidden flex justify-center pb-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">{t('therapistDashboard.resetPasswordModal.title', { username: (patientToProcess as any).username })}</h3>
            <p className="text-slate-600 mb-4">{t('therapistDashboard.resetPasswordModal.newPasswordIs')}</p>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl font-black text-sky-700 tracking-wider mb-8 shadow-inner">{newPassword}</div>
            <div className="flex gap-3 pb-8 sm:pb-0">
              <button onClick={() => setResetModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest">{t('therapistDashboard.resetPasswordModal.closeButton')}</button>
              <button onClick={handleCopyPassword} className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-sky-200">{passwordCopied ? t('therapistDashboard.resetPasswordModal.copiedButton') : t('therapistDashboard.resetPasswordModal.copyButton')}</button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100">
            <div className="sm:hidden flex justify-center pb-4">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">{t('therapistDashboard.exportModal.title')}</h3>
            <div className="mb-8">
              <label className="flex items-center space-x-3 cursor-pointer group p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-200 transition-colors">
                <input 
                  type="checkbox" 
                  checked={anonymizeExport} 
                  onChange={(e) => setAnonymizeExport(e.target.checked)} 
                  className="w-5 h-5 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                />
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{t('therapistDashboard.exportModal.anonymizeLabel')}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t('therapistDashboard.exportModal.anonymizeDescription')}</span>
                </div>
              </label>
            </div>
            <div className="flex gap-3 pb-8 sm:pb-0">
              <button onClick={() => setExportModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest">{t('therapistDashboard.exportModal.cancelButton')}</button>
              <button onClick={handleExportData} className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all uppercase text-xs tracking-widest shadow-lg">{t('therapistDashboard.exportModal.exportButton')}</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};
