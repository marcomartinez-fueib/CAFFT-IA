
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { StoredUser, Language } from '../../types';
import { 
    getUsers, 
    saveUser, 
    deletePatientData,
    toggleUserNotifications,
    toggleUserOnboarding
} from '../../utils/localStorageDB';
import { hashPassword } from '../../utils/hash';

// --- Icons ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253 9.527 9.527 0 0 0-1.25-1.25A9.37 9.37 0 0 0 19.5 9.372a9.337 9.337 0 0 0-2.253-4.121m-4.5 1.25a9.37 9.37 0 0 1-1.25-1.25A9.337 9.337 0 0 1 9.372 19.5a9.37 9.37 0 0 1-1.25-1.25m-1.25-1.25a9.37 9.37 0 0 0-1.25-1.25A9.337 9.337 0 0 0 4.5 9.372a9.37 9.37 0 0 0-1.25 1.25m3.5-6.128a9.37 9.37 0 0 1 1.25-1.25A9.337 9.337 0 0 1 9.372 4.5a9.37 9.37 0 0 1 1.25 1.25m7.5 0a9.37 9.37 0 0 0 1.25-1.25A9.337 9.337 0 0 0 19.5 4.5a9.37 9.37 0 0 0 1.25 1.25M4.5 19.5a9.37 9.37 0 0 1 1.25-1.25A9.337 9.337 0 0 1 9.372 15a9.37 9.37 0 0 1 1.25 1.25m-4.5 0a9.37 9.37 0 0 0 1.25-1.25A9.337 9.337 0 0 0 4.5 15a9.37 9.37 0 0 0-1.25 1.25m6.75-3.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" /></svg>;
const AddUserIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3.375 19.5h17.25a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 20.625 4.5H3.375A2.25 2.25 0 0 0 1.125 6.75v10.5A2.25 2.25 0 0 0 3.375 19.5Z" /></svg>;
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>;
const BriefcaseIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75H4.5a.75.75 0 0 1-.75-.75v-4.25m16.5 0a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25m16.5 0V9a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 9v5.15m11.25-9.15v2.25m-6-2.25v2.25m-1.5-2.25h9" /></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.244 2.077H8.084a2.25 2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const BellIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
const MapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md hover:-translate-y-0.5`}>
        <div className={`${color} p-3 rounded-xl text-white shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

export const SuperadminDashboardPage: React.FC = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<StoredUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({ username: '', email: '', password: '', role: 'therapist' as StoredUser['role'], managerId: '' });
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(() => {
        setUsers(getUsers());
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const stats = useMemo(() => {
        const managers = users.filter(u => u.role === 'manager').length;
        const therapists = users.filter(u => u.role === 'therapist').length;
        const patients = users.filter(u => u.role === 'patient').length;
        return { managers, therapists, patients };
    }, [users]);

    const managers = useMemo(() => users.filter(u => u.role === 'manager'), [users]);

    const handleAddUser = async () => {
        if (!newUserData.username || !newUserData.email || !newUserData.password) {
            setError(t('auth.fillAllFieldsError'));
            return;
        }
        setError(null);
        try {
            const hashedPassword = await hashPassword(newUserData.password);
            const newUser: StoredUser = {
                id: crypto.randomUUID(),
                username: newUserData.username,
                email: newUserData.email,
                hashedPassword,
                consentGiven: true,
                role: newUserData.role,
                managerId: newUserData.role === 'therapist' ? newUserData.managerId : undefined
            };
            const success = saveUser(newUser);
            if (!success) {
                setError(t('auth.usernameTakenError'));
                return;
            }
            fetchUsers();
            setIsAddModalOpen(false);
            setNewUserData({ username: '', email: '', password: '', role: 'therapist', managerId: '' });
        } catch (e) {
            setError(t('auth.registrationFailedError'));
        }
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm(t('therapistDashboard.deletePatientModal.confirmationText'))) {
            deletePatientData(userId); // Reusing patient data delete because it handles user removal too
            fetchUsers();
        }
    };

    const handleToggleNotifications = (userId: string) => {
        if (toggleUserNotifications(userId)) {
            fetchUsers();
        }
    };

    const handleToggleOnboarding = (userId: string) => {
        if (toggleUserOnboarding(userId)) {
            fetchUsers();
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Breadcrumbs items={[{ label: t('nav.superadminDashboard') }]} />
            <PageTitle title={t('nav.superadminDashboard')} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title={t('nav.managers')} value={stats.managers} icon={<BriefcaseIcon className="w-6 h-6"/>} color="bg-indigo-500" />
                <StatCard title={t('nav.therapists')} value={stats.therapists} icon={<UsersIcon className="w-6 h-6"/>} color="bg-blue-500" />
                <StatCard title={t('nav.patients')} value={stats.patients} icon={<UsersIcon className="w-6 h-6"/>} color="bg-emerald-500" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('superadminDashboard.allUsersTitle')}</h3>
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            placeholder={t('therapistDashboard.search')}
                            className="px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-sky-500 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-sky-600 transition-colors"
                        >
                            <AddUserIcon className="w-4 h-4" />
                            <span className="text-sm font-bold">{t('superadminDashboard.addUserButton')}</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('superadminDashboard.table.user')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('superadminDashboard.table.role')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('superadminDashboard.table.parent')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('superadminDashboard.table.settings')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('superadminDashboard.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.filter(u => !searchTerm || u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{user.username}</div>
                                        <div className="text-[10px] text-slate-400">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border 
                                            ${user.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                              user.role === 'manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                                              user.role === 'therapist' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                              'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                            {t(`general.roles.${user.role}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user.role === 'patient' ? users.find(u => u.id === user.therapistId)?.username || t('general.none') : 
                                         user.role === 'therapist' ? users.find(u => u.id === user.managerId)?.username || t('general.none') : t('general.none')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center space-x-2">
                                            <button 
                                                onClick={() => handleToggleNotifications(user.id)}
                                                className={`p-1.5 rounded-lg border transition-all ${user.notificationPreferences?.enabled !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                                                title={user.notificationPreferences?.enabled !== false ? t('therapistDashboard.tooltips.toggleNotificationsOff') : t('therapistDashboard.tooltips.toggleNotificationsOn')}
                                            >
                                                <BellIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleToggleOnboarding(user.id)}
                                                className={`p-1.5 rounded-lg border transition-all ${user.onboardingEnabled !== false ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                                                title={user.onboardingEnabled !== false ? t('therapistDashboard.tooltips.toggleTourOff') : t('therapistDashboard.tooltips.toggleTourOn')}
                                            >
                                                <MapIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {user.id !== currentUser?.id && (
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-900">{t('superadminDashboard.addNewUserTitle')}</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {error && <div className="p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100">{error}</div>}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.username')}</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                                    value={newUserData.username}
                                    onChange={e => setNewUserData({...newUserData, username: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.email')}</label>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                                    value={newUserData.email}
                                    onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.password')}</label>
                                <input 
                                    type="password" 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                                    value={newUserData.password}
                                    onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.role')}</label>
                                <select 
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                                    value={newUserData.role}
                                    onChange={e => setNewUserData({...newUserData, role: e.target.value as StoredUser['role']})}
                                >
                                    <option value="manager">{t('general.roles.manager')}</option>
                                    <option value="therapist">{t('general.roles.therapist')}</option>
                                    <option value="superadmin">{t('general.roles.superadmin')}</option>
                                </select>
                            </div>
                            {newUserData.role === 'therapist' && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('superadminDashboard.form.assignToManager')}</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 outline-none"
                                        value={newUserData.managerId}
                                        onChange={e => setNewUserData({...newUserData, managerId: e.target.value})}
                                    >
                                        <option value="">{t('superadminDashboard.form.none')}</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id}>{m.username}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end space-x-2">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">{t('nav.cancel')}</button>
                            <button onClick={handleAddUser} className="px-6 py-2 bg-sky-500 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-sky-600 transition-colors shadow-sm">{t('nav.save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
