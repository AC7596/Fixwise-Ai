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
  'fixy-helper': { id: 'fixy-helper', label: 'Fixy Helper', icon: '⭐', description: 'Completed a full activity set with Fixy.' }
};

function defaultProgress() {
  return { xp: 0, level: 1, badges: [], completedActivityIds: [] };
}

function safeGet() {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    return { ...defaultProgress(), ...JSON.parse(raw) };
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
 * @param {string} activityId
 * @param {string} badgeId one of BADGES keys
 * @param {number} [totalActivitiesInSet] used to also award "Fixy Helper"
 *   when every activity in the current set has now been completed.
 * @param {number} [completedInSetCount]
 */
export function awardActivity(activityId, badgeId, totalActivitiesInSet, completedInSetCount) {
  const progress = safeGet();
  const alreadyDone = progress.completedActivityIds.includes(activityId);

  if (!alreadyDone) {
    progress.completedActivityIds.push(activityId);
    progress.xp += XP_PER_ACTIVITY;
  }
  if (badgeId && !progress.badges.includes(badgeId)) {
    progress.badges.push(badgeId);
  }
  if (totalActivitiesInSet && completedInSetCount >= totalActivitiesInSet && !progress.badges.includes('fixy-helper')) {
    progress.badges.push('fixy-helper');
  }
  progress.level = Math.max(1, Math.floor(progress.xp / XP_PER_LEVEL) + 1);

  safeSet(progress);
  return progress;
}

export function xpForNextLevel(progress) {
  const currentLevelFloor = (progress.level - 1) * XP_PER_LEVEL;
  return { current: progress.xp - currentLevelFloor, needed: XP_PER_LEVEL };
}
