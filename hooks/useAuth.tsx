




import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { AuthContextType, User, StoredUser, ExposureSceneKey, InformedConsentMetadata } from '../types.ts';
import { hashPassword, verifyPassword } from '../utils/hash.ts';
import { 
    getUsers, 
    saveUser, 
    findUserByUsername, 
    setSessionUser, 
    getSessionUser, 
    findUserById, 
    getQPVIIResultsForUser,
    getAllUserExposureProgress,
    generatePatientCode
} from '../utils/localStorageDB.ts';
import { determineVideoSequence, isExposureFullyCompleted } from '../utils/exposureUtils.ts';
import { EXPOSURE_VIDEOS, CANONICAL_FLIGHT_STAGES_ORDER } from '../constants.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); 

  useEffect(() => {
    const seedDefaultUsers = async () => {
      let users = getUsers();
      
      // Seed Patient
      const testUsername = 'testuser';
      if (!users.find(u => u.username.toLowerCase() === testUsername)) {
        console.log(`Seeding default test user '${testUsername}'...`);
        const hashedPassword = await hashPassword('password');
        saveUser({ 
          id: crypto.randomUUID(), 
          patientCode: generatePatientCode(),
          username: testUsername, 
          email: `test@example.com`, 
          hashedPassword, 
          consentGiven: true, 
          role: 'patient' 
        });
        users = getUsers(); // refresh users array
      }

      // Seed Therapist (terapeuta)
      const therapistUsername = 'terapeuta';
      if (!users.find(u => u.username.toLowerCase() === therapistUsername)) {
        console.log(`Seeding default therapist '${therapistUsername}'...`);
        const hashedPassword = await hashPassword('clauacces');
        saveUser({ 
            id: 'therapist-terapeuta-001', 
            username: therapistUsername, 
            email: `terapeuta@uib.es`, 
            hashedPassword, 
            consentGiven: true, 
            role: 'therapist' 
        });
      }
    };

    // Run seeding and then initialize the session
    seedDefaultUsers().then(() => {
      const sessionUser = getSessionUser();
      if (sessionUser && sessionUser.id) {
          const fullUserFromDB = findUserById(sessionUser.id);
          if (fullUserFromDB) {
               const { hashedPassword, ...userToSetInState } = fullUserFromDB;
               setCurrentUser(userToSetInState as User);
          } else {
              setSessionUser(null); 
              setCurrentUser(null); 
          }
      } else {
        setCurrentUser(null); 
      }
      setLoading(false);
    });
  }, []);


  const login = useCallback(async (username: string, passwordAttempt: string): Promise<{ success: boolean; redirect?: { path: string; state?: any }; errorKey?: string; }> => {
    setLoading(true);
    const storedUser = findUserByUsername(username);
    if (storedUser && storedUser.hashedPassword) {
      const isMatch = await verifyPassword(passwordAttempt, storedUser.hashedPassword);
      if (isMatch) {
        // Update user activity dates in database
        const now = Date.now();
        const updatedStoredUser: StoredUser = { ...storedUser, lastLoginDate: now };
        saveUser(updatedStoredUser);

        const { hashedPassword, ...userToSet } = updatedStoredUser;
        setCurrentUser(userToSet as User);
        setSessionUser(userToSet as User);
        
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
        const allUserProgress = getAllUserExposureProgress()
            .filter(p => p.userId === storedUser.id)
            .sort((a, b) => (b.qpviiTimestamp || b.lastUpdated) - (a.qpviiTimestamp || a.lastUpdated));

        const userQpviiResults = getQPVIIResultsForUser(storedUser.id); // Already sorted by timestamp desc

        // 1. Check for an active, incomplete REVIEW session. This takes absolute precedence.
        const activeReviewSession = allUserProgress.find(p => p.isReview && !p.programCompleted);
        if (activeReviewSession) {
            const sceneSet = new Set<ExposureSceneKey>();
            (activeReviewSession.videoSequence || []).forEach(videoId => {
                const video = EXPOSURE_VIDEOS.find(v => v.id === videoId);
                if (video) {
                    sceneSet.add(video.relatedArea);
                }
            });
            const derivedReviewScenes = Array.from(sceneSet).sort((a, b) => CANONICAL_FLIGHT_STAGES_ORDER.indexOf(a) - CANONICAL_FLIGHT_STAGES_ORDER.indexOf(b));

            setLoading(false);
            return {
                success: true,
                redirect: {
                    path: '/exposure',
                    state: {
                        reviewScenes: derivedReviewScenes,
                        reviewSessionTimestamp: activeReviewSession.qpviiTimestamp,
                        originalQpviiTimestamp: activeReviewSession.originalQpviiTimestamp,
                    }
                }
            };
        }

        // 2. Check for an active, incomplete STANDARD session.
        const activeStandardSession = allUserProgress.find(p => !p.isReview && !p.programCompleted);
        if (activeStandardSession) {
            const qpviiResult = userQpviiResults.find(r => r.timestamp === activeStandardSession.qpviiTimestamp);
            if (qpviiResult) {
                const scores = qpviiResult.scores;
                const answers = qpviiResult.answers;
                // Pass answers for correct sequence determination
                const currentVideoSequence = determineVideoSequence(answers);

                if (isExposureFullyCompleted(activeStandardSession, currentVideoSequence)) {
                    // Exposure is complete, user needs to make a decision. Redirect to LastSessionPage.
                    setLoading(false);
                    return {
                        success: true,
                        redirect: {
                            path: '/last-session',
                            state: { 
                                qpviiTimestamp: activeStandardSession.qpviiTimestamp 
                            }
                        }
                    };
                }

                // Mid-exposure, resume at hierarchy.
                setLoading(false);
                return {
                    success: true,
                    redirect: {
                        path: '/exposure-hierarchy',
                        state: { 
                            qpviiTimestamp: activeStandardSession.qpviiTimestamp, 
                            scores: scores,
                            answers: answers // Pass answers
                        }
                    }
                };
            }
        }

        // 3. No active sessions. Check if there's a new QPV-II evaluation that hasn't been started yet.
        if (userQpviiResults.length > 0) {
            const latestQpvii = userQpviiResults[0];
            const hasProgressRecord = allUserProgress.some(p => p.qpviiTimestamp === latestQpvii.timestamp);

            if (!hasProgressRecord) {
                // This is a new evaluation cycle waiting to be started.
                setLoading(false);
                return {
                    success: true,
                    redirect: {
                        path: '/exposure-hierarchy',
                        state: {
                            qpviiTimestamp: latestQpvii.timestamp,
                            scores: latestQpvii.scores,
                            answers: latestQpvii.answers
                        }
                    }
                };
            }
        }

        // 4. No active sessions and no new evaluations. Check if the latest state was a completed program.
        const latestProgress = allUserProgress.length > 0 ? allUserProgress[0] : null;
        if (latestProgress && latestProgress.programCompleted) {
            setLoading(false);
            return {
                success: true,
                redirect: {
                    path: '/celebration',
                    state: { qpviiTimestamp: latestProgress.qpviiTimestamp }
                }
            };
        }
        
        // 5. Fallback: New user with no data at all.
        setLoading(false);
        return { success: true, redirect: { path: '/cafft-intro' } };
      }
    }
    setLoading(false);
    return { success: false, errorKey: 'auth.invalidCredentialsError' };
  }, []);

  const register = useCallback(async (username: string, email: string, passwordAttempt: string, consent: boolean, informedConsentMetadata?: InformedConsentMetadata): Promise<{ success: boolean; errorKey?: string }> => {
    setLoading(true);
    const users = getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      setLoading(false);
      return { success: false, errorKey: 'auth.usernameTakenError' }; 
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setLoading(false);
      return { success: false, errorKey: 'auth.emailTakenError' };
    }

    const hashedPassword = await hashPassword(passwordAttempt);
    const newUser: StoredUser = { 
      id: crypto.randomUUID(), 
      patientCode: generatePatientCode(),
      username, 
      email,
      hashedPassword, 
      consentGiven: consent,
      role: 'patient',
      informedConsentMetadata
    };
    
    const successSaving = saveUser(newUser);
    setLoading(false);
    if (!successSaving) {
        return { success: false, errorKey: 'auth.registrationFailedError' };
    }
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setSessionUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;
    
    const storedUser = findUserById(currentUser.id);
    if (!storedUser) return false;
    
    const updatedUser: StoredUser = {
      ...storedUser,
      ...updates as any // Be careful with casting, but User/StoredUser are compatible on these fields
    };
    
    const success = saveUser(updatedUser);
    if (success) {
      const newUserState: User = {
        ...currentUser,
        ...updates
      };
      setCurrentUser(newUserState);
      setSessionUser(newUserState);
      return true;
    }
    return false;
  }, [currentUser]);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; errorKey?: string; messageKey?: string }> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    setLoading(false);
    return { success: true, messageKey: 'auth.resetLinkSentSuccess' };
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<{ success: boolean; errorKey?: string; messageKey?: string }> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    setLoading(false);
    if (token === "valid_token_from_email_simulation") { 
        return { success: true, messageKey: 'auth.passwordResetSuccess' };
    }
    return { success: false, errorKey: 'auth.invalidOrExpiredTokenError' };
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; errorKey?: string; messageKey?: string }> => {
    if (!currentUser || !currentUser.id) return { success: false, errorKey: 'auth.loginFailedError' };
    setLoading(true);
    const storedUser = findUserById(currentUser.id);

    if (storedUser && storedUser.hashedPassword) {
        const isMatch = await verifyPassword(currentPassword, storedUser.hashedPassword);
        if (isMatch) {
            const newHashedPassword = await hashPassword(newPassword);
            const updatedUser: StoredUser = { ...storedUser, hashedPassword: newHashedPassword };
            if(saveUser(updatedUser)){
              setLoading(false);
              return { success: true, messageKey: 'auth.changePasswordSuccess' };
            } else {
              setLoading(false);
              return { success: false, errorKey: 'auth.changePasswordError' }; 
            }
        } else {
            setLoading(false);
            return { success: false, errorKey: 'auth.changePasswordError' }; 
        }
    }
    setLoading(false);
    return { success: false, errorKey: 'auth.changePasswordError' }; 
  }, [currentUser]);


  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, loading, requestPasswordReset, resetPassword, changePassword, updateUser }}>
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