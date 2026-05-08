
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { StoredUser } from '../../types';
import { 
    getUsers,
    getTherapistsForManager,
    saveUser,
    toggleUserNotifications,
    toggleUserOnboarding
} from '../../utils/localStorageDB';
import { hashPassword } from '../../utils/hash';

// Icons
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253 9.527 9.527 0 0 0-1.25-1.25A9.37 9.37 0 0 0 19.5 9.372a9.337 9.337 0 0 0-2.253-4.121m-4.5 1.25a9.37 9.37 0 0 1-1.25-1.25A9.337 9.337 0 0 1 9.372 19.5a9.37 9.37 0 0 1-1.25-1.25m-1.25-1.25a9.37 9.37 0 0 0-1.25-1.25A9.337 9.337 0 0 0 4.5 9.372a9.37 9.37 0 0 0-1.25 1.25m3.5-6.128a9.37 9.37 0 0 1 1.25-1.25A9.337 9.337 0 0 1 9.372 4.5a9.37 9.37 0 0 1 1.25 1.25m7.5 0a9.37 9.37 0 0 0 1.25-1.25A9.337 9.337 0 0 0 19.5 4.5a9.37 9.37 0 0 0 1.25 1.25M4.5 19.5a9.37 9.37 0 0 1 1.25-1.25A9.337 9.337 0 0 1 9.372 15a9.37 9.37 0 0 1 1.25 1.25m-4.5 0a9.37 9.37 0 0 0 1.25-1.25A9.337 9.337 0 0 0 4.5 15a9.37 9.37 0 0 0-1.25 1.25m6.75-3.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" /></svg>;
const AddUserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.375 19.5h17.25a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 20.625 4.5H3.375A2.25 2.25 0 0 0 1.125 6.75v10.5A2.25 2.25 0 0 0 3.375 19.5Z" /></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
const MapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4`}>
        <div className={`${color} p-3 rounded-xl text-white`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
    </div>
);

export const ManagerDashboardPage: React.FC = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
    const [therapists, setTherapists] = useState<StoredUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddTherapistModalOpen, setAddTherapistModalOpen] = useState(false);
    const [newTherapistData, setNewTherapistData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        if (currentUser) {
            const users = getUsers();
            setAllUsers(users);
            setTherapists(getTherapistsForManager(currentUser.id));
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        const patientCount = allUsers.filter(u => u.role === 'patient' && therapists.some(t => t.id === u.therapistId)).length;
        return { therapists: therapists.length, patients: patientCount };
    }, [allUsers, therapists]);

    const handleAddTherapist = async () => {
        if (!currentUser) return;
        if (!newTherapistData.username || !newTherapistData.email || !newTherapistData.password) {
            setError(t('auth.fillAllFieldsError'));
            return;
        }
        setError(null);
        try {
            const hashedPassword = await hashPassword(newTherapistData.password);
            const newTherapist: StoredUser = {
                id: crypto.randomUUID(),
                username: newTherapistData.username,
                email: newTherapistData.email,
                hashedPassword,
                consentGiven: true,
                role: 'therapist',
                managerId: currentUser.id
            };
            const success = saveUser(newTherapist);
            if (!success) {
                setError(t('auth.usernameTakenError'));
                return;
            }
            fetchData();
            setAddTherapistModalOpen(false);
            setNewTherapistData({ username: '', email: '', password: '' });
        } catch (e) {
            setError(t('auth.registrationFailedError'));
        }
    };

    const handleToggleNotifications = (userId: string) => {
        if (toggleUserNotifications(userId)) {
            fetchData();
        }
    };

    const handleToggleOnboarding = (userId: string) => {
        if (toggleUserOnboarding(userId)) {
            fetchData();
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Breadcrumbs items={[{ label: t('nav.managerDashboard') }]} />
            <PageTitle title={t('nav.managerDashboard')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard title={t('nav.therapists')} value={stats.therapists} icon={<UsersIcon className="w-6 h-6"/>} color="bg-blue-500" />
                <StatCard title={t('nav.patients')} value={stats.patients} icon={<UsersIcon className="w-6 h-6"/>} color="bg-emerald-500" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('nav.therapists')}</h3>
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            placeholder={t('therapistDashboard.search')}
                            className="px-4 py-2 text-sm rounded-xl border border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={() => setAddTherapistModalOpen(true)}
                            className="bg-sky-500 text-white px-4 py-2 rounded-xl flex items-center space-x-2 font-bold"
                        >
                            <AddUserIcon className="w-4 h-4" />
                            <span>{t('managerDashboard.addTherapistButton')}</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('managerDashboard.table.therapist')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('nav.patients')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('therapistDashboard.table.last_active')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('superadminDashboard.table.settings')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('superadminDashboard.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {therapists.filter(th => !searchTerm || th.username.toLowerCase().includes(searchTerm.toLowerCase())).map(th => {
                                const patientCount = allUsers.filter(u => u.role === 'patient' && u.therapistId === th.id).length;
                                return (
                                    <tr key={th.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{th.username}</td>
                                        <td className="px-6 py-4 text-sm text-slate-700">{patientCount}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{t('general.none')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleToggleNotifications(th.id)}
                                                    className={`p-1.5 rounded-lg border transition-all ${th.notificationPreferences?.enabled !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                                                    title={th.notificationPreferences?.enabled !== false ? t('therapistDashboard.tooltips.toggleNotificationsOff') : t('therapistDashboard.tooltips.toggleNotificationsOn')}
                                                >
                                                    <BellIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleOnboarding(th.id)}
                                                    className={`p-1.5 rounded-lg border transition-all ${th.onboardingEnabled !== false ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                                                    title={th.onboardingEnabled !== false ? t('therapistDashboard.tooltips.toggleTourOff') : t('therapistDashboard.tooltips.toggleTourOn')}
                                                >
                                                    <MapIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-sky-600 hover:underline font-bold text-sm">{t('managerDashboard.table.viewPatients')}</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

             {/* Add Therapist Modal */}
             {isAddTherapistModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-900">{t('managerDashboard.addNewTherapistTitle')}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl">{error}</div>}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.username')}</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200"
                                    value={newTherapistData.username}
                                    onChange={e => setNewTherapistData({...newTherapistData, username: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.email')}</label>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200"
                                    value={newTherapistData.email}
                                    onChange={e => setNewTherapistData({...newTherapistData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.password')}</label>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200"
                                    value={newTherapistData.password}
                                    onChange={e => setNewTherapistData({...newTherapistData, password: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end space-x-2">
                            <button onClick={() => setAddTherapistModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500">{t('nav.cancel')}</button>
                            <button onClick={handleAddTherapist} className="px-6 py-2 bg-sky-500 text-white rounded-xl text-sm font-black uppercase tracking-widest">{t('nav.save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
