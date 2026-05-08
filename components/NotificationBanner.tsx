
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { getDaysSinceLastActivity } from '../utils/localStorageDB';

export const NotificationBanner: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    if (!currentUser || currentUser.role !== 'patient') return null;

    const daysInactive = getDaysSinceLastActivity(currentUser.id);

    if (daysInactive === null || daysInactive < 5) return null;

    return (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 shadow-sm">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3 text-amber-800">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm font-medium">
                        {t('aiChat.reminder.webappMessage', { username: currentUser.username, days: daysInactive })}
                    </p>
                </div>
            </div>
        </div>
    );
};
