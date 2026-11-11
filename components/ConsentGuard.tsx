import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { needsTreatmentConsent } from '../consent.ts';
import { ConsentPage } from '../pages/ConsentPage.tsx';

/**
 * For pages open to visitors too (the QPV-II): a logged-in patient without
 * the current informed consent gets the consent screen instead.
 */
export const ConsentGuard: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return needsTreatmentConsent(currentUser) ? <ConsentPage /> : <>{children}</>;
};
