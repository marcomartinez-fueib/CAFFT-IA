import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { api } from '../services/api';

/** The link at the foot of every reminder email: turns reminders off without logging in. */
export const RemindersOffPage: React.FC = () => {
  const { t } = useLanguage();
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');

  useEffect(() => {
    api('POST', '/reminders/off', { token })
      .then(() => setState('done'))
      .catch(() => setState('failed'));
  }, [token]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
      <PageTitle title={t('remindersOff.title')} />
      <SectionCard>
        <p className="text-gray-700" role="status">
          {state === 'working' ? t('auth.loading') : state === 'done' ? t('remindersOff.done') : t('remindersOff.failed')}
        </p>
      </SectionCard>
    </div>
  );
};
