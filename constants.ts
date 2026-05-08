

import { Language, NavItem, QPVIIQuestion, ExposureVideo, ExposureSceneKey } from './types';

export const DEFAULT_LANGUAGE = Language.CA;

export const LANGUAGES = [
  { code: Language.CA, name: 'Català' },
  { code: Language.ES, name: 'Español' },
  { code: Language.EN, name: 'English' },
];

// Top-level navigation items for GUEST users
export const TOP_NAV_GUEST: NavItem[] = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/fear-of-flying', labelKey: 'nav.fearOfFlying' },
  { path: '/cafft-program', labelKey: 'nav.cafftProgram' },
  { path: '/qpvii-evaluation', labelKey: 'nav.qpviiEvaluation' },
  { path: '/help-center', labelKey: 'nav.helpCenter' },
];

// Top-level navigation items for AUTHENTICATED PATIENT users
export const TOP_NAV_AUTH: NavItem[] = [
  { path: '/cafft-intro', labelKey: 'nav.cafftIntro', authRequired: true }, 
  { path: '/qpvii-evaluation', labelKey: 'nav.qpviiEvaluation', authRequired: true }, 
  { path: '/exposure', labelKey: 'nav.exposure', authRequired: true }, 
  { path: '/evolution', labelKey: 'nav.evolution', authRequired: true },
  { path: '/help-center', labelKey: 'nav.helpCenter', authRequired: true },
];

// Sidebar navigation for THERAPIST users
export const THERAPIST_SIDEBAR_NAV: NavItem[] = [
  { path: '/therapist/dashboard', labelKey: 'nav.therapistDashboard' },
  { path: '/therapist/patients', labelKey: 'nav.patients' },
  { path: '/therapist/notifications', labelKey: 'nav.therapistNotifications' },
  { path: '/help-center', labelKey: 'nav.helpCenter', authRequired: true },
  { path: '/feedback', labelKey: 'nav.feedback' },
];

// Sidebar navigation for MANAGER users
export const MANAGER_SIDEBAR_NAV: NavItem[] = [
  { path: '/manager/dashboard', labelKey: 'nav.managerDashboard' },
  { path: '/manager/patients', labelKey: 'nav.patients' },
  { path: '/feedback', labelKey: 'nav.feedback' },
];

// Sidebar navigation for SUPERADMIN users
export const SUPERADMIN_SIDEBAR_NAV: NavItem[] = [
  { path: '/superadmin/dashboard', labelKey: 'nav.superadminDashboard' },
];

// Specific action buttons for GUEST users (Login, Register)
export const NAV_ITEMS_GUEST_ACTIONS: NavItem[] = [
  { path: '/login', labelKey: 'nav.login' },
  { path: '/register', labelKey: 'nav.register'},
];


// Updated PIE_CHART_COLORS for UIB Branding
export const PIE_CHART_COLORS = ['#00263E', '#BA0C2F', '#A7A596', '#0072CE']; // UIB Institutional Blue, Red, Warm Gray, Vibrant Blue

export const YOUTUBE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="text-red-600"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-3.897 1.834-3.897 7.691 0 5.861 0 7.429 3.897 7.696 3.6.245 11.626.246 15.23 0 3.897-.266 3.897-1.838 3.897-7.696 0-5.855 0-7.425-3.897-7.691zm-7.615 11.316v-7.143l5.714 3.571-5.714 3.572z"></path></svg>`;

export const EXPOSURE_EXPLANATION_VIDEO_URL_BASE = "videos_cafft/exposure_explanation"; // Base path for the local explanation video

// Base URL for video assets. In Vercel, set VITE_VIDEO_BASE_URL to the GitHub release URL.
// Example: https://github.com/marcomartinez-fueib/CAFFT-IA/releases/download/v1.0.0-videos
const VIDEO_BASE_URL = import.meta.env.VITE_VIDEO_BASE_URL || '';

export const getVideoUrl = (basePath: string, language: string): string => {
  const fileName = `${basePath.split('/').pop()}_${language}.mp4`;
  if (VIDEO_BASE_URL) {
    return `${VIDEO_BASE_URL}/${fileName}`;
  }
  return `${basePath}_${language}.mp4`;
};

export const QPVII_QUESTIONS: QPVIIQuestion[] = Array.from({ length: 31 }, (_, i) => ({
  id: i,
  textKey: `qpvii.questions.q${i}`,
}));

// Scoring based on the formulas from the provided spreadsheet.
// All indices are 0-based.

// Malestar General (General Discomfort)
// This is the first general question about fear of flying.
export const QPVII_MALESTAR_GENERAL_ITEMS = [0];

// Subescala Preparatius (Preparation Subscale)
// Based on formula from spreadsheet: =B14+B16+B17+B19+B24+B25+B26+B29
export const QPVII_SUB_PREPARATIUS_ITEMS = [12, 14, 15, 17, 22, 23, 24, 27];

// Subescala Vicari (Vicarious Subscale)
// Based on formula from spreadsheet: =B15+B18+B23+B28+B30+B31
export const QPVII_SUB_VICARI_ITEMS = [13, 16, 21, 26, 28, 29];

// Subescala Vol (Flight Subscale)
// Derived from all remaining specific items (1-30) not in other subscales.
// UPDATED: Includes Item 0 based on validation spreadsheet formula: =SUMA(B2:B13)+...
export const QPVII_SUB_VOL_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 18, 19, 20, 25, 30];

// All items for Total Score (sum of Q0 to Q30)
export const ALL_QPVII_ITEMS_INDICES = Array.from({ length: 31 }, (_, i) => i);

// NEW: Mapping of specific Exposure Phases to QPV-II items
// This allows splitting broad subscales (like 'Flight' or 'Prep') into specific moments (Takeoff, Landing, Boarding)
export const PHASE_SPECIFIC_ITEMS: Record<ExposureSceneKey, number[]> = {
  preparation: [8, 12, 14, 15, 17, 27], // Combination of preparation items
  boarding: [9, 22, 23, 24], // Airport and boarding items from Preparatius
  takeoff: [3, 5, 18, 28], // Takeoff specific items
  inflight: [1, 4, 6, 10, 11, 25, 29], // Inflight and turbulence items
  landing: [2, 7, 13, 19, 20, 30], // Landing specific items
  accidents: [16, 21, 26], // Accident/Vicarious items
  psychoed: [], // Psychoeducation doesn't have QPV items
};

export const LOCAL_STORAGE_KEYS = {
  USERS: 'cafftAppUsers',
  QPVII_RESULTS: 'cafftAppQPVIIResults',
  CURRENT_USER: 'cafftAppCurrentUser',
  LAST_VISITED_PATH_PREFIX: 'cafftAppLastPath_', 
  USER_EXPOSURE_PROGRESS: 'cafftAppUserExposureProgress',
  SIMULATED_EMAILS: 'cafftAppSimulatedEmails',
  FEEDBACK: 'cafftAppFeedback',
  AI_CONSULTATIONS: 'cafftAppAiConsultations',
};

// Defines the fixed order of categories for the exposure hierarchy.
export const CANONICAL_FLIGHT_STAGES_ORDER: ExposureSceneKey[] = [
  'preparation',
  'boarding', // This now implicitly includes taxiing content
  'takeoff',
  'inflight',
  'landing',
  'accidents',
];

export const AVERAGE_VIDEO_DURATION_SECONDS = 180; // 3 minutes

export const EXPOSURE_VIDEOS: ExposureVideo[] = [
  {
    id: 'ev001',
    mp4Url: 'videos_cafft/ev001',
    titleKey: 'exposure.ev001_title',
    descriptionKey: 'exposure.ev001_desc',
    relatedArea: 'preparation',
    intensity: 1, // Lowest intensity
  },
  {
    id: 'ev002',
    mp4Url: 'videos_cafft/ev002',
    titleKey: 'exposure.ev002_title',
    descriptionKey: 'exposure.ev002_desc',
    relatedArea: 'boarding',
    intensity: 2, // Higher than prep
  },
  {
    id: 'ev003',
    mp4Url: 'videos_cafft/ev003',
    titleKey: 'exposure.ev003_title',
    descriptionKey: 'exposure.ev003_desc',
    relatedArea: 'takeoff',
    intensity: 4, // More intense than boarding/inflight
  },
  {
    id: 'ev004',
    mp4Url: 'videos_cafft/ev004',
    titleKey: 'exposure.ev004_title',
    descriptionKey: 'exposure.ev004_desc',
    relatedArea: 'inflight',
    intensity: 3, // Mid-level intensity, typically calmer than takeoff/landing
  },
  {
    id: 'ev005',
    mp4Url: 'videos_cafft/ev005',
    titleKey: 'exposure.ev005_title',
    descriptionKey: 'exposure.ev005_desc',
    relatedArea: 'landing',
    intensity: 5, // More intense than takeoff
  },
  {
    id: 'ev006',
    mp4Url: 'videos_cafft/ev006',
    titleKey: 'exposure.ev006_title',
    descriptionKey: 'exposure.ev006_desc',
    relatedArea: 'accidents',
    intensity: 8, // Highest intensity
  },
  {
    id: 'ev007',
    mp4Url: 'videos_cafft/ev007',
    titleKey: 'exposure.ev007_title',
    descriptionKey: 'exposure.ev007_desc',
    relatedArea: 'inflight',
    intensity: 6, // Higher than calm flight (3)
  },
  {
    id: 'ev008',
    mp4Url: 'videos_cafft/ev008',
    titleKey: 'exposure.ev008_title',
    descriptionKey: 'exposure.ev008_desc',
    relatedArea: 'accidents',
    intensity: 9, // Higher than ev006 (8)
  },
];