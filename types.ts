

import React from 'react';

export enum Language {
  CA = 'ca',
  ES = 'es',
  EN = 'en',
}

export interface NotificationPreferences {
  enabled: boolean;
  reminders: boolean;
  newTasks: boolean;
  followUp: boolean;
  general: boolean;
  frequency: 'daily' | 'weekly' | 'custom';
  startTime: string;
  endTime: string;
  consentDate?: number;
}

export interface InformedConsentMetadata {
  dob: string;
  gender: string;
  occupation: string;
  source: string;
  studentsPresence: boolean;
}

export interface User {
  id: string;
  patientCode?: string;
  username: string;
  email?: string;
  consentGiven: boolean;
  informedConsentMetadata?: InformedConsentMetadata;
  role: 'patient' | 'therapist' | 'manager' | 'superadmin';
  assistantName?: string;
  lastReminderSentDate?: number;
  notificationPreferences?: NotificationPreferences;
  sentFollowUps?: string[];
  onboardingEnabled?: boolean;
}

export interface StoredUser extends Omit<User, 'email'> {
  email: string;
  patientCode?: string;
  hashedPassword: string;
  therapistId?: string; // For patients
  managerId?: string;   // For therapists
  assistantName?: string;
  lastReminderSentDate?: number;
  notificationPreferences?: NotificationPreferences;
  informedConsentMetadata?: InformedConsentMetadata;
  sentFollowUps?: string[];
  onboardingEnabled?: boolean;
}

// --- Auth and App State ---

export interface AuthContextType {
  currentUser: User | null;
  login: (username: string, passwordAttempt: string) => Promise<{ success: boolean; redirect?: { path: string; state?: any }; errorKey?: string }>;
  register: (username: string, email: string, passwordAttempt: string, consent: boolean, informedConsentMetadata?: InformedConsentMetadata) => Promise<{ success: boolean; errorKey?: string }>;
  logout: () => void;
  loading: boolean;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; errorKey?: string; messageKey?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; errorKey?: string; messageKey?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; errorKey?: string; messageKey?: string }>;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
}

export interface QPVIIQuestion {
  id: number;
  textKey: string;
}

export interface QPVIIAnswers {
  [key: number]: number | null;
}

export interface QPVIIScores {
  malestarGeneral: number;
  subPreparatius: number;
  subVicari: number;
  subVol: number;
  total: number;
}

export interface QPVIIUserResult {
  userId: string;
  formName: string; // Name entered in the form
  date: string;     // Date selected in the form
  timestamp: number; // Timestamp of when the result was saved
  scores: QPVIIScores;
  answers: QPVIIAnswers; // Added to support granular hierarchy generation
  evaluationType?: 'pre' | 'post'; // NEW: To distinguish pre/post evaluations
  originalQpviiTimestamp?: number; // NEW: Links a 'post' eval to its 'pre' eval
}

export type EvolutionChartDataPoint = Record<string, string | number>;

export interface QpviiLineConfig {
  dataKey: string;
  name: string;
  color: string;
}

export type ExposureSceneKey = 'psychoed' | 'preparation' | 'boarding' | 'takeoff' | 'inflight' | 'landing' | 'accidents';

export interface SceneDiscomfortChartDataPoint {
  instance: number;
  rating: number;
  videoTitle?: string;
  timestamp?: number; // Timestamp of the rating
}

// --- Help Modal Types ---
export interface HelpParagraphItem {
  type: 'paragraph';
  textKey?: string; // Make optional for items that might not have text (e.g. an image if it was present)
}

export interface HelpListItem {
  type: 'list';
  itemKeys?: string[]; // Array of translation keys for list items
}

export interface HelpSubtitleItem {
  type: 'subtitle';
  textKey?: string;
}

export interface HelpVideoListItem {
  type: 'video_list';
}

export interface HelpAIChatItem {
  type: 'ai_chat';
}

// Union type for different content item structures
export type HelpContentItem = HelpParagraphItem | HelpListItem | HelpSubtitleItem | HelpVideoListItem | HelpAIChatItem;

export interface HelpSectionContent {
  titleKey: string; // Translation key for the section title (tab title)
  content: HelpContentItem[];
}

export type HelpModalContentStructureType = { 
  [key in Language]: {
    fearOfFlying: HelpSectionContent;
    cafftInfo: HelpSectionContent;
    prospectus: HelpSectionContent;
    postTreatment: HelpSectionContent;
    helpVideos: HelpSectionContent;
    technicalSection: HelpSectionContent;
    aiChat: HelpSectionContent;
    therapistInfo: HelpSectionContent;
    therapistAiChat: HelpSectionContent;
  };
};

export interface HelpModalTranslatedStrings {
  modalTitle: string;
  tocTitle: string;
  searchPlaceholder: string;
  closeButton: string;
  disclaimer: string;
  needMoreHelp: string;
  noResultsTitle: string;
  noResultsText: string;
  heroSubtitle: string;
  fullManualTitle: string;
  fullManualSubtitle: string;
  fullManualMd: string;
  fearOfFlying: { 
    title: string; 
    prevalence: { title: string; textManual: string; }; 
    whoIsAffected: { title: string; textManual: string; };
    whatIsIt: { 
      title: string; 
      introManual: string; 
      physiological: { title: string; textManual: string; }; 
      cognitive: { title: string; textManual: string; }; 
      behavioral: { title: string; textManual: string; }; 
    }; 
    howItStarts: { title: string; textManual: string; };
    howItIsMaintained: { title: string; textManual: string; };
    howToSolve: { title: string; textManual: string; };
  };
  cafftInfo: { 
    title: string; 
    howItWorks: { title: string; textManual: string; }; 
    duration: { title: string; textManual: string; }; 
    efficacy: { title: string; textManual: string; }; 
    conditions: { title: string; item1Manual: string; item2Manual: string; item3Manual: string; item4Manual: string; }; 
    involvement: { title: string; textManual: string; list1: string; list2: string; list3: string; }; 
    tasksBetweenSessions: { title: string; textManual: string; };
  };
  prospectus: { 
    title: string; 
    indications: { title: string; textManual: string; };
    adverseEffects: { title: string; textManual: string; };
    advantages: { title: string; list: string[]; };
  };
  postTreatmentSection: { 
    title: string; 
    introManual: string;
    instructionItem1Manual: string;
    instructionItem2Manual: string;
    instructionItem3Manual: string;
    instructionItem4Manual: string;
    instructionItem5Manual: string;
    instructionItem6Manual: string;
    nervousnessAdviceManual: string;
  };
  technicalSection: { 
    title: string; 
    requirements: { title: string; list: string[]; text: string; }; 
    contraindications: { title: string; text: string; list: string[]; }; 
  };
  aiChatSection: { title: string; };
  therapistAiChatSection: { title: string; };
    therapistInfo: { 
    title: string; 
    evidenceTitle: string;
    evidenceText: string;
    mechanismTitle: string;
    mechanismText: string;
    inhibitoryTitle?: string;
    inhibitoryText?: string;
    metricsTitle: string;
    rciTitle?: string;
    rciExplanation: string;
    slopeTitle?: string;
    slopeExplanation: string;
    applicationTitle: string;
    principlesTitle?: string;
    principlesList?: string[];
    applicationSummary?: string;
    applicationText: string;
    faqTitle: string;
    faqText: string;
    objectivesTitle?: string;
    objectivesList?: { title: string; desc: string }[];
    procedureTitle?: string;
    procedureSteps?: { step: string; title: string; desc: string }[];
    feedbackTitle?: string;
    feedbackImmediateTitle?: string;
    feedbackImmediateList?: string[];
    feedbackMaintenanceTitle?: string;
    feedbackMaintenanceList?: string[];
    successMessage?: string;
    successDesc?: string;
  };
}

// Updated PostTreatmentContent to match PDF structure
export interface PostTreatmentContent {
  sessionTitle: string;
  instructionsTitle: string;
  introManual: string;
  instructionItem1Manual: string;
  instructionItem2Manual: string;
  instructionItem3Manual: string;
  instructionItem4Manual: string;
  instructionItem5Manual: string;
  instructionItem6Manual: string;
  nervousnessAdviceManual: string;
  introQuestion: string;
  instructionItem1: string;
  instructionItem2: string;
  instructionItem3: string;
  instructionItem4: string;
  instructionItem5: string;
  instructionItem6: string;
  instructionItem8: string;
  nervousnessAdvice: string;
}

export interface ExposurePageContent {
  pageTitle: string;
  startExposureButton: string;
  videoProgress: string; // e.g., "Video {current} of {total}"
  exposureComplete: string;
  restartExposureButton: string;
  videoNotAvailable: string;
  videoTagNotSupported: string;
  downloadVideo: string;
  ev001_title: string; ev001_desc: string;
  ev002_title: string; ev002_desc: string;
  ev003_title: string; ev003_desc: string;
  ev004_title: string; ev004_desc: string;
  ev005_title: string; ev005_desc: string;
  ev006_title: string; ev006_desc: string;
  ev007_title: string; ev007_desc: string;
  ev008_title: string; ev008_desc: string; // Added for accidents video
  discomfortRatingModalTitle: string;
  discomfortRatingInstruction: string; // e.g., "Rate discomfort for: {videoTitle}"
  discomfortRatingSaveButton: string;
  discomfortRatingErrorNoSelection: string;
  discomfortRatingMinLabel: string;
  discomfortRatingMaxLabel: string;
  progressionMessageSuccess: string;
  progressionMessageLastVideoSuccess: string;
  progressionMessageRetry: string;
  finishExposureSessionButton: string;
  reviewSessionTitle?: string;
  finishReviewButton?: string;
  logoutButton?: string;
  logoutWarning?: string;
  continueExposure?: string;
  videoLoadErrorTitle?: string;
  videoLoadErrorBody?: string;
  videoLoadErrorChecklist?: string;
  testWithDemoVideoButton?: string;
  simulateViewingButton?: string;
  sessionProgressTitle?: string;
  videosCompleted?: string;
  ratingHistory?: string;
  preparation?: string;
  boarding?: string;
  takeoff?: string;
  inflight?: string;
  landing?: string;
  accidents?: string;
  psychoed?: string;
}

export interface ExposureExplanationContent {
  pageTitle: string;
  introParagraph1: string;
  videoTitle: string;
  section1Title: string;
  section1Text: string;
  section2Title: string;
  section2SubtitleHabituation: string;
  section2TextHabituation: string;
  section2SubtitleExtinction: string;
  section2TextExtinction: string;
  section2SubtitleInhibitory: string;
  section2TextInhibitory: string;
  section3Title: string;
  section3Point1Active: string;
  section3Point2Stay: string;
  section3Point3Rate: string;
  section3Point4Repeat: string;
  section4Title: string;
  section4TextInitialAnxiety: string;
  section4TextGradualDecrease: string;
  section4TextTemporaryFluctuations: string;
  proceedButton: string;
}

export interface CelebrationPageContent {
  pageTitle: string;
  congratulations: string;
  messageBody: string;
  achievementsHeader: string;
  achievement1: string;
  achievement2: string;
  achievement3: string;
  nextStepsHeader: string;
  nextStep1: string;
  nextStep2: string;
  nextStep3: string;
  returnHomeButton: string;
  logoutButton: string;
  viewFlightInstructionsButton?: string; // Added for the new button
}

export interface LastSessionPageContent {
  pageTitle: string;
  pageSubtitle: string;
  header: string;
  intro: string;
  checklistItem1: string;
  checklistItem2: string;
  checklistItem3: string;
  checklistItem4: string;
  checklistItem5: string;
  checklistItem6: string;
  checklistItem7: string;
  checklistItem8: string;
  finalAdviceTitle: string;
  finalAdviceText: string;
  actionsTitle: string;
  reviewButton: string;
  reviewButtonTooltip: string;
  reviewDoneButton: string;
  reviewDoneButtonTooltip: string;
  evaluationButton: string;
  evaluationButtonTooltip: string;
}

export interface AIChatContent {
  pageTitle: string;
  disclaimer: string;
  initialMessage: string | string[];
  initialMessageCompleted: string | string[];
  inputPlaceholder: string;
  sendButton: string;
  systemInstruction: string;
  therapistSystemInstruction?: string;
  therapistInitialMessage?: string;
  assistantNameTitle: string;
  assistantNamePlaceholder: string;
  genderNeutralSuggestions: string[];
  saveName: string;
  changeName?: string;
  reconnectButton: string;
  connecting: string;
  reminder: {
    emailSubject: string;
    emailBody: string;
    notificationSent: string;
    webappMessage: string;
  };
  followUp: {
    firstSession: string;
    halfway: string;
    reducedFear: string;
    mostDifficult: string;
    maintenanceStarted: string;
  };
  moment?: {
    pre: string;
    during: string;
    maintenance: string;
    post: string;
  };
}

export interface TherapistDashboardContent {
  pageTitle: string;
  kpi: {
    title_overview: string;
    total_patients: string;
    active_sessions: string;
    completed_programs: string;
    avg_improvement: string;
    avg_exposure_time: string;
    total_sessions: string;
    sessions_rate: string;
    high_risk: string;
    inactive_patients: string;
  };
  myPatientsTitle: string;
  criticalAlertsTitle?: string;
  search: string;
  addPatientButton: string;
  table: {
    name: string;
    qpvii_latest?: string;
    rci?: string;
    progress: string;
    last_active: string;
    status: string;
    actions: string;
    exposure_time: string;
    remind: string;
    total_time?: string;
    significant_rci?: string;
    sessions?: string;
    last_session_slope?: string;
    habituation_status?: string;
    hierarchy_completed?: string;
    notifications: string;
    onboarding_tour: string;
  };
  tooltips?: {
    toggleNotificationsOn: string;
    toggleNotificationsOff: string;
    toggleTourOn: string;
    toggleTourOff: string;
  };
  patient_status: {
    new: string;
    ready: string;
    in_progress: string;
    needs_review: string;
    completed: string;
    stalled?: string;
    dropping_out?: string;
  };
  charts?: {
    phaseDistribution: string;
    dailyActivity: string;
    sessionsStarted: string;
    sessionsCompleted: string;
    evaluations: string;
    actionsLabel: string;
    sessionsPerDay?: string;
    discomfortTrend?: string;
  };
  actionOptions: {
    viewDetails: string;
    resetPassword: string;
    deletePatient: string;
  };
  noPatients: string;
  addPatientModal: {
    title: string;
    usernameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    createButton: string;
    cancelButton: string;
  };
  inviteModal: {
    title: string;
    intro: string;
    sendButton: string;
    copyButton: string;
    copiedButton: string;
    closeButton: string;
  };
  inviteEmail: {
    subject: string;
    body: string;
  };
  deletePatientModal: {
    title: string;
    confirmationText: string;
    deleteButton: string;
    cancelButton: string;
  };
  resetPasswordModal: {
    title: string;
    newPasswordIs: string;
    copyButton: string;
    copiedButton: string;
    closeButton: string;
  };
  exportDataModal: {
    title: string;
    anonymizeLabel: string;
    anonymizeTooltip: string;
    exportButton: string;
    cancelButton: string;
  };
  notificationsTitle: string;
  reminders: {
    sendReminderButton: string;
    reminderSentSuccess: string;
    inactivityBadge: string;
    abandonmentRisk?: string;
  };
  aiConsultationsTitle?: string;
  noAiConsultations?: string;
  patientLabel?: string;
  queryLabel?: string;
  newConsultation?: string;
  moreConsultations?: string;
}

export interface PatientDetailContent {
  pageTitle: string;
  currentPlanTitle: string;
  basedOnEvaluation: string;
  hierarchyTitle: string;
  patientNotFound: string;
  noEvaluationsFound: string;
  sessionDetailsTitle: string;
  noExposureSessions: string;
  recommendationsTitle: string;
  qpviiHistoryTitle: string;
  communicationsTitle: string;
  emailLogTitle: string;
  noEmailsSent: string;
  viewEmailButton: string;
  emailModalTitle: string;
  closeButton: string;
  sessionDate: string;
  videosViewed: string;
  avgDiscomfort: string;
  habituationSlope: string;
  notificationsNotEnabled: string;
  ratingHistory: string;
  videoTitle: string;
  rating: string;
  session_time: string;
  totalExposure_time: string;
  sequenceBreakdown?: string;
  abandonmentWarning?: string;
  habituatedLabel?: string;
  processingLabel?: string;
  emailType: {
    invitation: string;
    reminder: string;
    follow_up: string;
    reinforcement: string;
  };
  recommendations: {
    noExposureDataForRecommendations: string;
    noSignificantAlerts: string;
    stalledHabituation: string;
    slowProgress?: string;
    positiveProgress?: string;
    highExposureVolume?: string;
    effectiveHabituation?: string;
    dropoutRisk?: string;
    irregularPractice?: string;
  };
}

export interface ProgressIndicatorContent {
  programTitle: string;
  intro: string;
  assessment_pre: string;
  exposure: string;
  assessment_post: string;
  complete: string;
}

export interface InformedConsentContent {
  title: string;
  dob: string;
  gender: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  occupation: string;
  occupationStudent: string;
  occupationPTAGS: string;
  occupationPDI: string;
  occupationOther: string;
  source: string;
  sourceWeb: string;
  sourceUnitatMedica: string;
  sourceNecessitats: string;
  sourceProfesor: string;
  sourceUser: string;
  sourceFriend: string;
  sourceOther: string;
  consentDate: string;
  consentText: string;
  consentAcceptLabel: string;
  studentsPresence: string;
  legalText: string;
  conformityTitle: string;
  yes: string;
  no: string;
  select: string;
}

export interface TranslationContent {
  appName: string;
  appNameShort: string;
  common: {
    time: {
      ago: string;
      year: string;
      month: string;
      day: string;
      hour: string;
      minute: string;
      second: string;
      years: string;
      months: string;
      days: string;
      hours: string;
      minutes: string;
      seconds: string;
      session: string;
      sessions: string;
    };
  };
  informedConsent: InformedConsentContent;
  progress: ProgressIndicatorContent;
  nav: {
    home: string;
    fearOfFlying: string;
    cafftProgram: string;
    qpviiEvaluation: string;
    exposure: string;
    login: string;
    register: string;
    profile: string;
    logout: string;
    privacyPolicy: string;
    cafftIntro: string;
    forgotPasswordLink: string;
    evolution: string;
    exposureHierarchy: string;
    exposureExplanation: string; 
    lastSession: string; 
    therapistDashboard: string;
    managerDashboard: string;
    superadminDashboard: string;
    patients?: string;
    therapists?: string;
    managers?: string;
    therapistNotifications: string;
    clinicalGuide?: string;
    scientificEvidence?: string;
    helpCenter: string;
    addUser: string;
    addTherapist: string;
    save: string;
    cancel: string;
    feedback: string;
    help: string;
  };
  home: {
    title: string[];
    subtitle: string;
    firstEdition: string;
    version: string;
    startButton: string;
  };
  fearOfFlying: {
    title: string;
    introduction: string;
    prevalence: {
      title: string;
      text: string;
      chartData: { nameKey: string, value: number }[];
      phobia: string;
      discomfort: string;
      noDiscomfort: string;
    };
    whoIsAffected: {
      title: string;
      text: string;
    };
    whatIsIt: {
      title: string;
      text1: string;
      physiological: string;
      physiological_desc: string;
      cognitive: string;
      cognitive_desc: string;
      behavioral: string;
      behavioral_desc: string;
    };
    origins?: {}; // Keep as is from provided
  };
  cafftProgram: {
    title: string;
    introduction: string;
    specificInfo: {
      title: string;
      whatIsCAFFT: string;
      whatIsCAFFT_desc: string;
      howItWorks: string;
      howItWorks_desc: string;
      onlineInterview: string;
    };
    linkToScientificFoundation: string;
  };
  userGuide: { // Kept for Help Modal, but removed from nav
    title: string;
    introduction: string;
    requirements: {
      title: string;
      items?: string[];
      computer: string;
      headphones: string;
      skills: string;
    };
    beforeUse: {
      title: string;
      adverseEffects: string;
      mostFrequent: string[];
      mostSerious: string[];
      doNotUseIf: string[];
    };
    howToUse: {
        title: string;
        text: string;
    };
    advantages: {
        title: string;
        items: string[];
    }
  };
  helpVideos: { // Kept for Help Modal, but removed from nav
    title: string;
    pageTitle: string;
    videos: { titleKey: string; link: string }[];
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    noVideos: string;
  };
  cafftIntroPage: {
    title: string;
    welcomeMessage: string;
    explanationText: string;
    videoTitle: string;
    proceedButton: string;
  };
  qpvii: {
    title: string;
    formTitle: string;
    instructions: string;
    nameLabel: string;
    dateLabel: string;
    scoreLabel: string;
    submitButton: string;
    calculatingButton: string;
    resultsTitle: string;
    generalDiscomfortScore: string;
    subPreparatiusScore: string;
    subVicariScore: string;
    subVolScore: string;
    totalScore: string;
    allFieldsRequiredError: string;
    personName: string;
    evaluationDate: string;
    backToFormButton: string;
    loginToSavePrompt: string;
    fillRandomlyButton: string;
    viewHierarchyButton: string;
    questions: {
      q0: string; q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string; q9: string; q10: string;
      q11: string; q12: string; q13: string; q14: string; q15: string; q16: string; q17: string; q18: string; q19: string; q20: string;
      q21: string; q22: string; q23: string; q24: string; q25: string; q26: string; q27: string; q28: string; q29: string; q30: string;
    }
  };
  auth: {
    registerTitle: string;
    loginTitle: string;
    usernameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    consentLabel: string;
    consentLinkText: string;
    registerButton: string;
    loginButton: string;
    logoutButton: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    registrationSuccess: string;
    loginSuccess: string;
    logoutSuccess: string;
    fillAllFieldsError: string;
    passwordsDontMatchError: string;
    registrationFailedError: string;
    loginFailedError: string;
    usernameTakenError: string;
    emailTakenError: string;
    invalidCredentialsError: string;
    consentRequiredError: string;
    loading: string;
    forgotPasswordTitle: string;
    forgotPasswordInstructions: string;
    sendResetLinkButton: string;
    resetLinkSentSuccess: string;
    resetLinkSentError: string;
    resetPasswordTitle: string;
    resetPasswordInstructions: string;
    resetPasswordButton: string;
    passwordResetSuccess: string;
    passwordResetError: string;
    invalidOrExpiredTokenError: string;
    changePasswordTitle: string;
    changePasswordButton: string;
    changePasswordSuccess: string;
    changePasswordError: string;
    passwordMinLengthError: string;
  };
  privacyPolicy: {
    title: string;
    lastUpdated: string;
    introduction: string;
    dataCollectedHeader: string;
    dataCollectedText: string;
    username: string;
    emailAddress: string;
    hashedPassword: string;
    qpviiResults: string;
    consentStatus: string;
    howDataUsedHeader: string;
    howDataUsedText: string;
    accountManagement: string;
    howDataUsedItem1: string;
    howDataUsedItem2: string;
    dataStorageHeader: string;
    dataStorageText: string;
    userRightsHeader: string;
    userRightsText: string;
    userRightsGDPR: string;
    securityHeader: string;
    securityText: string;
    contactHeader: string;
    contactText: string;
    demoDisclaimer: string;
  };
  profile: {
    title: string;
    welcome: string;
    qpviiHistoryTitle: string;
    evaluationOn: string;
    totalScore: string;
    changePasswordSectionTitle: string;
    noHistory: string;
    notificationsSectionTitle: string;
    notificationsDescription: string;
    enableNotifications: string;
    notificationTypes: {
      reminders: string;
      newTasks: string;
      followUp: string;
      general: string;
    };
    frequency: {
      title: string;
      daily: string;
      weekly: string;
    };
    timeRange: string;
    savePreferences: string;
    consentWithdrawn: string;
    consentGiven: string;
    withdrawConsent: string;
    notificationConsentPrompt: string;
    notificationConsentExplain: string;
    acceptButton: string;
    declineButton: string;
  };
  exposureHierarchy: {
    pageTitle: string;
    introText: string;
    videoSequenceTitle: string;
    startExposureButton: string;
    exitButton: string;
    videoItemTitle: string; // e.g., "{index}. {title}"
    noVideosInSequence: string;
    hierarchyLogicTitle?: string;
    hierarchyLogicText?: string;
  };
  exposure: ExposurePageContent;
  scientificFoundation: { // Kept for Help Modal, but removed from nav
    title: string;
    introduction: string;
    referencesTitle: string;
  };
  evolution: {
    pageTitle: string;
    qpviiEvolutionChartTitle: string;
    totalScoreEvolution: string;
    malestarGeneralEvolution: string;
    subPreparatiusEvolution: string;
    subVicariEvolution: string;
    subVolEvolution: string;
    noHistoryForChart: string; // e.g., "Not enough history (minimum {count})..."
    preTreatment: string;
    postTreatment: string;
    exposureTitle: string;
    habituationExplanationTitle: string;
    habituationExplanationText: string;
    noExposureData: string;
    sessionDate: string; // e.g., "Session of {date}"
    videoAttemptsLabel: string;
    videoCompleted: string;
    videoNotCompleted: string;
    noDiscomfortRatingsRecorded: string;
    sceneHabituationChartTitle: string; // e.g., "Habituation: {sceneName}"
    scene_psychoed: string;
    scene_preparation: string;
    scene_boarding: string;
    scene_takeoff: string;
    scene_inflight: string;
    scene_landing: string;
    scene_accidents: string;
    sceneExposureInstanceAxisLabel: string;
    ratingAxisLabel: string;
    scoreAxisLabel?: string;
    programCompleteSuccessMessage?: string;
    habituationStrength?: string;
    habituationStrengthExplanation?: string;
    watchedVideoTooltipLabel: string;
    finishProgramButton?: string; // Added for the new button
    reviewScenesButton?: string;
    reviewSessionLabel?: string; // New translation key for review sessions
    finishSessionButton?: string;
    sessionCompleteTitle?: string; // Added for session debrief card
    sessionCompleteText?: string;  // Added for session debrief card
    reEvaluateButton?: string;     // Added for session debrief card
    sessionPausedTitle?: string;   // For paused session card
    sessionPausedText?: string;    // For paused session card
    resumeSessionButton?: string;  // For paused session card
    logoutButton?: string;
    goToHomeButton?: string;
    habituation?: string;
    habituationStatus?: string;
    habituationProgress?: string;
    feedbackImproving?: string;
    feedbackStable?: string;
    feedbackWorsening?: string;
    detailedHabitutationTitle?: string;
    sceneHabitutationSummaryTitle?: string;
    sceneHabitutationSummaryExplanation?: string;
    globalSceneTrendTitle?: string;
    globalTrendExplanation?: string;
    habituationProgressTitle?: string;
    habituationProgressExplanation?: string;
    discomfortReduction?: string;
    averageDiscomfort?: string;
    habituationSlope?: string;
    videosWatched?: string;
    sessionDetails?: string;
    slopeImproving?: string;
    slopeStable?: string;
    slopeWorsening?: string;
    intraSessionEvolution?: string;
    rciTitle?: string;
    rciExplanation?: string;
    rciMathInfo?: string;
    rciStatusSignificant?: string;
    rciStatusNotSignificant?: string;
    rciLabel?: string;
    prePostComparisonTitle?: string;
    differenceLabel?: string;
    rciMissingDataMessage?: string;
    globalEvolutionTitle?: string;
    totalSessions?: string;
    totalVideos?: string;
    globalHabituation?: string;
    needMoreDataTitle?: string;
    needMoreDataDesc?: string;
  };
  onboarding?: {
    stepCounter: string;
    startManual: string;
    next: string;
    prev: string;
    finish: string;
    step1: { title: string; content: string; };
    step2: { title: string; content: string; };
    step3: { title: string; content: string; };
    step4: { title: string; content: string; };
    step5: { title: string; content: string; };
    step6: { title: string; content: string; };
    therapist?: {
      step1: { title: string; content: string; };
      step2: { title: string; content: string; };
      step3: { title: string; content: string; };
      step4: { title: string; content: string; };
      step5: { title: string; content: string; };
      step6: { title: string; content: string; };
    };
  };
  review?: {
    pageTitle: string;
    intro: string;
    startReview: string;
    noSelectionError: string;
  };
  helpModal: HelpModalTranslatedStrings;
  postTreatment: PostTreatmentContent;
  exposureExplanation: ExposureExplanationContent;
  celebration: CelebrationPageContent;
  lastSession: LastSessionPageContent;
  aiChat: AIChatContent;
  therapistDashboard: TherapistDashboardContent;
  managerDashboard: ManagerDashboardContent;
  superadminDashboard: SuperadminDashboardContent;
  patientDetail: PatientDetailContent;
  feedback: FeedbackTranslations;
  general: {
    readMore: string;
    by: string;
    help: string;
    or: string;
    confirmExit: string;
    cancel: string;
    errorDetails: string;
    unknown: string;
    none: string;
    roles: {
      manager: string;
      therapist: string;
      superadmin: string;
      patient: string;
    }
  }
}

export type Translations = {
  [key in Language]: TranslationContent;
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, any>) => any;
}

export interface NavItem {
  path: string;
  labelKey: string;
  authRequired?: boolean;
  hideWhenAuth?: boolean;
  isDropdown?: boolean;
  dropdownItems?: NavItem[];
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface PieChartDataItem {
  name: string;
  value: number;
  fill: string;
}

export interface ExposureVideo {
  id: string;
  mp4Url: string;
  titleKey: string;
  descriptionKey: string;
  relatedArea: ExposureSceneKey;
  intensity: number;
}

export interface VideoDiscomfortRating {
  id: string; // video ID
  rating: number;
  qpviiTimestamp: number; // timestamp of the QPV-II session this rating belongs to
  videoTimestamp: number; // timestamp of when this specific rating was given
}

export interface UserExposureProgress {
  userId: string;
  qpviiTimestamp: number | null; // For review sessions, this will be the review's own timestamp
  videoSequence: string[]; // Array of ExposureVideo ids, representing the *specific* sequence for this session
  currentVideoIndex: number;
  completedVideoIds: string[]; // IDs of videos completed with discomfort <= 2 for this session
  lastUpdated: number;
  discomfortRatings: VideoDiscomfortRating[]; // All discomfort ratings given during this session
  explanationShown: boolean; // Tracks if the exposure explanation has been shown for this session
  programCompleted?: boolean; // Added to mark full program completion for this QPV-II cycle
  isReview?: boolean; // New flag to identify a review session
  reviewCompleted?: boolean; // New flag to track if the one-time review has been done for a cycle
  originalQpviiTimestamp?: number; // Links review session back to the original QPV-II it's reviewing
}

export interface HelpModalSection { 
  id: 'fullManual' | 'fearOfFlying' | 'cafftInfo' | 'prospectus' | 'postTreatment' | 'postTreatmentSection' | 'helpVideos' | 'technicalSection' | 'aiChat' | 'therapistInfo' | 'therapistAiChat';
  titleKey: string; 
}

export interface AiConsultation {
  id: string;
  userId: string; // The user who made the consultation (patient or therapist)
  userName: string;
  userRole: 'patient' | 'therapist';
  query: string;
  response: string;
  timestamp: number;
}

// --- Therapist Types ---
export interface PatientStatus {
  textKey: 'new' | 'ready' | 'in_progress' | 'needs_review' | 'completed' | 'stalled' | 'dropping_out';
  color: 'gray' | 'blue' | 'sky' | 'amber' | 'green' | 'red';
  progressPercent: number;
}

export interface Patient extends StoredUser {
  status: PatientStatus;
  lastActivityDate: number | null;
  effectiveExposureSeconds: number;
}

export interface SimulatedEmail {
  id: string;
  patientId: string;
  type: 'invitation' | 'reminder' | 'follow_up' | 'reinforcement';
  subject: string;
  body: string;
  status: 'generated' | 'sent';
  timestamp: number;
}

export interface Recommendation {
  id: string;
  type: 'info' | 'warning' | 'success';
  messageKey: string;
  messageParams?: Record<string, string | number>;
}

export interface Feedback {
  id: string;
  userId: string;
  username: string;
  userType: 'patient' | 'therapist' | 'guest';
  type: 'bug' | 'improvement' | 'testimonial' | 'other';
  rating: number; // 1-5
  comment: string;
  timestamp: number;
  status: 'new' | 'reviewed' | 'resolved';
}

export interface ManagerDashboardContent {
  addTherapistButton: string;
  addNewTherapistTitle: string;
  table: {
    therapist: string;
    viewPatients: string;
  };
}

export interface SuperadminDashboardContent {
  allUsersTitle: string;
  addUserButton: string;
  addNewUserTitle: string;
  table: {
    user: string;
    role: string;
    parent: string;
    settings: string;
    actions: string;
  };
  form: {
    username: string;
    email: string;
    password: string;
    role: string;
    assignToManager: string;
    none: string;
  };
}

export interface FeedbackTranslations {
  pageTitle: string;
  ratingLabel: string;
  typeLabel: string;
  types: {
    bug: string;
    improvement: string;
    testimonial: string;
    other: string;
  };
  commentLabel: string;
  commentPlaceholder: string;
  submitButton: string;
  successMessage: string;
  errorMessage: string;
  recentTestimonialsTitle: string;
  anonymousUser: string;
}

export interface AnalyzedSession {
  timestamp: number;
  date: Date;
  isReview: boolean;
  ratingCount: number;
  avgRating: number | null;
  habituationSlope: number | null;
  totalTimeSeconds: number;
  hasAbandonment?: boolean;
  isCompleted?: boolean;
  ratings: {
    videoId: string;
    rating: number;
    videoTitle: string;
    timestamp: number;
  }[];
}