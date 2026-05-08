
import React from 'react';
import { QPVIIQuestion } from '../types.ts';
import { useLanguage } from '../hooks/useLanguage.tsx';

interface QpviiQuestionItemProps {
  question: QPVIIQuestion;
  value: number | null;
  onChange: (questionId: number, value: number) => void;
  isFirst: boolean;
}

const scoreOptions = Array.from({ length: 9 }, (_, i) => i + 1);

export const QpviiQuestionItem: React.FC<QpviiQuestionItemProps> = ({ question, value, onChange, isFirst }) => {
  const { t } = useLanguage();

  return (
    <div className={`py-4 ${!isFirst ? 'border-t border-gray-200' : ''}`}>
      <label htmlFor={`q-${question.id}`} className="block text-sm font-medium text-gray-800 mb-2">
        {t(question.textKey)}
      </label>
      <fieldset id={`q-${question.id}`} aria-label={t(question.textKey)}>
        <legend className="sr-only">{t('qpvii.scoreLabel')}</legend>
        <div className="flex flex-wrap gap-2 items-center">
          {scoreOptions.map((score) => (
            <label 
              key={score} 
              htmlFor={`q-${question.id}-score-${score}`}
              className={`cursor-pointer px-3 py-1.5 border rounded-md text-sm font-medium transition-all duration-150 ease-in-out focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-1
                ${value === score 
                  ? 'bg-sky-600 text-white border-sky-700 shadow-md scale-105' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-sky-50 hover:border-sky-400'
                }`}
            >
              <input
                type="radio"
                id={`q-${question.id}-score-${score}`}
                name={`question-${question.id}`}
                value={score}
                checked={value === score}
                onChange={() => onChange(question.id, score)}
                className="sr-only" // Visually hide the radio, label handles click
                aria-label={`Score ${score}`}
              />
              {score}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
};