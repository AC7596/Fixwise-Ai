// ========================================
// FIXWISE KIDS PROGRESS (localStorage prototype)
// ========================================
// Front-end-only progress tracking: no account required. See problem
// statement section 10. Structure is deliberately simple so it can move to
// a real backend/account system later without changing the badge catalog
// or XP model that other modules depend on.

const PROGRESS_KEY = 'fixwiseKidsProgress';
const XP_PER_LEVEL = 30;
const XP_PER_ACTIVITY = 10;

export const BADGES = {
  'tool-scout': { id: 'tool-scout', label: 'Tool Scout', icon: '🧰', description: 'Learned to identify and choose the right tool.' },
  'measurement-master': { id: 'measurement-master', label: 'Measurement Master', icon: '📏', description: 'Practiced counting and measuring like a pro.' },
  'safety-spotter': { id: 'safety-spotter', label: 'Safety Spotter', icon: '🛡️', description: 'Knows which jobs belong to grown-ups.' },
  'problem-solver': { id: 'problem-solver', label: 'Problem Solver', icon: '🧩', description: 'Figured out the right order and reasoning.' },
  'money-smart': { id: 'money-smart', label: 'Money Smart', icon: '💰', description: 'Learned what repairs and parts really cost.' },
  'zee-helper': { id: 'zee-helper', label: 'Zee Helper', icon: '⭐', description: 'Completed a full activity set with Zee.' }
};

function defaultProgress() {
  return { xp: 0, level: 1, badges: [], completedActivityIds: [] };
}

function safeGet() {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = { ...defaultProgress(), ...JSON.parse(raw) };
    parsed.badges = Array.from(new Set((parsed.badges || []).map(b => b === 'fixy-helper' ? 'zee-helper' : b)));
    return parsed;
  } catch (err) {
    return defaultProgress();
  }
}

function safeSet(progress) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    // Ignore — progress just won't persist this session.
  }
}

export function getProgress() {
  return safeGet();
}

export function resetProgress() {
  safeSet(defaultProgress());
  return defaultProgress();
}

/**
 * Record a completed activity, awarding XP and its badge (once).
 * Replaying an activity that's already in completedActivityIds must be a
 * safe no-op for XP/uniqueness purposes — only the very first completion
 * of a given activityId should add XP or count toward set-completion.
 * @param {string} activityId
 * @param {string} badgeId one of BADGES keys
 * @param {string[]} [setActivityIds] every activity id in the activity's
 *   set, used to award "Zee Helper" once every one of them has been
 *   completed at least once (computed from the authoritative
 *   completedActivityIds list — never from a caller-supplied count — so a
 *   replay can never inflate or miscalculate this threshold).
 */
export function awardActivity(activityId, badgeId, setActivityIds) {
  const progress = safeGet();
  const alreadyDone = progress.completedActivityIds.includes(activityId);

  if (!alreadyDone) {
    progress.completedActivityIds.push(activityId);
    progress.xp += XP_PER_ACTIVITY;
  }
  if (badgeId && !progress.badges.includes(badgeId)) {
    progress.badges.push(badgeId);
  }
  if (Array.isArray(setActivityIds) && setActivityIds.length) {
    const completedInSet = setActivityIds.filter(id => progress.completedActivityIds.includes(id)).length;
    if (completedInSet >= setActivityIds.length && !progress.badges.includes('zee-helper')) {
      progress.badges.push('zee-helper');
    }
  }
  progress.level = Math.max(1, Math.floor(progress.xp / XP_PER_LEVEL) + 1);

  safeSet(progress);
  return progress;
}

export function xpForNextLevel(progress) {
  const currentLevelFloor = (progress.level - 1) * XP_PER_LEVEL;
  return { current: progress.xp - currentLevelFloor, needed: XP_PER_LEVEL };
}
