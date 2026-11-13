import React from 'react';
import { BellRing } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useReminders } from '../hooks/useReminders';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { SessionPlanner } from '../components/SessionPlanner';

/** The session planner, with an offer to send reminders if they are off. */
export const SessionPlanPage: React.FC = () => {
  const { t } = useLanguage();
  const { on, turnOn } = useReminders();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <PageTitle title={t('planner.pageTitle')} />
      <SectionCard>
        <SessionPlanner />
      </SectionCard>
      {!on && (
        <SectionCard className="mt-6">
          <div className="flex items-start gap-3">
            <BellRing className="w-6 h-6 text-uib-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-3">
              <p className="font-semibold text-slate-800">{t('planner.remindersOffTitle')}</p>
              <p className="text-sm text-gray-700">{t('profile.notificationConsentExplain')}</p>
              <button
                type="button"
                onClick={() => void turnOn()}
                className="py-2 px-4 rounded-lg text-sm font-medium text-white bg-uib-blue hover:bg-[#004C8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uib-blue"
              >
                {t('planner.remindersOn')}
              </button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
};
