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
const HISTORY_KEY = 'fixwiseRepairSessionHistory';

function nowIso() {
  return new Date().toISOString();
}

function getStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function safeStorageGet(key) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (err) {
    return null;
  }
}

function safeStorageSet(key, value) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
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
  const persisted = persist(session);
  appendSessionToHistory(persisted);
  return persisted;
}

export function updateStepProgress(patch) {
  const session = getSession();
  if (!session) return null;
  session.stepProgress = { ...session.stepProgress, ...patch };
  const persisted = persist(session);
  appendSessionToHistory(persisted);
  return persisted;
}

export function completeSession() {
  const session = getSession();
  if (!session) return null;
  session.stepProgress.status = 'completed';
  const persisted = persist(session);
  appendSessionToHistory(persisted);
  return persisted;
}

export function logFixyMessage(context, message) {
  const session = getSession();
  if (!session) return null;
  session.fixyLog = [...(session.fixyLog || []), { context, message, timestamp: nowIso() }].slice(-20);
  const persisted = persist(session);
  appendSessionToHistory(persisted);
  return persisted;
}

export function markChildActivityComplete(activityId) {
  const session = getSession();
  if (!session) return null;
  const completed = new Set(session.childActivities?.completedIds || []);
  completed.add(activityId);
  session.childActivities = { completedIds: Array.from(completed) };
  const persisted = persist(session);
  appendSessionToHistory(persisted);
  return persisted;
}

export function clearSession() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_KEY);
  } catch (err) {
    // Ignore — nothing persisted to clear.
  }
}

export function getSessionHistory() {
  const raw = safeStorageGet(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function writeSessionHistory(history) {
  const next = Array.isArray(history) ? history.slice(0, 25) : [];
  safeStorageSet(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function appendSessionToHistory(session) {
  if (!session) return getSessionHistory();
  const history = getSessionHistory();
  const existingIndex = history.findIndex(item => item.sessionId === session.sessionId);
  const nextEntry = {
    ...session,
    reviewedAt: nowIso()
  };
  const next = [...history];
  if (existingIndex >= 0) next[existingIndex] = nextEntry;
  else next.unshift(nextEntry);
  return writeSessionHistory(next);
}

export function summarizeUsagePatterns(sessions = getSessionHistory()) {
  const items = Array.isArray(sessions) ? sessions : [];
  const categoryCounts = {};
  let completed = 0;
  let inProgress = 0;

  for (const session of items) {
    const category = session.parentRepair?.category || 'General';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    const status = session.stepProgress?.status || 'in-progress';
    if (status === 'completed') completed += 1;
    else inProgress += 1;
  }

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    totalSessions: items.length,
    completed,
    inProgress,
    categoryCounts,
    topCategory: topCategory ? topCategory[0] : null,
    topCategoryCount: topCategory ? topCategory[1] : 0,
    completionRate: items.length ? (completed / items.length) * 100 : 0
  };
}

export function getPersonalizedTips(sessions = getSessionHistory()) {
  const pattern = summarizeUsagePatterns(sessions);
  const tips = [];

  if (!pattern.totalSessions) {
    return [
      'Start a few small repair sessions so Chronicle can learn your most common categories and build tailored advice.',
      'Keep a photo of the issue before disassembly to make each repair easier and safer.'
    ];
  }

  if (pattern.topCategory) {
    const categoryTips = {
      Plumbing: 'Keep a drain snake, plumber’s tape, and a bucket ready for quick sink and pipe checks.',
      Electrical: 'Keep a flashlight, voltage tester, and a clear list of circuit labels handy before you start.',
      'Heating & Cooling': 'Keep a thermostat check and filter inspection as part of your routine maintenance pass.',
      Appliance: 'Document the exact symptom and model number before you remove panels or try a component swap.',
      'Doors & Windows': 'Carry a small level and a quick photo of the gap so you can compare before and after.',
      Structural: 'Take photos of cracks and moisture changes so you can track whether the issue is spreading.',
      'Automotive / Home Equipment': 'Keep a clean work area and a checklist of tools before you begin any equipment repair.',
      'Other': 'Build a simple problem-and-solution log so recurring issues are easier to spot.'
    };

    const suggestion = categoryTips[pattern.topCategory] || 'Stay consistent with a basic prep checklist so your next repair is safer and faster.';
    tips.push(`Your recent repair history leans toward ${pattern.topCategory}. ${suggestion}`);
  }

  if (pattern.completionRate >= 60) {
    tips.push('You finish many repair sessions cleanly; keep a “before photo + tool list” habit to make each next fix even smoother.');
  } else {
    tips.push('You often pause before the final step. Try documenting the exact symptom, safety warning, and the first thing you checked before resuming.');
  }

  if (pattern.inProgress > 0) {
    tips.push('Your history suggests a few sessions stop mid-stream. A quick photo and a short note about what changed often helps you restart without guesswork.');
  }

  if (pattern.topCategoryCount > 1) {
    tips.push(`You revisit ${pattern.topCategory} more than once. Save a reusable checklist for that category so your next session starts from a proven pattern.`);
  }

  return tips.slice(0, 4);
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
