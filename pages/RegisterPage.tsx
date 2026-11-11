

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { InformedConsentMetadata } from '../types.ts';
import { InformedConsentFields, InformedConsentValue, emptyInformedConsent } from '../components/InformedConsentFields.tsx';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [consentForm, setConsentForm] = useState<InformedConsentValue>(emptyInformedConsent);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { dob, gender, occupation, source, consent, studentsPresence } = consentForm;
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !dob || !gender || !occupation || !source) {
      setError(t('auth.fillAllFieldsError'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordMinLengthError'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDontMatchError'));
      return;
    }
    if (!consent) {
      setError(t('auth.consentRequiredError'));
      return;
    }

    const metadata: InformedConsentMetadata = {
        dob,
        gender,
        occupation,
        source,
        studentsPresence
    };

    setLoading(true);
    const result = await register(username, email, password, consent, metadata);
    setLoading(false);
    if (result.success) {
      navigate('/login', { state: { message: t('auth.registrationSuccess'), registered: true, username } });
    } else {
      setError(t(result.errorKey || 'auth.registrationFailedError')); 
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-lg">
      <PageTitle title={t('auth.registerTitle')} />
      <SectionCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              {t('auth.usernameLabel')}
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
            />
          </div>
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
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-700">
              {t('auth.passwordLabel')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              required
              minLength={6}
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
              required
              minLength={6}
            />
          </div>

          <hr className="my-6 border-gray-200" />

          <InformedConsentFields value={consentForm} onChange={setConsentForm} />

          {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400"
          >
            {loading ? t('auth.loading') : t('auth.registerButton')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
            {t('nav.login')}
          </Link>
        </p>
      </SectionCard>
    </div>
  );
};