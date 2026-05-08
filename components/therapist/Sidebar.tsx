

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { 
    THERAPIST_SIDEBAR_NAV, 
    MANAGER_SIDEBAR_NAV, 
    SUPERADMIN_SIDEBAR_NAV 
} from '../../constants';
import { UibLogo } from '../Logo';
import { AssistantModal } from '../AssistantModal';
import { HelpCircle, X, LayoutDashboard, Bell, Users, LogOut, MessageSquare } from 'lucide-react';

const navIcons: { [key: string]: any } = {
    'nav.therapistDashboard': LayoutDashboard,
    'nav.managerDashboard': LayoutDashboard,
    'nav.superadminDashboard': LayoutDashboard,
    'nav.patients': Users,
    'nav.therapistNotifications': Bell,
    'nav.feedback': MessageSquare,
};

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { currentUser, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const getNavItems = () => {
        if (!currentUser) return [];
        switch(currentUser.role) {
            case 'superadmin': return SUPERADMIN_SIDEBAR_NAV;
            case 'manager': return MANAGER_SIDEBAR_NAV;
            case 'therapist': return THERAPIST_SIDEBAR_NAV;
            default: return [];
        }
    };

    const navItems = getNavItems();

    const handleLogout = () => {
        logout();
        navigate('/');
        if (onClose) onClose();
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        if (onClose) onClose();
    };
    
    const baseLinkStyle = "flex items-center px-4 py-3 text-slate-400 transition-all duration-200 rounded-xl group cursor-pointer w-full text-left border border-transparent mb-1";
    const activeLinkStyle = "bg-uib-accent text-white font-bold shadow-md shadow-uib-accent/20 border-uib-accent/30";
    const inactiveLinkStyle = "hover:bg-slate-800 hover:text-white";

    return (
        <aside className="flex flex-col w-full h-screen px-4 py-8 overflow-y-auto bg-slate-900 border-r border-slate-800 shadow-2xl lg:shadow-none">
            <div className="flex items-center justify-between mb-8 lg:hidden">
                <div className="flex items-center">
                    <UibLogo variant="light" className="h-8" />
                    <span className="ml-3 font-black text-xs uppercase tracking-widest text-white">Clinical</span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex flex-col items-center mb-8 px-2">
                 <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl font-black text-uib-blue mb-4 border border-slate-700 shadow-xl overflow-hidden group relative">
                    <div className="absolute inset-0 bg-uib-blue opacity-0 group-hover:opacity-10 transition-opacity" />
                    {currentUser?.username?.charAt(0).toUpperCase() || 'T'}
                </div>
                <h4 className="text-sm font-black text-white text-center truncate w-full">{currentUser?.username}</h4>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate w-full text-center">{currentUser?.role}</p>
            </div>
            
            <div className="flex flex-col justify-between flex-1 mt-4">
                <nav id="sidebar-nav" className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = navIcons[item.labelKey] || LayoutDashboard;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => handleNavigate(item.path)}
                                className={`${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
                            >
                                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span className="ml-3 text-xs uppercase font-black tracking-widest">{t(item.labelKey)}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="space-y-4 pt-6 mt-6 border-t border-slate-800/50">
                    <button 
                        onClick={() => setIsHelpOpen(true)} 
                        className={`${baseLinkStyle} ${inactiveLinkStyle}`}
                    >
                        <HelpCircle className="w-5 h-5 text-sky-400" />
                        <span className="ml-3 text-xs uppercase font-black tracking-widest">{t('nav.help')}</span>
                    </button>
                    
                    <button onClick={handleLogout} className={`${baseLinkStyle} group hover:bg-rose-500/10 text-rose-400`}>
                        <LogOut className="w-5 h-5 text-rose-400 group-hover:rotate-12 transition-transform" />
                        <span className="ml-3 text-xs uppercase font-black tracking-widest">{t('nav.logout')}</span>
                    </button>
                    
                    <div className="flex justify-center pt-6 opacity-40 hover:opacity-100 transition-opacity">
                        <UibLogo variant="light" className="h-10" />
                    </div>
                </div>
            </div>

            <AssistantModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </aside>
    );
};
