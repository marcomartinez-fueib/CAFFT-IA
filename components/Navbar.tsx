import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { TOP_NAV_GUEST, TOP_NAV_AUTH, NAV_ITEMS_GUEST_ACTIONS, THERAPIST_SIDEBAR_NAV } from '../constants.ts';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { UibLogo } from './Logo.tsx';

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Official-styled UIB Shield Logo Component (imported from Logo.tsx)

import { 
  Home, 
  ClipboardCheck, 
  PlayCircle, 
  TrendingUp, 
  LayoutDashboard, 
  Settings,
  Users,
  Bell,
  MessageSquare,
  LifeBuoy,
  Beaker,
  BookOpen
} from 'lucide-react';

const navIcons: Record<string, React.ReactNode> = {
  'nav.home': <Home className="w-4 h-4 mr-2" />,
  'nav.cafftIntro': <Home className="w-4 h-4 mr-2" />,
  'nav.qpviiEvaluation': <ClipboardCheck className="w-4 h-4 mr-2" />,
  'nav.exposure': <PlayCircle className="w-4 h-4 mr-2" />,
  'nav.evolution': <TrendingUp className="w-4 h-4 mr-2" />,
  'nav.therapistDashboard': <LayoutDashboard className="w-4 h-4 mr-2" />,
  'nav.patients': <Users className="w-4 h-4 mr-2" />,
  'nav.therapistNotifications': <Bell className="w-4 h-4 mr-2" />,
  'nav.clinicalGuide': <BookOpen className="w-4 h-4 mr-2" />,
  'nav.scientificEvidence': <Beaker className="w-4 h-4 mr-2" />,
  'nav.settings': <Settings className="w-4 h-4 mr-2" />,
  'nav.feedback': <MessageSquare className="w-4 h-4 mr-2" />,
  'nav.helpCenter': <LifeBuoy className="w-4 h-4 mr-2" />,
};

export const Navbar: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const mainNavItems = currentUser 
    ? (currentUser.role === 'therapist' ? THERAPIST_SIDEBAR_NAV : TOP_NAV_AUTH)
    : TOP_NAV_GUEST;
    
  const actionNavItems = currentUser ? [] : NAV_ITEMS_GUEST_ACTIONS;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex items-center h-full text-[8.5px] lg:text-[10px] xl:text-[12.5px] font-extrabold tracking-tighter lg:tracking-tight uppercase transition-all duration-300 group ${
      isActive
        ? 'text-uib-blue'
        : 'text-uib-darkGray hover:text-uib-blue'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-2 lg:px-4 max-w-full mx-auto">
        <div className="flex justify-between h-16 md:h-24 items-center gap-1">
          
          {/* UIB Logo Branding */}
          <div className="flex items-center cursor-pointer group flex-shrink-0 min-w-0" onClick={() => navigate('/')}>
            <UibLogo className="h-6 w-6 sm:h-8 sm:w-8 md:h-9 lg:h-10 flex-shrink-0" />
            
            <div className="flex flex-col border-l border-gray-300 ml-1 lg:ml-2 pl-1 lg:pl-2 py-0.5 md:py-1 justify-center min-w-0">
                <span className="lg:hidden text-uib-black font-black text-[12px] sm:text-sm md:text-base leading-tight tracking-tighter group-hover:text-uib-blue transition-colors truncate">
                    {t('appNameShort')}
                </span>
                <span className="hidden lg:inline text-uib-black font-black text-base xl:text-lg leading-none tracking-tighter group-hover:text-uib-blue transition-colors truncate">
                    {t('appName')}
                </span>
                <span className="hidden sm:inline text-[5px] md:text-[8px] lg:text-[9px] text-uib-darkGray uppercase tracking-[0.1em] lg:tracking-[0.15em] mt-0.5 font-bold truncate leading-none">
                    Universitat de les Illes Balears
                </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-0 overflow-hidden h-full">
            {mainNavItems.map((item) => {
                let id = "";
                if (item.path === '/cafft-intro') id = "nav-home";
                if (item.path === '/qpvii-evaluation') id = "nav-qpvii";
                if (item.path === '/exposure') id = "nav-exposure";
                if (item.path === '/evolution') id = "nav-evolution";
                if (item.path === '/help-center') id = "nav-help-center";

                return (
                    <NavLink key={item.path} id={id} to={item.path} className={linkClass}>
                        {({ isActive }) => (
                          <div className="flex flex-col items-center justify-center h-full px-0 relative">
                            <span className="flex items-center whitespace-nowrap px-0.5 lg:px-1.5 py-2 rounded-lg group-hover:bg-slate-50 transition-colors">
                              <span className="shrink-0 scale-75 lg:scale-100">{navIcons[item.labelKey]}</span>
                              <span className="hidden md:inline">{t(item.labelKey)}</span>
                            </span>
                            {/* Active Indicator Line */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-uib-blue rounded-t-full transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0 shadow-[0_-2px_10px_rgba(30,58,138,0.2)]' : 'opacity-0 translate-y-1 group-hover:opacity-20 group-hover:translate-y-0'}`} />
                          </div>
                        )}
                    </NavLink>
                );
            })}
          </div>

          {/* User & Actions group */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3 xl:space-x-5 flex-shrink-0 border-l border-gray-100 pl-2 lg:pl-4 xl:pl-6 h-full">
            <div className="shrink-0 scale-90 lg:scale-100">
                <LanguageSwitcher />
            </div>
            
            <div className="h-8 w-px bg-slate-100 hidden lg:block mx-1"></div>

            {currentUser && (
              <div className="flex items-center group cursor-pointer">
                <div className="flex flex-col items-end mr-2 lg:mr-3 hidden lg:flex">
                  <span className="text-[11px] xl:text-xs font-black text-uib-black truncate max-w-[80px] xl:max-w-[150px]">
                    {currentUser.username}
                  </span>
                  <span className="text-[8px] xl:text-[9px] font-black text-white px-2 py-0.5 rounded-full bg-gradient-to-r from-uib-blue to-uib-accent/80 uppercase tracking-widest leading-none mt-1 shadow-sm">
                    {currentUser.role}
                  </span>
                </div>
                <div className="w-8 h-8 xl:w-10 xl:h-10 bg-uib-blue rounded-xl flex items-center justify-center text-sm font-black text-white border-2 border-white shadow-lg ring-1 ring-uib-blue/5 uppercase shrink-0 transition-all group-hover:scale-110 group-hover:shadow-uib-blue/20">
                  {currentUser.username?.charAt(0) || 'U'}
                </div>
              </div>
            )}

            {currentUser && (
                <button 
                    onClick={handleLogout} 
                    className="text-[9px] lg:text-[10px] xl:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-uib-red transition-all whitespace-nowrap pl-2 hover:translate-x-0.5"
                >
                    {t('nav.logout')}
                </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <div className="mr-1 sm:mr-4">
                <LanguageSwitcher />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-uib-black hover:text-uib-blue focus:outline-none p-1 sm:p-2 transition-colors"
            >
              {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 animate-fadeIn z-50">
          <div className="px-2 sm:px-4 pt-2 pb-6 space-y-1">
            {currentUser && (
              <div className="px-4 py-4 mb-2 bg-slate-50 rounded-xl flex items-center border border-slate-100 mx-2 mt-2">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg font-black text-uib-blue border border-uib-blue/20 shadow-sm uppercase mr-4">
                  {currentUser.username?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-uib-black truncate">
                    {currentUser.username}
                  </span>
                  <span className="text-[10px] font-bold text-uib-darkGray uppercase tracking-widest mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            )}
            
            {mainNavItems.map((item) => {
              let id = "";
              if (item.path === '/cafft-intro') id = "nav-home-mobile";
              if (item.path === '/qpvii-evaluation') id = "nav-qpvii-mobile";
              if (item.path === '/exposure') id = "nav-exposure-mobile";
              if (item.path === '/evolution') id = "nav-evolution-mobile";
              if (item.path === '/help-center') id = "nav-help-center-mobile";

              return (
                <NavLink
                  key={item.path}
                  id={id}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                   className={({ isActive }) =>
                    `flex items-center px-4 py-3 border-l-4 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-uib-blue bg-blue-50/50 text-uib-blue scale-[1.02] shadow-sm'
                        : 'border-transparent text-uib-darkGray hover:bg-gray-50 hover:text-uib-black'
                    }`
                  }
                >
                  {navIcons[item.labelKey]}
                  {t(item.labelKey)}
                </NavLink>
              );
            })}
            <div className="border-t border-gray-100 my-2"></div>
            {actionNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-base font-bold uppercase tracking-wide text-uib-darkGray hover:bg-gray-50 hover:text-uib-black"
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 text-base font-bold uppercase tracking-wide text-uib-blue hover:bg-sky-50"
              >
                {t('nav.logout')}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};