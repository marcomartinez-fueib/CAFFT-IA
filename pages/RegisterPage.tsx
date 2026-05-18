

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';
import { PageTitle } from '../components/PageTitle.tsx';
import { SectionCard } from '../components/SectionCard.tsx';
import { InformedConsentMetadata } from '../types.ts';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Informed Consent States
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [occupation, setOccupation] = useState('');
  const [source, setSource] = useState('');
  const [consent, setConsent] = useState(false);
  const [studentsPresence, setStudentsPresence] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !dob || !gender || !occupation || !source) {
      setError(t('auth.fillAllFieldsError'));
      return;
    }
    if (password.length < 6) {
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

          {/* Informed Consent Section */}
          <div className="space-y-6 bg-sky-50 p-4 rounded-lg border border-sky-100">
            <h3 className="text-lg font-semibold text-sky-900 border-b border-sky-200 pb-2">
              {t('informedConsent.title')}
            </h3>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                {t('informedConsent.dob')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dob"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                {t('informedConsent.gender')} <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              >
                <option value="">{t('informedConsent.select')}</option>
                <option value="male">{t('informedConsent.genderMale')}</option>
                <option value="female">{t('informedConsent.genderFemale')}</option>
                <option value="other">{t('informedConsent.genderOther')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
                {t('informedConsent.occupation')} <span className="text-red-500">*</span>
              </label>
              <select
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              >
                <option value="">{t('informedConsent.select')}</option>
                <option value="student">{t('informedConsent.occupationStudent')}</option>
                <option value="PTGAS">{t('informedConsent.occupationPTGAS')}</option>
                <option value="PDI">{t('informedConsent.occupationPDI')}</option>
                <option value="other">{t('informedConsent.occupationOther')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                {t('informedConsent.source')} <span className="text-red-500">*</span>
              </label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                required
              >
                <option value="">{t('informedConsent.select')}</option>
                <option value="web">{t('informedConsent.sourceWeb')}</option>
                <option value="medical">{t('informedConsent.sourceUnitatMedica')}</option>
                <option value="needs">{t('informedConsent.sourceNecessitats')}</option>
                <option value="profesor">{t('informedConsent.sourceProfesor')}</option>
                <option value="user">{t('informedConsent.sourceUser')}</option>
                <option value="friend">{t('informedConsent.sourceFriend')}</option>
                <option value="other">{t('informedConsent.sourceOther')}</option>
              </select>
            </div>

            <div className="bg-white p-3 border border-sky-200 rounded text-xs text-gray-600 h-48 overflow-y-auto whitespace-pre-wrap">
              <strong>{t('informedConsent.consentDate')}: {new Date().toLocaleDateString()}</strong>
              <div className="mt-2">
                {t('informedConsent.consentText')}
              </div>
              <div className="mt-4 p-2 bg-gray-50 border-l-4 border-sky-500">
                {t('informedConsent.legalText')}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="consent" className="font-medium text-gray-700">
                    {t('informedConsent.consentAcceptLabel')} <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="studentsPresence"
                    name="studentsPresence"
                    type="checkbox"
                    checked={studentsPresence}
                    onChange={(e) => setStudentsPresence(e.target.checked)}
                    className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="studentsPresence" className="text-gray-700">
                    {t('informedConsent.studentsPresence')}
                  </label>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 italic">
                {t('informedConsent.conformityTitle')}
            </p>
          </div>

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