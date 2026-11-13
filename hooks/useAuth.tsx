import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { AuthContextType, User, StoredUser, InformedConsentMetadata } from '../types.ts';
import { api, ApiError, SESSION_EXPIRED_EVENT } from '../services/api.ts';
import {
    syncStore,
    clearStore,
    flushWrites,
    updateOwnUser,
    uiLanguage,
    acceptConsent as acceptConsentInStore,
    withdrawNotificationConsent as withdrawNotificationConsentInStore,
} from '../services/dataStore.ts';
import { CONSENT_VERSIONS } from '../consent.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  // Restore the session the server still holds (the cookie is HttpOnly, so
  // asking is the only way to know), then load the user's data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user } = await api<{ user: StoredUser }>('GET', '/auth/me');
        await syncStore();
        if (!cancelled) setCurrentUser(user);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 401)) console.error('[auth] restoring session failed:', err);
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // A request answered 401 mid-session: the session expired or was revoked
  // (e.g. a password reset). Drop to logged-out; ProtectedRoute redirects.
  useEffect(() => {
    const onExpired = () => {
      clearStore();
      setCurrentUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);


  const login = useCallback(async (username: string, passwordAttempt: string): Promise<{ success: boolean; redirect?: { path: string; state?: any }; errorKey?: string; }> => {
    setLoading(true);
    let storedUser: StoredUser;
    try {
      ({ user: storedUser } = await api<{ user: StoredUser }>('POST', '/auth/login', { username, password: passwordAttempt }));
      await syncStore();
    } catch (err) {
      setLoading(false);
      const code = err instanceof ApiError ? err.code : '';
      return { success: false, errorKey: code.startsWith('auth.') ? code : 'auth.loginFailedError' };
    }
    setCurrentUser(storedUser);
    
    // --- THERAPIST / MANAGER / SUPERADMIN FLOW ---
    if (storedUser.role === 'therapist') {
        setLoading(false);
        return { success: true, redirect: { path: '/therapist/dashboard' } };
    }
    if (storedUser.role === 'manager') {
        setLoading(false);
        return { success: true, redirect: { path: '/manager/dashboard' } };
    }
    if (storedUser.role === 'superadmin') {
        setLoading(false);
        return { success: true, redirect: { path: '/superadmin/dashboard' } };
    }

    // --- PATIENT FLOW ---
    // The start screen shows their next step (utils/nextStep.ts).
    setLoading(false);
    return { success: true, redirect: { path: '/start' } };
  }, []);

  const register = useCallback(async (username: string, email: string, passwordAttempt: string, consent: boolean, informedConsentMetadata?: InformedConsentMetadata): Promise<{ success: boolean; errorKey?: string }> => {
    setLoading(true);
    try {
      await api('POST', '/auth/register', {
        username, email, password: passwordAttempt, consent, informedConsentMetadata,
        consentVersion: CONSENT_VERSIONS.treatment, language: uiLanguage(),
      });
      return { success: true };
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      return { success: false, errorKey: code.startsWith('auth.') ? code : 'auth.registrationFailedError' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    // Let queued writes (e.g. the last exposure rating) reach the server while
    // the session is still valid.
    await flushWrites();
    try {
      await api('POST', '/auth/logout');
    } catch (err) {
      console.error('[auth] logout:', err);
    }
    clearStore();
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;
    // Only these fields are the user's to change; the server rejects the rest.
    const { assistantName, notificationPreferences, sentFollowUps, helpVideoVariant } = updates;
    const patch = Object.fromEntries(
      Object.entries({ assistantName, notificationPreferences, sentFollowUps, helpVideoVariant }).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(patch).length === 0) return true;
    try {
      setCurrentUser(await updateOwnUser(currentUser.id, patch));
      return true;
    } catch (err) {
      console.error('[auth] updateUser:', err);
      return false;
    }
  }, [currentUser]);

  const acceptConsent = useCallback(async (kind: 'treatment' | 'notifications', informedConsentMetadata?: InformedConsentMetadata): Promise<{ success: boolean; errorKey?: string }> => {
    try {
      setCurrentUser(await acceptConsentInStore(kind, informedConsentMetadata));
      return { success: true };
    } catch (err) {
      // consent.outdated: the page showed a text that has since changed.
      return { success: false, errorKey: err instanceof ApiError && err.code === 'consent.outdated' ? 'consentGate.outdatedError' : 'consentGate.saveError' };
    }
  }, []);

  const withdrawNotificationConsent = useCallback(async (): Promise<boolean> => {
    try {
      setCurrentUser(await withdrawNotificationConsentInStore());
      return true;
    } catch (err) {
      console.error('[auth] withdrawNotificationConsent:', err);
      return false;
    }
  }, []);

  // The server answers the same whether or not the address has an account,
  // so the message never reveals who is registered.
  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; errorKey?: string; messageKey?: string }> => {
    setLoading(true);
    try {
      await api('POST', '/auth/password-reset', { email, language: uiLanguage() });
      return { success: true, messageKey: 'auth.resetLinkSentSuccess' };
    } catch (err) {
      console.error('[auth] requestPasswordReset:', err);
      return { success: false, errorKey: 'auth.resetLinkSentError' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Also completes an invitation: both emails carry the same kind of link.
  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<{ success: boolean; errorKey?: string; messageKey?: string }> => {
    setLoading(true);
    try {
      await api('POST', '/auth/password-reset/confirm', { token, password: newPassword });
      return { success: true, messageKey: 'auth.passwordResetSuccess' };
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      return { success: false, errorKey: code.startsWith('auth.') ? code : 'auth.passwordResetError' };
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; errorKey?: string; messageKey?: string }> => {
    if (!currentUser) return { success: false, errorKey: 'auth.loginFailedError' };
    setLoading(true);
    try {
      await api('POST', '/auth/change-password', { currentPassword, newPassword });
      return { success: true, messageKey: 'auth.changePasswordSuccess' };
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      return { success: false, errorKey: code.startsWith('auth.') ? code : 'auth.changePasswordError' };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);


  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, loading, requestPasswordReset, resetPassword, changePassword, updateUser, acceptConsent, withdrawNotificationConsent, setUserFromServer: setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};