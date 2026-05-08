

import { ExposureVideo, QPVIIScores, UserExposureProgress, ExposureSceneKey, QPVIIAnswers } from '../types';
import { 
    EXPOSURE_VIDEOS, 
    CANONICAL_FLIGHT_STAGES_ORDER,
    PHASE_SPECIFIC_ITEMS
} from '../constants';


/**
 * Calculates the average anxiety score for each exposure phase.
 * @param answers The QPV-II answers.
 * @returns A mapping of scene keys to their average scores (1-9).
 */
export const calculatePhaseScores = (answers: QPVIIAnswers | undefined): Record<string, number> => {
    if (!answers) return {};
    
    const scores: Record<string, number> = {};
    
    CANONICAL_FLIGHT_STAGES_ORDER.forEach(stageKey => {
        const itemIndices = PHASE_SPECIFIC_ITEMS[stageKey];
        let totalScore = 0;
        let answeredCount = 0;

        if (itemIndices && itemIndices.length > 0) {
            itemIndices.forEach(index => {
                const val = answers[index];
                if (val !== null && val !== undefined) {
                    totalScore += val;
                    answeredCount++;
                }
            });
        }
        scores[stageKey] = answeredCount > 0 ? totalScore / answeredCount : 0;
    });
    
    return scores;
};

export const determineVideoSequence = (answers: QPVIIAnswers | undefined): ExposureVideo[] => {
    // If no answers are provided (legacy data), we cannot accurately determine the new granular hierarchy.
    // In a real production migration, we might use a fallback strategy, but here we return an empty array
    // or handle it gracefully in the UI by prompting for a re-evaluation if needed.
    if (!answers) {
        console.warn("determineVideoSequence: No answers provided. Cannot generate granular hierarchy.");
        return [];
    }

    // 1. Calculate Average Score per Exposure Phase
    // Instead of using broad subscale totals, we now calculate the anxiety level for 
    // specific phases (Takeoff, Landing, etc.) by averaging the scores of the 
    // specific items related to that phase.
    const phasesWithScores = CANONICAL_FLIGHT_STAGES_ORDER.map(stageKey => {
        const itemIndices = PHASE_SPECIFIC_ITEMS[stageKey];
        
        let totalScore = 0;
        let answeredCount = 0;

        if (itemIndices && itemIndices.length > 0) {
            itemIndices.forEach(index => {
                const answerValue = answers[index];
                if (answerValue !== null && answerValue !== undefined) {
                    totalScore += answerValue;
                    answeredCount++;
                }
            });
        }

        // Calculate average. If no items answered for this phase (unlikely if form is valid), default to 0.
        const averageScore = answeredCount > 0 ? totalScore / answeredCount : 0;

        return { stageKey, averageScore };
    });

    // 2. Sort Phases by Anxiety Level (Lowest to Highest)
    // We sort based on the calculated average score. 
    // If scores are very close (tie), we use the canonical flight order as a tie-breaker.
    phasesWithScores.sort((a, b) => {
        // Use a small epsilon for float comparison
        if (Math.abs(a.averageScore - b.averageScore) > 0.001) {
            return a.averageScore - b.averageScore;
        }
        // Tie-breaker: keep canonical order (logical flow of flight)
        return CANONICAL_FLIGHT_STAGES_ORDER.indexOf(a.stageKey) - CANONICAL_FLIGHT_STAGES_ORDER.indexOf(b.stageKey);
    });

    // 3. Build the Video Sequence
    // For each sorted phase, we pick the video with the lowest intensity that belongs to that phase.
    // This ensures the user starts with the 'easiest' video of their 'easiest' phase.
    const finalSequence: ExposureVideo[] = [];
    const addedVideoIds = new Set<string>();

    for (const { stageKey } of phasesWithScores) {
        // Find videos belonging to this phase
        const videosForStage = EXPOSURE_VIDEOS
            .filter(v => v.relatedArea === stageKey) 
            .sort((v1, v2) => v1.intensity - v2.intensity); 

        if (videosForStage.length > 0) {
            // Select the lowest intensity video for this phase.
            // In CAFFT, typically one representative video per phase is added to the initial hierarchy.
            const video = videosForStage[0];
            if (!addedVideoIds.has(video.id)) {
                finalSequence.push(video);
                addedVideoIds.add(video.id);
            }
        }
    }
    
    return finalSequence;
};

export const isExposureFullyCompleted = (
    progress: UserExposureProgress | null, 
    fullVideoSequence: ExposureVideo[]
): boolean => {
    if (!progress || !fullVideoSequence || fullVideoSequence.length === 0) {
        return false;
    }

    // Check if all video IDs from the full sequence are present in completedVideoIds
    for (const video of fullVideoSequence) {
        if (!progress.completedVideoIds.includes(video.id)) {
            return false; 
        }
    }
    
    // Also, ensure the currentVideoIndex reflects that all videos have been processed.
    if (progress.currentVideoIndex < fullVideoSequence.length) {
      return false;
    }
    
    return true; 
};