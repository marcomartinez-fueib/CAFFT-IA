
import React from 'react';
import { QPVIIScores, QPVIIUserResult } from '../types.ts'; // QPVIIUserResult might be needed if passing full result state
import { useLanguage } from '../hooks/useLanguage.tsx';
import { useAuth } from '../hooks/useAuth.tsx';
import { SectionCard } from './SectionCard.tsx';
import { useNavigate, Link } from 'react-router-dom';

interface QpviiResultsDisplayProps {
  name: string;
  date: string;
  scores: QPVIIScores;
  onBackToForm: () => void;
  qpviiTimestamp?: number; 
  onViewHierarchy: () => void; 
  showViewHierarchyButton?: boolean; // New prop
}

export const QpviiResultsDisplay: React.FC<QpviiResultsDisplayProps> = ({ name, date, scores, onBackToForm, qpviiTimestamp, onViewHierarchy, showViewHierarchyButton = true }) => {
  const { t, language } = useLanguage(); 
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getLocaleForDate = () => {
    switch(language) {
      case 'ca': return 'ca-ES';
      case 'es': return 'es-ES';
      case 'en': return 'en-US';
      default: return 'en-US';
    }
  };


  const scoreItems = [
    { labelKey: 'qpvii.generalDiscomfortScore', value: scores.malestarGeneral },
    { labelKey: 'qpvii.subPreparatiusScore', value: scores.subPreparatius },
    { labelKey: 'qpvii.subVicariScore', value: scores.subVicari },
    { labelKey: 'qpvii.subVolScore', value: scores.subVol },
    { labelKey: 'qpvii.totalScore', value: scores.total, isTotal: true },
  ];

  return (
    <SectionCard title={t('qpvii.resultsTitle')} className="rounded-xl shadow-lg p-6 sm:p-8">
      <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-800">{t('qpvii.personName')}:</span> {name}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-800">{t('qpvii.evaluationDate')}:</span> {new Date(date + 'T00:00:00').toLocaleDateString(getLocaleForDate(), { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="space-y-3">
        {scoreItems.map(item => (
          <div
            key={item.labelKey}
            className={`flex justify-between items-center p-3 rounded-lg ${item.isTotal ? 'bg-sky-50 text-uib-blue border border-sky-200' : 'bg-slate-100 text-gray-800'}`}
          >
            <span className={`text-sm font-medium ${item.isTotal ? 'text-uib-blue' : 'text-gray-700'}`}>
              {t(item.labelKey)}:
            </span>
            <span className={`text-lg font-bold ${item.isTotal ? 'text-uib-blue' : 'text-gray-900'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
       
      <div className="mt-8 space-y-3">
        <button
            onClick={onBackToForm}
            className="w-full flex justify-center py-2.5 px-4 border border-uib-blue rounded-lg shadow-sm text-sm font-medium text-uib-blue bg-white hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue transition-colors"
          >
            {t('qpvii.backToFormButton')}
        </button>
        
        {qpviiTimestamp && showViewHierarchyButton && ( 
            <button
                onClick={onViewHierarchy} 
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue transition-colors"
            >
                {t('qpvii.viewHierarchyButton')}
            </button>
        )}

        <button
            onClick={handleLogout}
            className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
        >
            {t('nav.logout')}
        </button>
      </div>
    </SectionCard>
  );
};