import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { getExposureSessionsForUser, getUserExposureProgress } from '../services/dataStore';
import { summarizeSession } from '../utils/sessions';

/**
 * Where «Fer una pausa» lands: what the patient did in the session that just
 * ended, without logging them out. The date of the next session and «Afegir
 * al calendari» arrive with the session planner.
 */
export const SessionEndPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = (location.state as { sessionId?: string }) || {};

  const view = useMemo(() => {
    if (!currentUser) return null;
    const sessions = getExposureSessionsForUser(currentUser.id);
    const session = sessions.find((s) => s.id === sessionId) ?? sessions[0];
    if (!session) return null;
    return summarizeSession(session, getUserExposureProgress(currentUser.id, session.qpviiTimestamp));
  }, [currentUser, sessionId]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <PageTitle title={t('sessionEnd.pausedTitle')} />
      <SectionCard>
        {!view || view.ratings.length === 0 ? (
          <p className="text-gray-700">{t('sessionEnd.noSession')}</p>
        ) : (
          <>
            <p className="text-gray-700 mb-6">{t('sessionEnd.pausedIntro')}</p>

            <h2 className="text-lg font-semibold text-slate-800 mb-3">{t('sessionEnd.summaryTitle')}</h2>
            <ul className="space-y-2 mb-6 text-gray-700">
              <li>{t('sessionEnd.videosRated', { count: view.ratings.length })}</li>
              <li>{t('sessionEnd.videosPassed', { count: view.videosPassed })}</li>
              <li>{t('sessionEnd.discomfortChange', { first: view.first, last: view.last })}</li>
              <li>{t('sessionEnd.duration', { minutes: view.minutes })}</li>
            </ul>
            <p className="text-gray-700 mb-6">{t('sessionEnd.encouragement')}</p>

            <h2 className="text-lg font-semibold text-slate-800 mb-2">{t('sessionEnd.nextTitle')}</h2>
            <p className="text-gray-700 mb-8">{t('sessionEnd.nextText')}</p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-5 rounded-lg shadow-sm text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue"
          >
            {t('sessionEnd.homeButton')}
          </button>
          <button
            onClick={() => navigate('/evolution')}
            className="flex-1 py-3 px-5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue"
          >
            {t('sessionEnd.evolutionButton')}
          </button>
        </div>
      </SectionCard>
    </div>
  );
};
