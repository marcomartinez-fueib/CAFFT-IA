
import { getUsers, getAllQPVIIResults, getAllUserExposureProgress } from './localStorageDB';
import { EXPOSURE_VIDEOS, CANONICAL_FLIGHT_STAGES_ORDER } from '../constants';
import { determineVideoSequence, isExposureFullyCompleted } from './exposureUtils';
import { QPVIIUserResult, UserExposureProgress } from '../types';

/**
 * Converts an array of objects to a CSV string.
 * @param data The array of objects.
 * @param headers The headers for the CSV file.
 * @returns A string in CSV format.
 */
function convertToCSV(data: any[], headers: string[]): string {
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : row[header];
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Triggers a download of a CSV file in the browser.
 * @param csvString The CSV content.
 * @param filename The name of the file to download.
 */
function downloadCSV(csvString: string, filename: string): void {
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.position = 'absolute';
        link.style.left = '-9999px';
        link.style.top = '-9999px';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
}

// Constants for Jacobson & Truax calculations based on the provided PDF
const QPVII_RELIABILITY = 0.97;
const NON_PHOBIC_MEAN = 65.24;
const NON_PHOBIC_SD = 30.79;
const AVERAGE_VIDEO_DURATION_SECONDS = 180; // 3 minutes

/**
 * Formats a duration in seconds to an HH:MM:SS string.
 * @param totalSeconds The total seconds to format.
 * @returns A string in HH:MM:SS format.
 */
function formatSecondsToHMS(totalSeconds: number): string {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return '00:00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Determines the current status of a patient based on their QPV-II and exposure data.
 * @param patientId The ID of the patient.
 * @param allQpvii All QPV-II results.
 * @param allProgress All exposure progress records.
 * @returns A string representing the patient's status.
 */
function getPatientStatus(
    patientId: string, 
    allQpvii: QPVIIUserResult[], 
    allProgress: UserExposureProgress[]
): string {
    const patientProgress = allProgress.filter(p => p.userId === patientId);
    const patientQpvii = allQpvii.filter(r => r.userId === patientId).sort((a,b)=>b.timestamp - a.timestamp);
    if (patientQpvii.length === 0) return 'new';
    
    const latestQpviiTimestamp = patientQpvii[0].timestamp;
    const latestProgress = patientProgress.find(p => p.qpviiTimestamp === latestQpviiTimestamp);

    if (!latestProgress) return 'ready';
    
    if (latestProgress.programCompleted) return 'completed';
    
    const sequence = determineVideoSequence(patientQpvii[0].answers);
    if (isExposureFullyCompleted(latestProgress, sequence)) {
        return 'needs_review';
    }
    
    return 'in_progress';
}


/**
 * Exports all clinical data to a single denormalized CSV file, with one row per patient.
 * This summary includes pre/post QPVII scores, reliable change index (ICF),
 * clinical significance (IMCS), and aggregated exposure session data.
 * @param anonymize If true, replaces user IDs with generic participant IDs.
 */
export function exportDataToCSV(anonymize: boolean): void {
    const allUsers = getUsers();
    const allQpviiResults = getAllQPVIIResults();
    const allExposureProgress = getAllUserExposureProgress();

    const patientUsers = allUsers.filter(u => u.role === 'patient');

    if (patientUsers.length === 0) {
        alert('No patient data found to export.');
        return;
    }

    let userIdMap: Map<string, string> | null = null;
    if (anonymize) {
        userIdMap = new Map<string, string>();
        let participantCounter = 1;
        patientUsers.forEach(user => {
            userIdMap!.set(user.id, `participant_${participantCounter++}`);
        });
    }

    const allPatientRows: any[] = [];

    patientUsers.forEach(user => {
        const participantId = anonymize && userIdMap ? userIdMap.get(user.id)! : user.id;
        const rowData: any = { participant_id: participantId };

        const patientQpviiResults = allQpviiResults
            .filter(r => r.userId === user.id)
            .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending by time

        const preEval = patientQpviiResults[0]; // First evaluation
        const postEval = patientQpviiResults.length > 1 ? patientQpviiResults[patientQpviiResults.length - 1] : null; // Last evaluation
        
        const patientExposureSessions = allExposureProgress
            .filter(p => p.userId === user.id)
            .sort((a, b) => (a.qpviiTimestamp || a.lastUpdated) - (b.qpviiTimestamp || b.lastUpdated));

        // --- NEW METRICS ---
        const lastActivityTimestamp = patientExposureSessions.length > 0 
            ? Math.max(...patientExposureSessions.map(p => p.lastUpdated)) 
            : null;
        rowData.last_activity_date = lastActivityTimestamp ? new Date(lastActivityTimestamp).toISOString() : '';
        rowData.patient_status = getPatientStatus(user.id, allQpviiResults, allExposureProgress);
        rowData.did_review_session = patientExposureSessions.some(p => p.isReview) ? 'yes' : 'no';

        if (preEval) {
            rowData.generated_video_sequence = determineVideoSequence(preEval.answers).map(v => v.id).join('; ');
        }
        
        const allRatings: { rating: number }[] = [];
        const uniqueCompletedVideos = new Set<string>();
        
        patientExposureSessions.forEach(session => {
            (session.discomfortRatings || []).forEach(rating => allRatings.push({ rating: rating.rating }));
            (session.completedVideoIds || []).forEach(videoId => uniqueCompletedVideos.add(videoId));
        });
        
        const totalExposureSeconds = allRatings.length * AVERAGE_VIDEO_DURATION_SECONDS;
        rowData.total_exposure_time_hms = formatSecondsToHMS(totalExposureSeconds);
        rowData.num_unique_videos_completed = uniqueCompletedVideos.size;

        // --- QPV-II & Clinical Significance ---
        if (preEval) {
            rowData.qpvii_pre_date = preEval.date;
            rowData.qpvii_pre_score_total = preEval.scores.total;
            rowData.qpvii_pre_score_malestar_general = preEval.scores.malestarGeneral;
            rowData.qpvii_pre_score_preparatius = preEval.scores.subPreparatius;
            rowData.qpvii_pre_score_vicari = preEval.scores.subVicari;
            rowData.qpvii_pre_score_vol = preEval.scores.subVol;
        }

        if (postEval) {
            rowData.qpvii_post_date = postEval.date;
            rowData.qpvii_post_score_total = postEval.scores.total;
            rowData.qpvii_post_score_malestar_general = postEval.scores.malestarGeneral;
            rowData.qpvii_post_score_preparatius = postEval.scores.subPreparatius;
            rowData.qpvii_post_score_vicari = postEval.scores.subVicari;
            rowData.qpvii_post_score_vol = postEval.scores.subVol;
        }

        if (preEval && postEval) {
            const SE = NON_PHOBIC_SD * Math.sqrt(1 - QPVII_RELIABILITY);
            if (SE > 0) {
                const icf = (preEval.scores.total - postEval.scores.total) / SE;
                rowData.icf_total_score = icf.toFixed(4);

                const cutoff = NON_PHOBIC_MEAN + 2 * NON_PHOBIC_SD;
                if (icf > 1.96) {
                    rowData.imcs_category = postEval.scores.total < cutoff ? 'Recuperat' : 'Millorat';
                } else if (icf < -1.96) {
                    rowData.imcs_category = 'Empitjorat';
                } else {
                    rowData.imcs_category = 'Manteniment';
                }
            }
        }
        
        // --- Exposure Details ---
        rowData.num_exposure_sessions = patientExposureSessions.length;
        rowData.exposure_session_timestamps = patientExposureSessions.map(p => p.qpviiTimestamp || p.lastUpdated).join('; ');
        
        const sceneDetails: any = {};
        CANONICAL_FLIGHT_STAGES_ORDER.forEach(sceneKey => {
            sceneDetails[sceneKey] = { views: 0, ratings: [], totalRating: 0 };
        });

        patientExposureSessions.forEach(session => {
            (session.discomfortRatings || []).forEach(rating => {
                const videoInfo = EXPOSURE_VIDEOS.find(v => v.id === rating.id);
                if (videoInfo) {
                    const sceneKey = videoInfo.relatedArea;
                    if (sceneDetails[sceneKey]) {
                        sceneDetails[sceneKey].views++;
                        sceneDetails[sceneKey].ratings.push(rating.rating);
                        sceneDetails[sceneKey].totalRating += rating.rating;
                    }
                }
            });
        });

        rowData.total_video_views = allRatings.length;
        rowData.avg_discomfort_rating_overall = allRatings.length > 0
            ? (allRatings.reduce((a, b) => a + b.rating, 0) / allRatings.length).toFixed(4)
            : '';

        CANONICAL_FLIGHT_STAGES_ORDER.forEach(sceneKey => {
            const details = sceneDetails[sceneKey];
            rowData[`scene_${sceneKey}_num_views`] = details.views;
            rowData[`scene_${sceneKey}_avg_rating`] = details.views > 0
                ? (details.totalRating / details.views).toFixed(4)
                : '';
            rowData[`scene_${sceneKey}_ratings_list`] = details.ratings.join('; ');
        });

        allPatientRows.push(rowData);
    });

    if (allPatientRows.length === 0) {
        alert("No data to export after processing.");
        return;
    }

    const baseHeaders = [
        'participant_id', 'last_activity_date', 'patient_status', 'total_exposure_time_hms', 
        'num_unique_videos_completed', 'did_review_session', 'generated_video_sequence', 
        'qpvii_pre_date', 'qpvii_pre_score_total', 'qpvii_pre_score_malestar_general',
        'qpvii_pre_score_preparatius', 'qpvii_pre_score_vicari', 'qpvii_pre_score_vol', 'qpvii_post_date',
        'qpvii_post_score_total', 'qpvii_post_score_malestar_general', 'qpvii_post_score_preparatius',
        'qpvii_post_score_vicari', 'qpvii_post_score_vol', 'icf_total_score', 'imcs_category',
        'num_exposure_sessions', 'exposure_session_timestamps', 'total_video_views', 'avg_discomfort_rating_overall'
    ];

    const sceneHeaders: string[] = [];
    CANONICAL_FLIGHT_STAGES_ORDER.forEach(sceneKey => {
        sceneHeaders.push(`scene_${sceneKey}_num_views`);
        sceneHeaders.push(`scene_${sceneKey}_avg_rating`);
        sceneHeaders.push(`scene_${sceneKey}_ratings_list`);
    });

    const finalHeaders = [...baseHeaders, ...sceneHeaders];
    const csv = convertToCSV(allPatientRows, finalHeaders);
    downloadCSV(csv, `cafft_patient_summary_export_${new Date().toISOString().split('T')[0]}.csv`);
}
