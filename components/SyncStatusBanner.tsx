import React, { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { dismissSyncFailures, getSyncStatus, subscribeSyncStatus } from '../services/dataStore';

/**
 * Tells the user when changes could not be saved to the server, and warns
 * before closing the tab while writes are still on their way.
 */
export const SyncStatusBanner: React.FC = () => {
    const { t } = useLanguage();
    const [status, setStatus] = useState(getSyncStatus());

    useEffect(() => subscribeSyncStatus(setStatus), []);

    useEffect(() => {
        if (status.pending === 0) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [status.pending]);

    if (status.failed === 0) return null;

    return (
        <div role="alert" className="bg-red-50 border-b border-red-200 py-3 px-4 shadow-sm">
            <div className="container mx-auto flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-red-800">{t('common.syncFailed')}</p>
                <button
                    onClick={dismissSyncFailures}
                    className="text-sm font-semibold text-red-800 underline flex-shrink-0"
                >
                    {t('common.dismiss')}
                </button>
            </div>
        </div>
    );
};
