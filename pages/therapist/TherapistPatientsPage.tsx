
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Patient, StoredUser, QPVIIUserResult, UserExposureProgress, PatientStatus, QPVIIScores } from '../../types';
import { 
    getUsers,
    getAllQPVIIResults,
    getAllUserExposureProgress,
    saveUser, 
    deletePatientData, 
    resetPatientPassword, 
    toggleUserNotifications,
    toggleUserOnboarding,
    generatePatientCode
} from '../../utils/localStorageDB';
import { calculateQPVIIScores } from '../../utils/qpviiScoring';
import { determineVideoSequence } from '../../utils/exposureUtils';
import { getPatientStatus } from '../../utils/clinicalAnalysis';
import { AVERAGE_VIDEO_DURATION_SECONDS } from '../../constants';
import { hashPassword } from '../../utils/hash';

// --- Icons ---
const ViewIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.418-6.313a1.012 1.012 0 0 1 1.634 0l1.832 2.614a.5.5 0 0 0 .822 0l1.832-2.614a1.012 1.012 0 0 1 1.634 0l4.418 6.313a1.012 1.012 0 0 1 0 .639l-4.418 6.313a1.012 1.012 0 0 1-1.634 0l-1.832-2.614a.5.5 0 0 0-.822 0l-1.832-2.614a1.012 1.012 0 0 1-1.634 0l-4.418-6.313Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
const ResetIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>;
const DeleteIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
const AddUserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.375 19.5h17.25a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 20.625 4.5H3.375A2.25 2.25 0 0 0 1.125 6.75v10.5A2.25 2.25 0 0 0 3.375 19.5Z" /></svg>;
const CompassIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>;

const PatientStatusBadge: React.FC<{ status: PatientStatus, t: (key: string) => string }> = ({ status, t }) => {
    const colors = {
        gray: 'bg-slate-100 text-slate-600 border-slate-200',
        blue: 'bg-sky-50 text-sky-700 border-sky-200',
        sky: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        green: 'bg-uib-red/5 text-uib-red border-uib-red/20',
        red: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
        <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-black uppercase tracking-wider rounded-full border ${colors[status.color]}`}>
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

export const TherapistPatientsPage: React.FC = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [allData, setAllData] = useState<{users: StoredUser[], qpvii: QPVIIUserResult[], progress: UserExposureProgress[]}>({users: [], qpvii: [], progress: []});
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [patientToProcess, setPatientToProcess] = useState<Patient | StoredUser | null>(null);
    const [newPatientData, setNewPatientData] = useState({ username: '', email: '', password: '' });
    const [newPassword, setNewPassword] = useState('');
    const [passwordCopied, setPasswordCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAllData = useCallback(() => {
        if (currentUser) {
            setAllData({
                users: getUsers(),
                qpvii: getAllQPVIIResults(),
                progress: getAllUserExposureProgress()
            });
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData, location]);

    const enrichedPatients = useMemo(() => {
        if (!currentUser) return [];
        let patients = allData.users.filter(u => u.role === 'patient');

        if (currentUser.role === 'therapist') {
            patients = patients.filter(u => u.therapistId === currentUser.id);
        } else if (currentUser.role === 'manager') {
            // Managers see patients from all their therapists
            const myTherapists = allData.users.filter(u => u.role === 'therapist' && u.managerId === currentUser.id);
            const myTherapistIds = myTherapists.map(t => t.id);
            patients = patients.filter(u => myTherapistIds.includes(u.therapistId || ''));
        }

        return patients.map(p => {
            const patientProgress = allData.progress.filter(prog => prog.userId === p.id).sort((a, b) => b.lastUpdated - a.lastUpdated);
            const lastActivity = patientProgress.length > 0 ? patientProgress[0].lastUpdated : null;
            
            const totalRatings = patientProgress.reduce((acc, curr) => acc + (curr.discomfortRatings?.length || 0), 0);
            const effectiveExposureSeconds = totalRatings * AVERAGE_VIDEO_DURATION_SECONDS;

            const isInactive = lastActivity !== null && (Date.now() - lastActivity) > (5 * 24 * 60 * 60 * 1000);
            const daysInactive = lastActivity !== null ? Math.floor((Date.now() - lastActivity) / (24 * 60 * 60 * 1000)) : 0;

            const patientQpvii = allData.qpvii.filter(r => r.userId === p.id).sort((a,b)=>b.timestamp - a.timestamp);
            const latestScores = patientQpvii.length > 0 ? calculateQPVIIScores(patientQpvii[0].answers) : null;
            
            const { status } = getPatientStatus(p.id, allData.qpvii, allData.progress);
            
            let rci: number | null = null;
            const patientQpviiChron = [...patientQpvii].reverse();
            if (patientQpviiChron.length >= 2) {
                const first = calculateQPVIIScores(patientQpviiChron[0].answers).total;
                const last = calculateQPVIIScores(patientQpviiChron[patientQpviiChron.length - 1].answers).total;
                const sDiff = 17.6; 
                rci = (first - last) / sDiff;
            }

            return {
                ...p,
                status,
                lastActivityDate: lastActivity,
                effectiveExposureSeconds,
                latestScores,
                rci,
                isInactive,
                daysInactive
            };
        }).filter(p => 
            p.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allData, currentUser, searchTerm]);

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
            setAddModalOpen(false);
        } catch (e) {
            setError(t('auth.registrationFailedError'));
        }
    };

    const handleOpenDeleteModal = (patient: any) => {
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
    
    const handleOpenResetModal = async (patient: any) => {
        setPatientToProcess(patient);
        const tempPassword = await resetPatientPassword(patient.id);
        if (tempPassword) {
            setNewPassword(tempPassword);
            setPasswordCopied(false);
            setResetModalOpen(true);
        }
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(newPassword);
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
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

    return (
        <div>
            <Breadcrumbs items={[
                { 
                    label: currentUser?.role === 'manager' ? t('nav.managerDashboard') : t('nav.therapistDashboard'), 
                    path: currentUser?.role === 'manager' ? '/manager/dashboard' : '/therapist/dashboard' 
                },
                { label: t('nav.patients') }
            ]} />
            <PageTitle title={t('nav.patients')} />

            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder={t('therapistDashboard.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm shadow-sm"
                    />
                    <div className="absolute top-0 left-0 inline-flex items-center p-2.5 h-full">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <button 
                    onClick={handleOpenAddModal} 
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-sky-600 text-white rounded-xl shadow-lg hover:bg-sky-700 transition-all text-sm font-bold uppercase tracking-wider"
                >
                    <AddUserIcon className="w-5 h-5 mr-2" /> {t('therapistDashboard.addPatientButton')}
                </button>
            </div>

            {/* Patients List (Reuse Table from Dashboard) */}
            <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.name')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.qpvii_latest')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.rci')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.progress')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.last_active')}</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.notifications')}</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.onboarding_tour')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {enrichedPatients.length > 0 ? (
                                enrichedPatients.map(patient => (
                                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${
                                                    patient.status.color === 'gray' ? 'bg-gray-400' :
                                                    patient.status.color === 'blue' ? 'bg-blue-500' :
                                                    patient.status.color === 'sky' ? 'bg-sky-500' :
                                                    patient.status.color === 'amber' ? 'bg-amber-500' :
                                                    patient.status.color === 'red' ? 'bg-red-500' :
                                                    'bg-green-500'
                                                }`}></div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-bold text-slate-900">{patient.username}</span>
                                                        {patient.patientCode && <span className="ml-2 text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">{patient.patientCode}</span>}
                                                    </div>
                                                    <span className="text-xs text-slate-500">{patient.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {patient.latestScores ? (
                                                <span className="text-sm font-black text-slate-700">{patient.latestScores.total}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {patient.rci !== null ? (
                                                <div className="flex items-center space-x-2">
                                                    <span className={`text-sm font-bold ${patient.rci >= 1.96 ? 'text-emerald-600' : patient.rci <= -1.96 ? 'text-uib-red' : 'text-slate-600'}`}>
                                                        {patient.rci.toFixed(2)}
                                                    </span>
                                                    {patient.rci >= 1.96 && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded border border-emerald-100 italic">{t('therapistDashboard.table.significant_rci')}</span>}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-24 bg-slate-100 rounded-full h-1.5">
                                                <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${patient.status.progressPercent}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                                            {timeAgo(patient.lastActivityDate, t)}
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <button onClick={() => navigate(`/therapist/patient/${patient.id}`)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"><ViewIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleOpenResetModal(patient)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><ResetIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleOpenDeleteModal(patient)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><DeleteIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        {t('therapistDashboard.noPatients')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100 flex flex-col h-auto max-h-[95vh] overflow-y-auto">
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
                            <button onClick={() => setAddModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest font-black leading-none">{t('therapistDashboard.addPatientModal.cancelButton')}</button>
                            <button onClick={handleAddPatient} className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all uppercase text-xs tracking-widest font-black shadow-lg shadow-sky-200 leading-none">{t('therapistDashboard.addPatientModal.createButton')}</button>
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
                            <button onClick={() => setDeleteModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest font-black leading-none">{t('therapistDashboard.deletePatientModal.cancelButton')}</button>
                            <button onClick={handleDeletePatient} className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all uppercase text-xs tracking-widest font-black shadow-lg shadow-rose-200 leading-none">{t('therapistDashboard.deletePatientModal.deleteButton')}</button>
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
                        <p className="text-slate-600 mb-4 font-medium">{t('therapistDashboard.resetPasswordModal.newPasswordIs')}</p>
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl font-black text-sky-700 tracking-wider mb-8 shadow-inner">{newPassword}</div>
                        <div className="flex gap-3 pb-8 sm:pb-0">
                            <button onClick={() => setResetModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors uppercase text-xs tracking-widest font-black leading-none">{t('therapistDashboard.resetPasswordModal.closeButton')}</button>
                            <button onClick={handleCopyPassword} className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-all uppercase text-xs tracking-widest font-black shadow-lg shadow-sky-200 leading-none">{passwordCopied ? t('therapistDashboard.resetPasswordModal.copiedButton') : t('therapistDashboard.resetPasswordModal.copyButton')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
