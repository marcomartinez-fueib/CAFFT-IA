
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError(t('auth.fillAllFieldsError'));
      return;
    }
     if (newPassword.length < 6) {
      setError(t('auth.passwordMinLengthError'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDontMatchError'));
      return;
    }
    if (!token) {
        setError(t('auth.invalidOrExpiredTokenError')); // Should not happen if route is set up
        return;
    }

    setLoading(true);
    // For demo, if token is not 'valid_token_from_email_simulation', it will fail in useAuth.
    // A real app's backend would validate the actual token from the email.
    const result = await resetPassword(token, newPassword);
    setLoading(false);

    if (result.success) {
      setSuccessMessage(t(result.messageKey || 'auth.passwordResetSuccess'));
      // Optionally redirect to login after a delay
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(t(result.errorKey || 'auth.passwordResetError'));
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-lg">
      <PageTitle title={t('auth.resetPasswordTitle')} />
      <SectionCard>
        <p className="mb-6 text-sm text-gray-600">{t('auth.resetPasswordInstructions')}</p>
        {successMessage && <p className="mb-4 text-green-600 bg-green-50 p-3 rounded-md text-sm">{successMessage}</p>}
        {error && <p className="mb-4 text-red-600 bg-red-50 p-3 rounded-md text-sm" role="alert">{error}</p>}

        {!successMessage && ( // Hide form after success
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="newPassword"className="block text-sm font-medium text-gray-700">
                {t('auth.newPasswordLabel')}
                </label>
                <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required minLength={6}
                />
            </div>
            <div>
                <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">
                {t('auth.confirmPasswordLabel')}
                </label>
                <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required minLength={6}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400"
            >
                {loading ? t('auth.loading') : t('auth.resetPasswordButton')}
            </button>
            </form>
        )}
        {(successMessage || error) && (
            <p className="mt-6 text-center text-sm text-gray-600">
             <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
                {t('auth.loginTitle')}
             </Link>
            </p>
        )}
      </SectionCard>
    </div>
  );
};
