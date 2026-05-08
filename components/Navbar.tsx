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
  LifeBuoy
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
    `flex items-center text-[11px] lg:text-sm font-bold tracking-wide uppercase transition-colors duration-200 ${
      isActive
        ? 'text-uib-blue border-uib-blue pb-1'
        : 'text-uib-darkGray hover:text-uib-blue'
    }`;

  const linkActiveBorder = (isActive: boolean) => isActive ? "border-b-2" : "";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24 items-center">
          
          {/* UIB Logo Branding */}
          <div className="flex items-center cursor-pointer group flex-shrink-0" onClick={() => navigate('/')}>
            <UibLogo className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 lg:h-10 md:w-9 lg:w-10 flex-shrink-0" />
            
            <div className="flex flex-col border-l border-gray-300 pl-2 sm:pl-3 md:pl-3 lg:pl-4 py-1 justify-center min-w-0">
                <span className="text-uib-black font-bold text-xs sm:text-base md:text-base lg:text-lg leading-tight tracking-tight group-hover:text-uib-blue transition-colors truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-none">
                    {t('appName')}
                </span>
                <span className="text-[6.5px] sm:text-[8px] md:text-[10px] lg:text-xs text-uib-darkGray uppercase tracking-widest mt-0.5 font-medium truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-none">
                    Universitat de les Illes Balears
                </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-5 xl:space-x-6">
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
                          <span className={`flex items-center whitespace-nowrap ${linkActiveBorder(isActive)}`}>
                            {navIcons[item.labelKey]}
                            {t(item.labelKey)}
                          </span>
                        )}
                    </NavLink>
                );
            })}
            
            <div className="h-6 w-px bg-gray-300 mx-2"></div>

            {currentUser && (
              <div className="flex items-center px-2 mr-2">
                <div className="flex flex-col items-end mr-3 hidden lg:flex">
                  <span className="text-xs font-bold text-uib-black truncate max-w-[100px] xl:max-w-[150px]">
                    {currentUser.username}
                  </span>
                  <span className="text-[9px] font-bold text-uib-darkGray uppercase tracking-tighter leading-none mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center text-xs font-black text-uib-blue border border-sky-100 shadow-sm uppercase shrink-0">
                  {currentUser.username?.charAt(0) || 'U'}
                </div>
              </div>
            )}

            {actionNavItems.map((item) => (
                <NavLink key={item.path} to={item.path} className={linkClass}>
                    {t(item.labelKey)}
                </NavLink>
            ))}

            {currentUser && (
                <button 
                    onClick={handleLogout} 
                    className="text-[11px] lg:text-sm font-bold uppercase tracking-wide text-uib-darkGray hover:text-uib-blue transition-colors whitespace-nowrap"
                >
                    {t('nav.logout')}
                </button>
            )}

            <div className="ml-2">
                <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <div className="mr-2 sm:mr-4 scale-90 sm:scale-100">
                <LanguageSwitcher />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-uib-black hover:text-uib-blue focus:outline-none p-1.5 sm:p-2 transition-colors"
            >
              {isMenuOpen ? <CloseIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <MenuIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
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
                    `flex items-center px-4 py-3 border-l-4 text-base font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-uib-blue bg-sky-50 text-uib-blue'
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