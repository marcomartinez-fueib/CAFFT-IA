import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { translations } from '../data/translations.ts';

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

export const HomePage: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  
  const homeTitleParts = translations[language].home.title;

    const getDashboardPath = () => {
        if (!currentUser) return '/login';
        switch (currentUser.role) {
            case 'superadmin': return '/superadmin/dashboard';
            case 'manager': return '/manager/dashboard';
            case 'therapist': return '/therapist/dashboard';
            case 'patient': return '/cafft-intro';
            default: return '/cafft-intro';
        }
    };

    return (
        <div className="bg-white min-h-[calc(100vh-96px)] flex flex-col justify-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="text-center max-w-5xl mx-auto">
                    {/* Meta Info - Academic Style */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-uib-darkGray mb-6 md:mb-8 border-b-2 border-uib-blue pb-2 max-w-full px-2">
                        <span className="whitespace-nowrap">2026 — {t('home.firstEdition')}</span>
                        <span className="hidden sm:inline text-uib-warmGray mx-1">•</span>
                        <span className="whitespace-nowrap">{t('home.version')}</span>
                    </div>
                    
                    {/* Title */}
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-uib-black tracking-tight leading-[0.9] sm:leading-none mb-6 md:mb-8 px-2">
                        {homeTitleParts.map((part, index) => (
                            <span key={index} className={index === homeTitleParts.length - 1 ? "text-uib-blue block mt-1 sm:mt-2" : "text-uib-black mr-2 md:mr-3"}>
                                {part}
                            </span>
                        ))}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-sm sm:text-lg md:text-xl text-uib-darkGray mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-4">
                        {t('home.subtitle')}
                    </p>

                    {/* Action Buttons - Corporate Style */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                        {currentUser ? (
                            <Link
                                to={getDashboardPath()}
                                className="group inline-flex items-center justify-center px-8 py-3 border-2 border-uib-blue text-lg font-bold rounded-md text-white bg-uib-blue hover:bg-white hover:text-uib-blue transition-all duration-300"
                            >
                                {currentUser.role === 'patient' ? t('home.startButton') : t('nav.therapistDashboard')}
                                <ArrowRightIcon className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-uib-blue text-base font-bold rounded-md text-white bg-uib-blue hover:bg-white hover:text-uib-blue transition-all duration-300 w-full sm:w-auto"
                >
                  {t('nav.register')}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-uib-darkGray text-base font-bold rounded-md text-uib-darkGray bg-white hover:bg-uib-black hover:text-white hover:border-uib-black transition-all duration-300 w-full sm:w-auto"
                >
                  {t('nav.login')}
                </Link>
              </>
            )}
          </div>
          
          {/* Footer-like attribution in Hero */}
          <div className="mt-20 pt-8 w-24 mx-auto border-t border-gray-200">
             <div className="flex flex-col items-center opacity-50">
                <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">UIB</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};