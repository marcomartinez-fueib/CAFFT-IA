

import React, { useState, useEffect } from 'react';
import { QPVIIAnswers } from '../types.ts';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { QPVII_QUESTIONS } from '../constants.ts';
import { QpviiQuestionItem } from './QpviiQuestionItem.tsx';
import { SectionCard } from './SectionCard.tsx';

interface QpviiFormProps {
  onSubmit: (name: string, date: string, answers: QPVIIAnswers) => void;
  isSubmitting: boolean;
  initialName?: string; 
}

const initialAnswers = QPVII_QUESTIONS.reduce<QPVIIAnswers>((acc, q) => {
  acc[q.id] = null;
  return acc;
}, {});

// SVG Icon for Randomness (Dice)
const DiceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 3.5A1.5 1.5 0 0111.5 5v1.667l2.906-1.118a.5.5 0 01.688.131L16.5 7.55a.5.5 0 01-.13.688L15.252 9.5H16.5A1.5 1.5 0 0118 11v-.083a1.5 1.5 0 01-1.5 1.5h-1.667l1.118 2.906a.5.5 0 01-.131.688l-1.857 1.444a.5.5 0 01-.688-.13L10.5 15.252V16.5a1.5 1.5 0 01-1.5 1.5h-.083a1.5 1.5 0 01-1.5-1.5v-1.667l-2.906 1.118a.5.5 0 01-.688-.131L2.5 13.45a.5.5 0 01.13-.688L3.748 11.5H2.5A1.5 1.5 0 011 10v.083A1.5 1.5 0 012.5 8.5h1.667L2.906 5.594a.5.5 0 01.131-.688l1.857-1.444a.5.5 0 01.688.13L8.5 4.748V3.5A1.5 1.5 0 0110 3.5zM6 10a1 1 0 100-2 1 1 0 000 2zM5 7a1 1 0 100-2 1 1 0 000 2zm5 3a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 100-2 1 1 0 000 2zm-6 4a1 1 0 100-2 1 1 0 000 2zm3 2a1 1 0 100-2 1 1 0 000 2z" />
    <path d="M12.5 8.5a1 1 0 100-2 1 1 0 000 2zM10 6a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);


export const QpviiForm: React.FC<QpviiFormProps> = ({ onSubmit, isSubmitting, initialName = '' }) => {
  const { t } = useLanguage();
  const [name, setName] = useState(initialName);
  const [date, setDate] = useState('');
  const [answers, setAnswers] = useState<QPVIIAnswers>(initialAnswers);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleAnswerChange = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null); 
  };
  
  const today = new Date().toISOString().split('T')[0];
  useEffect(() => {
    if (!date) { 
        setDate(today);
    }
  }, [today, date]);

  const handleFillRandomly = () => {
    const randomAnswers = QPVII_QUESTIONS.reduce<QPVIIAnswers>((acc, q) => {
      acc[q.id] = Math.floor(Math.random() * 9) + 1; // Random score between 1 and 9
      return acc;
    }, {});
    setAnswers(randomAnswers);
    setError(null); // Clear any existing errors
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      setError(t('qpvii.allFieldsRequiredError'));
      return;
    }
    const allAnswered = QPVII_QUESTIONS.every(q => answers[q.id] !== null && answers[q.id] >= 1 && answers[q.id] <= 9);
    if (!allAnswered) {
      setError(t('qpvii.allFieldsRequiredError'));
      return;
    }
    setError(null);
    onSubmit(name, date, answers);
  };
  
  const isFormValid = name.trim() !== '' && date !== '' && QPVII_QUESTIONS.every(q => answers[q.id] !== null && answers[q.id] >= 1 && answers[q.id] <= 9);

  return (
    <SectionCard title={t('qpvii.formTitle')}>
      <p className="mb-6 text-sm text-gray-700">{t('qpvii.instructions')}</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="qpvii-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('qpvii.nameLabel')}
            </label>
            <input
              type="text"
              id="qpvii-name"
              value={name}
              onChange={(e) => {setName(e.target.value); setError(null);}}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-uib-blue focus:border-uib-blue sm:text-sm"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="qpvii-date" className="block text-sm font-medium text-gray-700 mb-1">
              {t('qpvii.dateLabel')}
            </label>
            <input
              type="date"
              id="qpvii-date"
              value={date}
              onChange={(e) => {setDate(e.target.value); setError(null);}}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-uib-blue focus:border-uib-blue sm:text-sm"
              required
              aria-required="true"
            />
          </div>
        </div>
        
        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={handleFillRandomly}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-uib-warmGray disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors sm:w-auto"
          >
            <DiceIcon className="w-5 h-5 mr-2 text-gray-500" />
            {t('qpvii.fillRandomlyButton')}
          </button>
        </div>

        <div className="space-y-2">
          {QPVII_QUESTIONS.map((q, index) => (
            <QpviiQuestionItem
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={handleAnswerChange}
              isFirst={index === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-2" role="alert">{error}</p>
        )}

        <div className="mt-8">
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? t('qpvii.calculatingButton') : t('qpvii.submitButton')}
          </button>
        </div>
      </form>
    </SectionCard>
  );
};