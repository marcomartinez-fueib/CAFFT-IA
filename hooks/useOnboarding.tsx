
import React, { createContext, useContext, useState } from 'react';
import { findUserById, completeOnboardingTour } from '../services/dataStore';

interface OnboardingContextType {
    isTourActive: boolean;
    tourType: 'patient' | 'therapist';
    startTour: (type?: 'patient' | 'therapist', userId?: string, isManual?: boolean) => void;
    stopTour: () => void;
    hasCompletedTour: boolean;
    checkTourStatus: (userId: string, role: 'patient' | 'therapist') => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isTourActive, setIsTourActive] = useState(false);
    const [tourType, setTourType] = useState<'patient' | 'therapist'>('patient');
    const [hasCompletedTour, setHasCompletedTour] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const checkTourStatus = (userId: string, role: 'patient' | 'therapist') => {
        setCurrentUserId(userId);
        
        const user = findUserById(userId);
        if (user && user.onboardingEnabled === false) {
            setHasCompletedTour(true);
            return true;
        }

        // Stored on the account, so a tour seen on one device is not shown again on another.
        const completed = (user?.onboardingCompleted ?? []).includes(role);
        setHasCompletedTour(completed);
        return completed;
    };

    const startTour = (type: 'patient' | 'therapist' = 'patient', userId?: string, isManual: boolean = false) => {
        const id = userId || currentUserId;
        if (id) {
            setCurrentUserId(id);
            if (!isManual) {
                const user = findUserById(id);
                if (user && user.onboardingEnabled === false) {
                    return;
                }
            }
        }
        
        setTourType(type);
        setIsTourActive(true);
        // Don't auto-update status if it's a manual restart
        if (id && !isManual) checkTourStatus(id, type);
    };

    const stopTour = () => {
        setIsTourActive(false);
        setHasCompletedTour(true);
        if (currentUserId) {
            void completeOnboardingTour(tourType);
        }
    };

    return (
        <OnboardingContext.Provider value={{ isTourActive, tourType, startTour, stopTour, hasCompletedTour, checkTourStatus }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
