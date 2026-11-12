import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { getQPVIIResultsForUser } from '../services/dataStore';
import { computeRci } from '../utils/rci';

/** The QPV-II before and after the programme, without pressure: the figures and whether the change is reliable. */
export const QpviiComparison: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useLanguage();
  const results = getQPVIIResultsForUser(userId); // newest first
  if (results.length < 2) return <p className="text-gray-600">{t('flight.compareMissing')}</p>;
  const pre = results[results.length - 1].scores.total;
  const post = results[0].scores.total;
  const rci = computeRci(pre, post);
  return (
    <div>
      <dl className="grid grid-cols-2 gap-4 text-center mb-3">
        <div className="rounded-lg bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">{t('flight.before')}</dt>
          <dd className="text-3xl font-bold text-slate-800 tabular-nums">{pre}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <dt className="text-sm text-slate-500">{t('flight.after')}</dt>
          <dd className="text-3xl font-bold text-slate-800 tabular-nums">{post}</dd>
        </div>
      </dl>
      <p className="text-gray-700">{t(`flight.change.${rci.direction}`)}</p>
    </div>
  );
};
