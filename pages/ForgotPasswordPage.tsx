
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError(t('auth.fillAllFieldsError')); // Or a specific "email required" message
      return;
    }
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);

    if (result.success) {
      setMessage(t(result.messageKey || 'auth.resetLinkSentSuccess'));
    } else {
      setError(t(result.errorKey || 'auth.resetLinkSentError'));
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-lg">
      <PageTitle title={t('auth.forgotPasswordTitle')} />
      <SectionCard>
        <p className="mb-6 text-sm text-gray-600">{t('auth.forgotPasswordInstructions')}</p>
        {message && <p className="mb-4 text-green-600 bg-green-50 p-3 rounded-md text-sm">{message}</p>}
        {error && <p className="mb-4 text-red-600 bg-red-50 p-3 rounded-md text-sm" role="alert">{error}</p>}
        
        {!message && ( // Hide form after success message
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.emailLabel')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400"
            >
              {loading ? t('auth.loading') : t('auth.sendResetLinkButton')}
            </button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
            {t('auth.loginTitle')}
          </Link>
          <span className="mx-2">|</span>
          <Link to="/register" className="font-medium text-sky-600 hover:text-sky-500">
            {t('auth.registerTitle')}
          </Link>
        </p>
      </SectionCard>
    </div>
  );
};
