/**
 * The app's data, held in memory and backed by the CAFFT API.
 *
 * This replaces utils/localStorageDB.ts and keeps its function names. On login
 * (or page load with a live session) `syncStore()` loads everything the user
 * may see from GET /sync. After that:
 *
 *  - Reads are synchronous and come from memory, exactly as they used to come
 *    from localStorage, so pages did not have to become asynchronous.
 *  - Clinical writes (QPV-II, exposure progress, AI consultations, emails)
 *    update memory immediately and are sent to the server through a sequential
 *    queue that retries transient failures. Every one of them is idempotent on
 *    the server, so a retry can never duplicate a record.
 *  - Account operations that need the server's answer (creating a user,
 *    deleting, resetting a password, toggles) are asynchronous.
 *
 * Staff pages call `syncStore()` when they mount to pick up their patients'
 * latest activity. A patient is the only writer of their own clinical data,
 * so their in-memory copy cannot go stale behind their back.
 */
import {
  AiConsultation,
  QPVIIAnswers,
  QPVIIScores,
  QPVIIUserResult,
  SimulatedEmail,
  StoredUser,
  User,
  UserExposureProgress,
  VideoDiscomfortRating,
  Feedback,
} from '../types.ts';
import { api, ApiError } from './api.ts';

interface StoreState {
  users: StoredUser[];
  qpvii: QPVIIUserResult[];
  progress: UserExposureProgress[];
  consultations: AiConsultation[];
  emails: SimulatedEmail[];
}

const empty = (): StoreState => ({ users: [], qpvii: [], progress: [], consultations: [], emails: [] });

let state: StoreState = empty();

/**
 * Every getter returns a copy. localStorageDB.ts parsed fresh objects on each
 * read, so pages were free to sort or mutate what they got back; handing out
 * the in-memory objects themselves would let such code silently corrupt the
 * store. Copying keeps that old contract at the same cost as the old parse.
 */
const copy = <T,>(value: T): T => structuredClone(value);

// --- Loading -----------------------------------------------------------------

/**
 * Reloads everything from the server. Waits for queued writes first, so the
 * snapshot it receives already contains them and cannot roll memory back.
 */
export async function syncStore(): Promise<void> {
  await flushWrites();
  state = await api<StoreState>('GET', '/sync');
}

export function clearStore(): void {
  state = empty();
}

// --- Write queue ---------------------------------------------------------------

export interface SyncStatus {
  /** Writes not yet confirmed by the server. */
  pending: number;
  /** Writes the server rejected or that kept failing; their data is not saved. */
  failed: number;
}

let status: SyncStatus = { pending: 0, failed: 0 };
const statusListeners = new Set<(s: SyncStatus) => void>();
let queue: Promise<void> = Promise.resolve();

function setStatus(next: SyncStatus): void {
  status = next;
  statusListeners.forEach((l) => l(status));
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: (s: SyncStatus) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];

async function withRetry(send: () => Promise<unknown>): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await send();
      return;
    } catch (err) {
      const transient = err instanceof ApiError && err.transient;
      if (!transient || attempt >= RETRY_DELAYS_MS.length) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
  }
}

/** Sends writes one at a time, in order, so the server sees them as the user made them. */
function enqueue(label: string, send: () => Promise<unknown>): void {
  setStatus({ ...status, pending: status.pending + 1 });
  queue = queue
    .then(() => withRetry(send))
    .then(
      () => setStatus({ ...status, pending: status.pending - 1 }),
      (err) => {
        console.error(`[dataStore] ${label} could not be saved:`, err);
        setStatus({ pending: status.pending - 1, failed: status.failed + 1 });
      },
    );
}

/** Resolves once every queued write has either been saved or given up on. */
export function flushWrites(): Promise<void> {
  return queue;
}

export function dismissSyncFailures(): void {
  setStatus({ ...status, failed: 0 });
}

// --- Users (reads) ---------------------------------------------------------------

export function getUsers(): StoredUser[] {
  return copy(state.users);
}

export function findUserById(userId: string): StoredUser | undefined {
  const user = state.users.find((u) => u.id === userId);
  return user && copy(user);
}

export function getUsersByRole(role: User['role']): StoredUser[] {
  return copy(state.users.filter((u) => u.role === role));
}

export function getTherapistsForManager(managerId: string): StoredUser[] {
  return copy(state.users.filter((u) => u.role === 'therapist' && u.managerId === managerId));
}

export function getPatientsForTherapist(therapistId: string): StoredUser[] {
  return copy(state.users.filter((u) => u.role === 'patient' && u.therapistId === therapistId));
}

function replaceUser(user: StoredUser): void {
  const i = state.users.findIndex((u) => u.id === user.id);
  state = { ...state, users: i === -1 ? [...state.users, user] : state.users.map((u) => (u.id === user.id ? user : u)) };
}

function patchCachedUser(userId: string, patch: Partial<StoredUser>): void {
  const user = findUserById(userId);
  if (user) replaceUser({ ...user, ...patch });
}

// --- Users (writes) --------------------------------------------------------------

/** Exactly one of the two is set. (The app's tsconfig is not strict, so a discriminated union would not narrow.) */
export interface CreateUserResult {
  user: StoredUser | null;
  /** Translation key, e.g. auth.usernameTakenError. */
  errorKey: string | null;
}

/** Errors come back as translation keys (auth.usernameTakenError, ...). */
export async function createUser(input: {
  role: User['role'];
  username: string;
  email: string;
  password: string;
  therapistId?: string;
  managerId?: string;
}): Promise<CreateUserResult> {
  try {
    const { user } = await api<{ user: StoredUser }>('POST', '/users', input);
    replaceUser(user);
    return { user, errorKey: null };
  } catch (err) {
    const code = err instanceof ApiError ? err.code : '';
    return { user: null, errorKey: code.startsWith('auth.') ? code : 'auth.registrationFailedError' };
  }
}

/** The logged-in user's own preferences. Use useAuth().updateUser from components. */
export async function updateOwnUser(
  userId: string,
  patch: Partial<Pick<StoredUser, 'assistantName' | 'notificationPreferences' | 'sentFollowUps'>>,
): Promise<StoredUser> {
  const { user } = await api<{ user: StoredUser }>('PATCH', `/users/${encodeURIComponent(userId)}`, patch);
  replaceUser(user);
  return user;
}

/** Deletes a user and, on the server, all their clinical data. */
export async function deletePatientData(userId: string): Promise<boolean> {
  try {
    await api('DELETE', `/users/${encodeURIComponent(userId)}`);
  } catch (err) {
    console.error('[dataStore] deletePatientData:', err);
    return false;
  }
  state = {
    users: state.users.filter((u) => u.id !== userId),
    qpvii: state.qpvii.filter((r) => r.userId !== userId),
    progress: state.progress.filter((p) => p.userId !== userId),
    consultations: state.consultations.filter((c) => c.userId !== userId),
    emails: state.emails.filter((e) => e.patientId !== userId),
  };
  return true;
}

/** Sets a new random password on the server and returns it, or null on failure. */
export async function resetPatientPassword(userId: string): Promise<string | null> {
  try {
    const { temporaryPassword } = await api<{ temporaryPassword: string }>('POST', `/users/${encodeURIComponent(userId)}/reset-password`);
    return temporaryPassword;
  } catch (err) {
    console.error('[dataStore] resetPatientPassword:', err);
    return null;
  }
}

async function toggle(userId: string, what: 'notifications' | 'onboarding'): Promise<boolean> {
  try {
    const { user } = await api<{ user: StoredUser }>('POST', `/users/${encodeURIComponent(userId)}/toggle-${what}`);
    replaceUser(user);
    return true;
  } catch (err) {
    console.error(`[dataStore] toggle ${what}:`, err);
    return false;
  }
}

export const toggleUserNotifications = (userId: string) => toggle(userId, 'notifications');
export const toggleUserOnboarding = (userId: string) => toggle(userId, 'onboarding');

/** Records that the logged-in user finished an onboarding tour. */
export async function completeOnboardingTour(tour: 'patient' | 'therapist'): Promise<StoredUser | null> {
  try {
    const { user } = await api<{ user: StoredUser }>('POST', `/me/onboarding/${tour}/complete`);
    replaceUser(user);
    return user;
  } catch (err) {
    console.error('[dataStore] completeOnboardingTour:', err);
    return null;
  }
}

// --- QPV-II ---------------------------------------------------------------------

export function getAllQPVIIResults(): QPVIIUserResult[] {
  return copy(state.qpvii);
}

/** Newest first. */
export function getQPVIIResultsForUser(userId: string): QPVIIUserResult[] {
  return copy(state.qpvii.filter((r) => r.userId === userId)).sort((a, b) => b.timestamp - a.timestamp);
}

export function hasQPVIIResults(userId: string): boolean {
  return state.qpvii.some((r) => r.userId === userId);
}

export function saveQPVIIResultForUser(
  userId: string,
  formName: string,
  date: string,
  scores: QPVIIScores,
  timestamp: number,
  answers: QPVIIAnswers,
  evaluationType: 'pre' | 'post' = 'pre',
  originalQpviiTimestamp?: number,
): boolean {
  const result: QPVIIUserResult = copy({ userId, formName, date, timestamp, scores, answers, evaluationType, originalQpviiTimestamp });
  state = {
    ...state,
    qpvii: [...state.qpvii.filter((r) => !(r.userId === userId && r.timestamp === timestamp)), result],
  };
  patchCachedUser(userId, { lastAssessmentDate: Math.max(findUserById(userId)?.lastAssessmentDate ?? 0, timestamp) });

  enqueue('QPV-II result', () => api('PUT', '/qpvii', result));
  return true;
}

// --- Exposure progress ---------------------------------------------------------------

export function getAllUserExposureProgress(): UserExposureProgress[] {
  return copy(state.progress);
}

export function getUserExposureProgress(userId: string, qpviiTimestamp: number | null): UserExposureProgress | null {
  if (qpviiTimestamp === null) return null;
  const progress = state.progress.find((p) => p.userId === userId && p.qpviiTimestamp === qpviiTimestamp);
  return progress ? copy(progress) : null;
}

/**
 * Same signature and merge rules as the localStorage version: optional flags
 * left undefined keep the value of the existing record.
 */
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
  reviewCompleted?: boolean,
): boolean {
  const old = state.progress.find((p) => p.userId === userId && p.qpviiTimestamp === qpviiTimestamp);

  const record: UserExposureProgress = copy({
    userId,
    qpviiTimestamp,
    videoSequence,
    currentVideoIndex,
    completedVideoIds,
    lastUpdated: Date.now(),
    discomfortRatings,
    explanationShown,
    programCompleted: programCompleted ?? old?.programCompleted ?? false,
    isReview: isReview ?? old?.isReview ?? false,
    reviewCompleted: reviewCompleted ?? old?.reviewCompleted ?? false,
    originalQpviiTimestamp: originalQpviiTimestamp ?? old?.originalQpviiTimestamp,
  });

  state = {
    ...state,
    progress: old ? state.progress.map((p) => (p === old ? record : p)) : [...state.progress, record],
  };

  enqueue('exposure progress', () => api('PUT', '/exposure', record));
  return true;
}

// --- Activity ---------------------------------------------------------------------

export function getDaysSinceLastActivity(userId: string): number | null {
  const user = findUserById(userId);
  if (!user) return null;

  const activities: number[] = [];
  const progress = state.progress.filter((p) => p.userId === userId);
  if (progress.length > 0) activities.push(Math.max(...progress.map((p) => p.lastUpdated)));
  if (user.lastLoginDate) activities.push(user.lastLoginDate);
  if (user.lastAssessmentDate) activities.push(user.lastAssessmentDate);
  if (activities.length === 0) return null;

  return Math.floor((Date.now() - Math.max(...activities)) / (24 * 60 * 60 * 1000));
}

// --- Emails (recorded, not yet actually sent) --------------------------------------

export function getAllSimulatedEmails(): SimulatedEmail[] {
  return copy(state.emails);
}

export function getSimulatedEmailsForPatient(patientId: string): SimulatedEmail[] {
  return copy(state.emails.filter((e) => e.patientId === patientId)).sort((a, b) => b.timestamp - a.timestamp);
}

export function saveSimulatedEmail(email: SimulatedEmail): boolean {
  email = copy(email);
  state = { ...state, emails: [...state.emails.filter((e) => e.id !== email.id), email] };
  if (email.type === 'reminder' && email.status === 'sent') {
    patchCachedUser(email.patientId, { lastReminderSentDate: email.timestamp });
  }
  enqueue('email', () => api('POST', '/emails', email));
  return true;
}

/**
 * Records an inactivity reminder for each listed patient (all visible ones if
 * omitted) who has been inactive `thresholdDays` and was not reminded in the
 * last 5 days. The server decides; returns the ids reminded. `{username}` in
 * the body template is filled in per patient.
 */
async function sendInactivityReminders(
  patientIds: string[] | undefined,
  thresholdDays: number,
  subject: string,
  bodyTemplate: string,
): Promise<string[]> {
  try {
    const { sent } = await api<{ sent: string[] }>('POST', '/reminders/inactivity', { patientIds, thresholdDays, subject, bodyTemplate });
    if (sent.length > 0) await syncStore();
    return sent;
  } catch (err) {
    console.error('[dataStore] sendInactivityReminders:', err);
    return [];
  }
}

export async function checkAndSendInactivityReminder(userId: string, thresholdDays: number, subject: string, body: string): Promise<boolean> {
  return (await sendInactivityReminders([userId], thresholdDays, subject, body)).length > 0;
}

export async function sendAdherenceRemindersToAllInactive(
  therapistId: string,
  thresholdDays: number,
  subject: string,
  bodyTemplate: string,
): Promise<number> {
  const ids = getPatientsForTherapist(therapistId).map((p) => p.id);
  if (ids.length === 0) return 0;
  return (await sendInactivityReminders(ids, thresholdDays, subject, bodyTemplate)).length;
}

// --- AI consultations ---------------------------------------------------------------

export function getAllAiConsultations(): AiConsultation[] {
  return copy(state.consultations);
}

export function saveAiConsultation(consultation: AiConsultation): boolean {
  consultation = copy(consultation);
  state = { ...state, consultations: [...state.consultations.filter((c) => c.id !== consultation.id), consultation] };
  enqueue('AI consultation', () => api('POST', '/ai-consultations', consultation));
  return true;
}

export function getAiConsultationsForTherapist(therapistId: string): AiConsultation[] {
  return copy(state.consultations.filter((c) => c.userId === therapistId)).sort((a, b) => b.timestamp - a.timestamp);
}

export function getAiConsultationsByUserIds(userIds: string[]): AiConsultation[] {
  const ids = new Set(userIds);
  return copy(state.consultations.filter((c) => ids.has(c.userId))).sort((a, b) => b.timestamp - a.timestamp);
}

export function getAiConsultationsForPatient(patientId: string): AiConsultation[] {
  return copy(state.consultations.filter((c) => c.userId === patientId)).sort((a, b) => b.timestamp - a.timestamp);
}

// --- Feedback (public; not part of the synced state) ----------------------------------

export async function fetchTestimonials(): Promise<Feedback[]> {
  try {
    const { testimonials } = await api<{ testimonials: Feedback[] }>('GET', '/feedback/testimonials');
    return testimonials;
  } catch (err) {
    console.error('[dataStore] fetchTestimonials:', err);
    return [];
  }
}

/** The server takes the author's identity from the session, not from `feedback`. */
export async function saveFeedback(feedback: Pick<Feedback, 'id' | 'username' | 'type' | 'rating' | 'comment'>): Promise<boolean> {
  try {
    await api('POST', '/feedback', feedback);
    return true;
  } catch (err) {
    console.error('[dataStore] saveFeedback:', err);
    return false;
  }
}
