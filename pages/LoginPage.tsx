

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { hasQPVIIResults } from '../utils/localStorageDB.ts'; // Import from DB utils

export const LoginPage: React.FC = () => {
  const { login, currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const messageFromState = location.state?.message;
  const usernameFromState = location.state?.username;

  useEffect(() => {
    if (messageFromState) {
      setSuccessMessage(messageFromState);
      if (usernameFromState) {
        setUsername(usernameFromState);
      }
      // Replace the current history entry with one that has no state
      // to prevent the message from showing up on refresh or back navigation.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [messageFromState, usernameFromState, navigate, location.pathname]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!username.trim() || !password.trim()) {
      setError(t('auth.fillAllFieldsError'));
      return;
    }
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success && result.redirect) {
      const from = location.state?.from?.pathname || result.redirect.path || '/cafft-intro';
      navigate(from, { replace: true, state: result.redirect.state }); // Pass state here
    } else if (result.success) { // Fallback if somehow redirect is undefined but success is true
      navigate('/cafft-intro', { replace: true });
    }
     else {
      setError(t(result.errorKey || 'auth.invalidCredentialsError'));
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-lg">
      <PageTitle title={t('auth.loginTitle')} />
      <SectionCard>
        {successMessage && <p className="mb-4 text-green-600 bg-green-50 p-3 rounded-md text-sm">{successMessage}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              {t('auth.usernameLabel')}
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {t('auth.passwordLabel')}
              </label>
              <Link to="/forgot-password" className="text-sm text-sky-600 hover:text-sky-500">
                {t('nav.forgotPasswordLink')}
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400"
          >
            {loading ? t('auth.loading') : t('auth.loginButton')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="font-medium text-sky-600 hover:text-sky-500">
            {t('nav.register')}
          </Link>
        </p>
      </SectionCard>
    </div>
  );
};
