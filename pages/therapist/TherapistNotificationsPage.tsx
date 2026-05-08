
import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { PageTitle } from '../../components/PageTitle';
import { Breadcrumbs } from '../../components/Breadcrumbs';

export const TherapistNotificationsPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div>
      <Breadcrumbs items={[
          { label: t('nav.therapistDashboard'), path: '/therapist/dashboard' },
          { label: t('nav.therapistNotifications') }
      ]} />
      <PageTitle title={t('therapistDashboard.notificationsTitle')} />
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-center text-gray-500 py-20">
            Notifications list and management tools will be implemented here.
        </p>
      </div>
    </div>
  );
};
