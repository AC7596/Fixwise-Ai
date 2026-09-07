// ========================================
// REPAIR SESSION: shared parent + child data architecture
// ========================================
// This is the front-end shape of a "repair session" that ties the parent's
// real-world repair (diagnosis + guide + step progress) to the FixWise
// Kids experience, so a child's activity is always based on the SAME
// repair the parent is doing (see problem statement section 11).
//
// For this prototype, sessions live in localStorage. The shape below is
// intentionally what a secure backend record would look like too, so
// moving this to a real API later means swapping the storage calls, not
// redesigning the data.
//
// Session shape:
// {
//   sessionId: string,
//   createdAt: ISO string,
//   updatedAt: ISO string,
//   parentRepair: { guideId, title, category, difficulty, safetyLevel },
//   diagnosis: object|null,        // last diagnosis result, if any
//   stepProgress: { currentIndex, totalSteps, variant, status },
//   tools: string[], parts: string[],
//   photos: string[],              // file names only (no image data stored)
//   childActivities: { completedIds: string[] },
//   fixyLog: [{ context, message, timestamp }]
// }

const SESSION_KEY = 'fixwiseRepairSession';

function nowIso() {
  return new Date().toISOString();
}

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    // Storage unavailable (privacy mode, quota, etc.) — session just won't
    // persist across reloads, but the current page view still works.
  }
}

export function getSession() {
  const raw = safeStorageGet(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function persist(session) {
  session.updatedAt = nowIso();
  safeStorageSet(SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Start (or restart) a repair session for a given guide/repair.
 * @param {object} params
 * @param {string} params.guideId
 * @param {string} params.title
 * @param {string} params.category
 * @param {string} [params.difficulty]
 * @param {string} [params.safetyLevel]
 * @param {number} [params.totalSteps]
 * @param {object|null} [params.diagnosis]
 */
export function startSession({ guideId, title, category, difficulty, safetyLevel, totalSteps, diagnosis }) {
  const session = {
    sessionId: `session-${Date.now()}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    parentRepair: { guideId, title, category, difficulty: difficulty || null, safetyLevel: safetyLevel || 'low' },
    diagnosis: diagnosis || null,
    stepProgress: { currentIndex: 0, totalSteps: totalSteps || 0, variant: null, status: 'in-progress' },
    tools: [],
    parts: [],
    photos: [],
    childActivities: { completedIds: [] },
    fixyLog: []
  };
  return persist(session);
}

export function updateStepProgress(patch) {
  const session = getSession();
  if (!session) return null;
  session.stepProgress = { ...session.stepProgress, ...patch };
  return persist(session);
}

export function completeSession() {
  const session = getSession();
  if (!session) return null;
  session.stepProgress.status = 'completed';
  return persist(session);
}

export function logFixyMessage(context, message) {
  const session = getSession();
  if (!session) return null;
  session.fixyLog = [...(session.fixyLog || []), { context, message, timestamp: nowIso() }].slice(-20);
  return persist(session);
}

export function markChildActivityComplete(activityId) {
  const session = getSession();
  if (!session) return null;
  const completed = new Set(session.childActivities?.completedIds || []);
  completed.add(activityId);
  session.childActivities = { completedIds: Array.from(completed) };
  return persist(session);
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    // Ignore — nothing persisted to clear.
  }
}

/**
 * Returns the guideId for the active parent repair, if any, so FixWise
 * Kids can show an activity set based on what the parent is actually
 * doing right now instead of a generic default.
 */
export function getActiveParentGuideId() {
  const session = getSession();
  return session && session.parentRepair ? session.parentRepair.guideId : null;
}
