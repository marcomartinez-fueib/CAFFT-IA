

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { useLanguage } from '../hooks/useLanguage.tsx';

interface ProtectedRouteProps {
  children: ReactNode;
  role?: 'patient' | 'therapist' | 'manager' | 'superadmin' | ('patient' | 'therapist' | 'manager' | 'superadmin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p className="text-lg text-gray-600">{t('auth.loading')}</p>
        </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // New: Role-based access control
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(currentUser.role)) {
      // Logic for fallback paths
      let fallbackPath = '/cafft-intro';
      if (currentUser.role === 'therapist') fallbackPath = '/therapist/dashboard';
      if (currentUser.role === 'manager') fallbackPath = '/manager/dashboard';
      if (currentUser.role === 'superadmin') fallbackPath = '/superadmin/dashboard';
      
      return <Navigate to={fallbackPath} replace />;
    }
  }


  return <>{children}</>;
};