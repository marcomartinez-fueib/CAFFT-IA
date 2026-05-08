
import { StoredUser, QPVIIScores, UserExposureProgress, VideoDiscomfortRating, QPVIIAnswers } from '../types';
import { saveUser, saveQPVIIResultForUser, saveUserExposureProgress, findUserByUsername } from './localStorageDB';
import { hashPassword } from './hash';

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const createPatient = async (username: string, email: string, therapistId: string): Promise<StoredUser> => {
    const hashedPassword = await hashPassword('clauacces'); // All simulated users have the same simple password
    const user: StoredUser = {
        id: crypto.randomUUID(),
        username,
        email,
        hashedPassword,
        consentGiven: true,
        role: 'patient',
        therapistId,
    };
    saveUser(user);
    return user;
};

const createQPVII = (user: StoredUser, scores: QPVIIScores, date: Date, type: 'pre' | 'post' = 'pre', originalTimestamp?: number): number => {
    const timestamp = date.getTime();
    
    // Generate mock answers so determinesVideoSequence doesn't crash.
    const mockAnswers: QPVIIAnswers = {};
    for(let i=0; i<=30; i++) mockAnswers[i] = Math.max(1, Math.min(9, Math.round(scores.total / 31)));

    saveQPVIIResultForUser(
        user.id,
        user.username,
        toISODateString(date),
        scores,
        timestamp,
        mockAnswers,
        type,
        originalTimestamp
    );
    return timestamp;
};

const createExposureSession = (user: StoredUser, qpviiTimestamp: number, ratings: {videoId: string, rating: number}[], programCompleted: boolean = false) => {
    const videoSequence = ratings.map(r => r.videoId);
    const completedVideoIds = ratings.filter(r => r.rating <= 2).map(r => r.videoId);

    const discomfortRatings: VideoDiscomfortRating[] = ratings.map((r, i) => ({
        id: r.videoId,
        rating: r.rating,
        qpviiTimestamp,
        videoTimestamp: qpviiTimestamp + i * 60000 // Stagger ratings by 1 minute
    }));

    saveUserExposureProgress(
        user.id,
        qpviiTimestamp,
        videoSequence,
        ratings.length, // Assume they've passed all attempted videos for simplicity
        completedVideoIds,
        discomfortRatings,
        true, // Explanation shown
        programCompleted
    );
};

export const seedSimulatedPatients = async () => {
    // 1. Seed Superadmin
    const superadminPassword = await hashPassword('clauacces');
    const superadmin: StoredUser = {
        id: 'superadmin-001',
        username: 'admin',
        email: 'admin@uib.es',
        hashedPassword: superadminPassword,
        consentGiven: true,
        role: 'superadmin',
    };
    saveUser(superadmin);

    // 2. Seed Manager
    const managerPassword = await hashPassword('clauacces');
    const manager: StoredUser = {
        id: 'manager-001',
        username: 'gestor',
        email: 'gestor@uib.es',
        hashedPassword: managerPassword,
        consentGiven: true,
        role: 'manager',
    };
    saveUser(manager);

    // 3. Seed Therapist (terapeuta) assigned to manager
    let therapist = findUserByUsername('terapeuta');
    if (!therapist) {
        const hashedPassword = await hashPassword('clauacces');
        therapist = {
            id: 'therapist-terapeuta-001',
            username: 'terapeuta',
            email: 'terapeuta@uib.es',
            hashedPassword,
            consentGiven: true,
            role: 'therapist',
            managerId: manager.id,
        };
        saveUser(therapist);
    } else {
        // Ensure therapist is linked to manager for testing
        therapist.managerId = manager.id;
        saveUser(therapist);
    }

    const therapistId = therapist.id;
    const today = new Date();

    // --- Patient 1: Anna - Good Progress, Fully Recovered ---
    const anna = await createPatient('Anna', 'anna@example.com', therapistId);
    const annaPreScores: QPVIIScores = { total: 180, malestarGeneral: 8, subPreparatius: 60, subVicari: 52, subVol: 60 };
    const annaPreTimestamp = createQPVII(anna, annaPreScores, addDays(today, -30));
    createExposureSession(anna, annaPreTimestamp, [
        { videoId: 'ev001', rating: 7 }, { videoId: 'ev001', rating: 4 }, { videoId: 'ev001', rating: 2 },
        { videoId: 'ev002', rating: 8 }, { videoId: 'ev002', rating: 5 }, { videoId: 'ev002', rating: 3 }, { videoId: 'ev002', rating: 2 },
        { videoId: 'ev004', rating: 9 }, { videoId: 'ev004', rating: 6 }, { videoId: 'ev004', rating: 4 }, { videoId: 'ev004', rating: 2 },
    ], true); // Program completed
    const annaPostScores: QPVIIScores = { total: 45, malestarGeneral: 2, subPreparatius: 15, subVicari: 10, subVol: 18 };
    createQPVII(anna, annaPostScores, addDays(today, -1), 'post', annaPreTimestamp);

    // --- Patient 2: Marc - Stalled Habituation ---
    const marc = await createPatient('Marc', 'marc@example.com', therapistId);
    const marcPreScores: QPVIIScores = { total: 210, malestarGeneral: 9, subPreparatius: 70, subVicari: 65, subVol: 66 };
    const marcPreTimestamp = createQPVII(marc, marcPreScores, addDays(today, -20));
    createExposureSession(marc, marcPreTimestamp, [
        { videoId: 'ev001', rating: 8 }, { videoId: 'ev001', rating: 5 }, { videoId: 'ev001', rating: 2 },
        { videoId: 'ev004', rating: 9 }, { videoId: 'ev004', rating: 9 }, { videoId: 'ev004', rating: 8 }, // Stalled
    ], false);

    // --- Patient 3: Carla - High Vicarious Anxiety ---
    const carla = await createPatient('Carla', 'carla@example.com', therapistId);
    const carlaPreScores: QPVIIScores = { total: 130, malestarGeneral: 6, subPreparatius: 30, subVicari: 80, subVol: 14 };
    const carlaPreTimestamp = createQPVII(carla, carlaPreScores, addDays(today, -15));
    createExposureSession(carla, carlaPreTimestamp, [
        { videoId: 'ev008', rating: 9 }, { videoId: 'ev008', rating: 7 }, { videoId: 'ev008', rating: 6 },
        { videoId: 'ev001', rating: 5 }, { videoId: 'ev001', rating: 2 },
    ], false);

    // --- Patient 4: Pau - High Anticipatory Anxiety, Quick Progress ---
    const pau = await createPatient('Pau', 'pau@example.com', therapistId);
    const pauPreScores: QPVIIScores = { total: 165, malestarGeneral: 7, subPreparatius: 95, subVicari: 20, subVol: 43 };
    const pauPreTimestamp = createQPVII(pau, pauPreScores, addDays(today, -10));
    createExposureSession(pau, pauPreTimestamp, [
        { videoId: 'ev008', rating: 4 }, { videoId: 'ev008', rating: 2 },
        { videoId: 'ev001', rating: 8 }, { videoId: 'ev001', rating: 6 }, { videoId: 'ev001', rating: 4 }, { videoId: 'ev001', rating: 2 },
        { videoId: 'ev002', rating: 6 }, { videoId: 'ev002', rating: 3 }, { videoId: 'ev002', rating: 1 },
    ], false);

    // --- Patient 5: Laura - Completed but Only "Improved" ---
    const laura = await createPatient('Laura', 'laura@example.com', therapistId);
    const lauraPreScores: QPVIIScores = { total: 195, malestarGeneral: 8, subPreparatius: 65, subVicari: 60, subVol: 62 };
    const lauraPreTimestamp = createQPVII(laura, lauraPreScores, addDays(today, -45));
    createExposureSession(laura, lauraPreTimestamp, [
        { videoId: 'ev001', rating: 7 }, { videoId: 'ev001', rating: 3 },
        { videoId: 'ev002', rating: 8 }, { videoId: 'ev002', rating: 4 },
        { videoId: 'ev004', rating: 8 }, { videoId: 'ev004', rating: 5 },
        { videoId: 'ev005', rating: 7 }, { videoId: 'ev005', rating: 4 },
    ], true); // Program marked as completed
    // Post score is lower, but still high enough to not be "Recovered"
    const lauraPostScores: QPVIIScores = { total: 95, malestarGeneral: 4, subPreparatius: 35, subVicari: 25, subVol: 31 };
    createQPVII(laura, lauraPostScores, addDays(today, -5), 'post', lauraPreTimestamp);

};
