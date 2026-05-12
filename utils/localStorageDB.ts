

import { StoredUser, User, QPVIIUserResult, QPVIIScores, UserExposureProgress, VideoDiscomfortRating, SimulatedEmail, QPVIIAnswers, Feedback, AiConsultation } from '../types.ts';
import { LOCAL_STORAGE_KEYS } from '../constants.ts';
import { hashPassword } from './hash.ts';

export function generatePatientCode(): string {
  return 'P-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Creates a replacer function for JSON.stringify to handle circular references.
 * This prevents "TypeError: Converting circular structure to JSON" errors by
 * replacing any already-seen object with `undefined`, effectively removing it.
 */
export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return; // Return `undefined` for circular reference, which JSON.stringify omits.
      }
      seen.add(value);
    }
    return value;
  };
};

// --- User Management ---

export function getUsers(): StoredUser[] {
  const usersJson = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
  if (!usersJson) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify([], getCircularReplacer()));
    } catch (e) {
      console.error('[DB] getUsers: Failed to initialize USERS in localStorage:', e);
    }
    return [];
  }
  try {
    const parsedUsers = JSON.parse(usersJson) as StoredUser[];
    return parsedUsers.map(user => ({
        ...user,
        email: user.email || `${user.username.replace(/\s+/g, '_')}@example.com` 
    }));
  } catch (error) {
    console.error("[DB] getUsers: Error parsing users from localStorage:", error);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify([], getCircularReplacer())); // Reset if corrupted
    } catch (e) {
      console.error('[DB] getUsers: Failed to reset USERS in localStorage after parsing error:', e);
    }
    return [];
  }
}

export function saveUser(user: StoredUser): boolean {
  let users: StoredUser[];
  try {
    users = getUsers(); // Get current state
  } catch (e) {
    console.error('[DB] saveUser: Critical error fetching users before save:', e);
    return false;
  }

  const existingUserIndex = users.findIndex(u => u.id === user.id);

  if (existingUserIndex !== -1) {
    users[existingUserIndex] = user;
  } else {
    if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) {
      console.warn("[DB] saveUser: Attempting to save NEW user with an existing username:", user.username);
      return false; 
    }
    if (user.email && users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      console.warn("[DB] saveUser: Attempting to save NEW user with an existing email:", user.email);
      return false;
    }
    users.push(user);
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users, getCircularReplacer()));
    return true;
  } catch (error) {
    console.error("[DB] saveUser: Error writing users to localStorage:", error);
    return false;
  }
}

export function findUserByUsername(username: string): StoredUser | undefined {
  const users = getUsers();
  return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(userId: string): StoredUser | undefined {
  const users = getUsers();
  return users.find(user => user.id === userId);
}


// --- QPV-II Results Management ---

export function getAllQPVIIResults(): QPVIIUserResult[] {
  const resultsJson = localStorage.getItem(LOCAL_STORAGE_KEYS.QPVII_RESULTS);
  if (!resultsJson) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.QPVII_RESULTS, JSON.stringify([]));
    } catch (e) {
      console.error('[DB] getAllQPVIIResults: Failed to initialize QPVII_RESULTS in localStorage:', e);
    }
    return [];
  }
  try {
    const parsedResults = JSON.parse(resultsJson) as QPVIIUserResult[];
    // Add default for evaluationType for backward compatibility with old data
    return parsedResults.map(r => ({ 
        ...r, 
        evaluationType: r.evaluationType || 'pre',
        answers: r.answers || {} // Ensure answers exist for old data compatibility
    }));
  } catch (error) {
    console.error("[DB] getAllQPVIIResults: Error parsing QPVII results from localStorage:", error);
     try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.QPVII_RESULTS, JSON.stringify([], getCircularReplacer()));
    } catch (e) {
      console.error('[DB] getAllQPVIIResults: Failed to reset QPVII_RESULTS in localStorage after parsing error:', e);
    }
    return [];
  }
}

export function saveQPVIIResultForUser(
  userId: string, 
  formName: string, 
  date: string, 
  scores: QPVIIScores,
  timestamp: number,
  answers: QPVIIAnswers, // Added parameter
  evaluationType: 'pre' | 'post' = 'pre',
  originalQpviiTimestamp?: number
): boolean {
  try {
    const allResults = getAllQPVIIResults();
    const newResult: QPVIIUserResult = {
      userId,
      formName,
      date,
      timestamp,
      scores,
      answers, // Store answers
      evaluationType,
      originalQpviiTimestamp,
    };
    allResults.push(newResult);
    localStorage.setItem(LOCAL_STORAGE_KEYS.QPVII_RESULTS, JSON.stringify(allResults, getCircularReplacer()));

    // NEW: Update user's last assessment date
    const user = findUserById(userId);
    if (user) {
        saveUser({ ...user, lastAssessmentDate: timestamp });
    }

    return true;
  } catch (error) {
    console.error("[DB] saveQPVIIResultForUser: Error writing QPVII result to localStorage:", error);
    return false;
  }
}

export function getQPVIIResultsForUser(userId: string): QPVIIUserResult[] {
  const allResults = getAllQPVIIResults();
  return allResults.filter(result => result.userId === userId).sort((a,b) => b.timestamp - a.timestamp);
}

export function hasQPVIIResults(userId: string): boolean {
  const allResults = getAllQPVIIResults();
  return allResults.some(result => result.userId === userId);
}

// --- Current User Session (Simplified) ---

export function setSessionUser(user: User | null): void {
    try {
        if (user) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify({
                id: user.id, 
                patientCode: user.patientCode,
                username: user.username, 
                email: user.email, 
                consentGiven: user.consentGiven,
                role: user.role,
                assistantName: user.assistantName,
                lastReminderSentDate: user.lastReminderSentDate,
                lastLoginDate: user.lastLoginDate,
                lastAssessmentDate: user.lastAssessmentDate
            }, getCircularReplacer()));
        } else {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
        }
    } catch (e) {
        console.error('[DB] setSessionUser: Failed to set CURRENT_USER in localStorage:', e);
    }
}

export function getSessionUser(): User | null {
    const userJson = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    if (!userJson) return null;
    try {
        const parsedUser = JSON.parse(userJson) as User;
        return {
            ...parsedUser,
            email: parsedUser.email || undefined,
            patientCode: parsedUser.patientCode || undefined,
            assistantName: parsedUser.assistantName || undefined,
            lastReminderSentDate: parsedUser.lastReminderSentDate || undefined,
            lastLoginDate: parsedUser.lastLoginDate || undefined,
            lastAssessmentDate: parsedUser.lastAssessmentDate || undefined
        };
    } catch (e) {
        console.error("[DB] getSessionUser: Error parsing session user:", e);
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
        } catch (removeError) {
            console.error('[DB] getSessionUser: Failed to remove corrupted CURRENT_USER from localStorage:', removeError);
        }
        return null;
    }
}

// --- User Exposure Progress Management ---

export function getAllUserExposureProgress(): UserExposureProgress[] {
  const progressJson = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_EXPOSURE_PROGRESS);
  if (!progressJson) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_EXPOSURE_PROGRESS, JSON.stringify([], getCircularReplacer()));
    } catch (e) {
      console.error('[DB] getAllUserExposureProgress: Failed to initialize USER_EXPOSURE_PROGRESS in localStorage:', e);
    }
    return [];
  }
  try {
    const allProgressEntries = JSON.parse(progressJson) as UserExposureProgress[];
    return allProgressEntries.map(entry => ({
      ...entry,
      discomfortRatings: entry.discomfortRatings || [],
      explanationShown: entry.explanationShown || false,
      programCompleted: entry.programCompleted || false,
      isReview: entry.isReview || false,
      reviewCompleted: entry.reviewCompleted || false,
      originalQpviiTimestamp: entry.originalQpviiTimestamp,
    }));
  } catch (error) {
    console.error("[DB] getAllUserExposureProgress: Error parsing user exposure progress from localStorage:", error);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_EXPOSURE_PROGRESS, JSON.stringify([], getCircularReplacer())); // Reset if corrupted
    } catch (e) {
      console.error('[DB] getAllUserExposureProgress: Failed to reset USER_EXPOSURE_PROGRESS after parsing error:', e);
    }
    return [];
  }
}

export function getUserExposureProgress(userId: string, qpviiTimestamp: number | null): UserExposureProgress | null {
  if (qpviiTimestamp === null) return null;
  const allProgress = getAllUserExposureProgress();
  const progress = allProgress.find(p => p.userId === userId && p.qpviiTimestamp === qpviiTimestamp);
  if (progress) {
    return {
      ...progress,
      discomfortRatings: progress.discomfortRatings || [], 
      explanationShown: progress.explanationShown || false, 
      programCompleted: progress.programCompleted || false,
      isReview: progress.isReview || false,
      reviewCompleted: progress.reviewCompleted || false,
      originalQpviiTimestamp: progress.originalQpviiTimestamp,
    };
  }
  return null;
}

export function saveUserExposureProgress(
  userId: string,
  qpviiTimestamp: number | null,
  videoSequence: string[],
  currentVideoIndex: number,
  completedVideoIds: string[],
  discomfortRatings: VideoDiscomfortRating[],
  explanationShown: boolean, 
  programCompleted?: boolean,
  isReview?: boolean,
  originalQpviiTimestamp?: number,
  reviewCompleted?: boolean
): boolean {
  try {
    let allProgress = getAllUserExposureProgress();
    const existingProgressIndex = allProgress.findIndex(p => p.userId === userId && p.qpviiTimestamp === qpviiTimestamp);

    const newProgressData: UserExposureProgress = {
      userId,
      qpviiTimestamp,
      videoSequence,
      currentVideoIndex,
      completedVideoIds,
      lastUpdated: Date.now(),
      discomfortRatings: discomfortRatings,
      explanationShown,
      programCompleted: programCompleted || false,
      isReview: isReview || false,
      reviewCompleted: reviewCompleted || false,
      originalQpviiTimestamp: originalQpviiTimestamp,
    };

    if (existingProgressIndex !== -1) {
      const oldProgress = allProgress[existingProgressIndex];
      newProgressData.programCompleted = programCompleted !== undefined ? programCompleted : (oldProgress.programCompleted || false);
      newProgressData.isReview = isReview !== undefined ? isReview : (oldProgress.isReview || false);
      newProgressData.reviewCompleted = reviewCompleted !== undefined ? reviewCompleted : (oldProgress.reviewCompleted || false);
      newProgressData.originalQpviiTimestamp = originalQpviiTimestamp !== undefined ? originalQpviiTimestamp : oldProgress.originalQpviiTimestamp;
      
      allProgress[existingProgressIndex] = newProgressData;
    } else {
      allProgress.push(newProgressData);
    }

    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_EXPOSURE_PROGRESS, JSON.stringify(allProgress, getCircularReplacer()));
    return true;
  } catch (error) {
    console.error("[DB] saveUserExposureProgress: Error writing user exposure progress to localStorage:", error);
    return false;
  }
}


export function clearUserExposureProgress(userId: string, qpviiTimestamp: number | null): boolean {
  try {
    let allProgress = getAllUserExposureProgress();
    const filteredProgress = allProgress.filter(p => !(p.userId === userId && p.qpviiTimestamp === qpviiTimestamp));
    
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_EXPOSURE_PROGRESS, JSON.stringify(filteredProgress, getCircularReplacer()));
    return true;
  } catch (error) {
    console.error("[DB] clearUserExposureProgress: Error updating user exposure progress in localStorage:", error);
    return false;
  }
}

// --- Utility to delete all user data ---
export function deleteAllUserData(): void {
  console.log("[DB] deleteAllUserData: Attempting to clear all user-related data...");
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USERS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.QPVII_RESULTS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_EXPOSURE_PROGRESS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SIMULATED_EMAILS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AI_CONSULTATIONS);
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOCAL_STORAGE_KEYS.LAST_VISITED_PATH_PREFIX)) {
            localStorage.removeItem(key);
        }
    }
  } catch (error) {
    console.error("[DB] deleteAllUserData: Error clearing data from localStorage:", error);
  }
}

// --- Simulated Email Management ---

export function getAllSimulatedEmails(): SimulatedEmail[] {
    const emailsJson = localStorage.getItem(LOCAL_STORAGE_KEYS.SIMULATED_EMAILS);
    if (!emailsJson) return [];
    try {
        return JSON.parse(emailsJson) as SimulatedEmail[];
    } catch (e) {
        console.error("[DB] getAllSimulatedEmails: Error parsing emails:", e);
        return [];
    }
}

export function saveSimulatedEmail(email: SimulatedEmail): boolean {
    try {
        const allEmails = getAllSimulatedEmails();
        allEmails.push(email);
        localStorage.setItem(LOCAL_STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify(allEmails, getCircularReplacer()));
        return true;
    } catch (e) {
        console.error("[DB] saveSimulatedEmail: Error saving email:", e);
        return false;
    }
}

export function getSimulatedEmailsForPatient(patientId: string): SimulatedEmail[] {
    const allEmails = getAllSimulatedEmails();
    return allEmails.filter(email => email.patientId === patientId).sort((a,b) => b.timestamp - a.timestamp);
}

// --- AI Consultation Management ---

export function getAllAiConsultations(): AiConsultation[] {
    const consultationsJson = localStorage.getItem(LOCAL_STORAGE_KEYS.AI_CONSULTATIONS);
    if (!consultationsJson) return [];
    try {
        return JSON.parse(consultationsJson) as AiConsultation[];
    } catch (e) {
        console.error("[DB] getAllAiConsultations: Error parsing consultations:", e);
        return [];
    }
}

export function saveAiConsultation(consultation: AiConsultation): boolean {
    try {
        const all = getAllAiConsultations();
        all.push(consultation);
        localStorage.setItem(LOCAL_STORAGE_KEYS.AI_CONSULTATIONS, JSON.stringify(all, getCircularReplacer()));
        return true;
    } catch (e) {
        console.error("[DB] saveAiConsultation: Error saving consultation:", e);
        return false;
    }
}

export function getAiConsultationsForTherapist(therapistId: string): AiConsultation[] {
    return getAllAiConsultations().filter(c => c.userId === therapistId).sort((a, b) => b.timestamp - a.timestamp);
}

export function getAiConsultationsByUserIds(userIds: string[]): AiConsultation[] {
    const userIdSet = new Set(userIds);
    return getAllAiConsultations().filter(c => userIdSet.has(c.userId)).sort((a, b) => b.timestamp - a.timestamp);
}

export function getAiConsultationsForPatient(patientId: string): AiConsultation[] {
    return getAllAiConsultations().filter(c => c.userId === patientId).sort((a, b) => b.timestamp - a.timestamp);
}

// --- Patient Data Management (for Therapist) ---

export function deletePatientData(patientId: string): void {
  // Delete user
  let users = getUsers();
  users = users.filter(u => u.id !== patientId);
  localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users, getCircularReplacer()));

  // Delete QPVII results
  let qpviiResults = getAllQPVIIResults();
  qpviiResults = qpviiResults.filter(r => r.userId !== patientId);
  localStorage.setItem(LOCAL_STORAGE_KEYS.QPVII_RESULTS, JSON.stringify(qpviiResults, getCircularReplacer()));

  // Delete exposure progress
  let exposureProgress = getAllUserExposureProgress();
  exposureProgress = exposureProgress.filter(p => p.userId !== patientId);
  localStorage.setItem(LOCAL_STORAGE_KEYS.USER_EXPOSURE_PROGRESS, JSON.stringify(exposureProgress, getCircularReplacer()));
  
  // Delete simulated emails
  let emails = getAllSimulatedEmails();
  emails = emails.filter(e => e.patientId !== patientId);
  localStorage.setItem(LOCAL_STORAGE_KEYS.SIMULATED_EMAILS, JSON.stringify(emails, getCircularReplacer()));
}

export async function resetPatientPassword(patientId: string): Promise<string | null> {
    const user = findUserById(patientId);
    if (!user) return null;

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashed = await hashPassword(tempPassword);

    const updatedUser: StoredUser = { ...user, hashedPassword: hashed };
    if (saveUser(updatedUser)) {
        return tempPassword;
    }
    return null;
}

export function getDaysSinceLastActivity(userId: string): number | null {
    const user = findUserById(userId);
    if (!user) return null;

    const activities: number[] = [];
    
    // 1. Exposure progress
    const allProgress = getAllUserExposureProgress().filter(p => p.userId === userId);
    if (allProgress.length > 0) {
        const mostRecentProgress = allProgress.reduce((prev, current) => 
            (prev.lastUpdated > current.lastUpdated) ? prev : current
        );
        activities.push(mostRecentProgress.lastUpdated);
    }

    // 2. Login date
    if (user.lastLoginDate) {
        activities.push(user.lastLoginDate);
    }

    // 3. Assessment date
    if (user.lastAssessmentDate) {
        activities.push(user.lastAssessmentDate);
    }

    if (activities.length === 0) return null;

    const mostRecent = Math.max(...activities);
    const diffMs = Date.now() - mostRecent;
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function getUsersByRole(role: User['role']): StoredUser[] {
    return getUsers().filter(u => u.role === role);
}

export function toggleUserNotifications(userId: string): boolean {
    const user = findUserById(userId);
    if (!user) return false;

    const currentPreferences = user.notificationPreferences || {
        enabled: true,
        reminders: true,
        newTasks: true,
        followUp: true,
        general: true,
        frequency: 'daily',
        startTime: '09:00',
        endTime: '21:00'
    };

    const updatedUser: StoredUser = {
        ...user,
        notificationPreferences: {
            ...currentPreferences,
            enabled: !currentPreferences.enabled
        }
    };

    return saveUser(updatedUser);
}

export function toggleUserOnboarding(userId: string): boolean {
    const user = findUserById(userId);
    if (!user) return false;

    const updatedUser: StoredUser = {
        ...user,
        onboardingEnabled: user.onboardingEnabled === false ? true : false
    };

    // If we re-enable onboarding, we might want to allow it to restart
    if (updatedUser.onboardingEnabled) {
        localStorage.removeItem(`cafft_onboarding_completed_${user.role}_${userId}`);
    }

    return saveUser(updatedUser);
}

export function getTherapistsForManager(managerId: string): StoredUser[] {
    return getUsers().filter(u => u.role === 'therapist' && u.managerId === managerId);
}

export function getPatientsForTherapist(therapistId: string): StoredUser[] {
    return getUsers().filter(u => u.role === 'patient' && u.therapistId === therapistId);
}

export function checkAndSendInactivityReminder(
    userId: string, 
    thresholdDays: number, 
    subject: string, 
    body: string
): boolean {
    const user = findUserById(userId);
    if (!user || user.role !== 'patient') return false;

    // Only send if we haven't sent one recently (to avoid spamming if they keep not logging in)
    const now = Date.now();
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000; // Hardcoded 5 day gap between reminders
    
    if (user.lastReminderSentDate && (now - user.lastReminderSentDate < fiveDaysMs)) {
        return false;
    }

    const daysInactive = getDaysSinceLastActivity(userId);
    if (daysInactive !== null && daysInactive >= thresholdDays) {
        // Send email
        const email: SimulatedEmail = {
            id: `rem_${now}_${userId}`,
            patientId: userId,
            type: 'reminder',
            subject: subject,
            body: body,
            status: 'sent',
            timestamp: now
        };
        
        if (saveSimulatedEmail(email)) {
            // Update user's last reminder date
            const updatedUser: StoredUser = { ...user, lastReminderSentDate: now };
            saveUser(updatedUser);
            return true;
        }
    }

    return false;
}

export function sendAdherenceRemindersToAllInactive(
    therapistId: string,
    thresholdDays: number,
    subject: string,
    bodyTemplate: string // Template like "Hola {username}, ..."
): number {
    const patients = getPatientsForTherapist(therapistId);
    let count = 0;

    patients.forEach(patient => {
        const body = bodyTemplate.replace('{username}', patient.username);
        if (checkAndSendInactivityReminder(patient.id, thresholdDays, subject, body)) {
            count++;
        }
    });

    return count;
}

// --- Feedback Management ---

export function getAllFeedback(): Feedback[] {
    const feedbackJson = localStorage.getItem(LOCAL_STORAGE_KEYS.FEEDBACK);
    if (!feedbackJson) return [];
    try {
        return JSON.parse(feedbackJson) as Feedback[];
    } catch (e) {
        console.error("[DB] getAllFeedback: Error parsing feedback:", e);
        return [];
    }
}

export function saveFeedback(feedback: Feedback): boolean {
    try {
        const allFeedback = getAllFeedback();
        allFeedback.push(feedback);
        localStorage.setItem(LOCAL_STORAGE_KEYS.FEEDBACK, JSON.stringify(allFeedback, getCircularReplacer()));
        return true;
    } catch (e) {
        console.error("[DB] saveFeedback: Error saving feedback:", e);
        return false;
    }
}