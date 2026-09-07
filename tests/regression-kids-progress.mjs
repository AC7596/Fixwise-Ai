// ========================================
// Regression test: FixWise Kids replay / XP / badge counting
// ========================================
// Covers the bug where replaying an already-completed Kids activity (via
// "Do it again") could duplicate XP, inflate the unique completed-activity
// count, and award the "Fixy Helper" badge before every activity in the set
// had actually been completed at least once. Progress must now be based
// strictly on unique first-time completions (completedActivityIds), and
// replays must be safe no-ops for XP/uniqueness purposes.
//
// Run with: node tests/regression-kids-progress.mjs
// Provides a minimal in-memory `window.localStorage` polyfill so this
// module (which is written for the browser) can be exercised headlessly
// under plain Node, without adding any new project dependency.
import assert from 'node:assert/strict';

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  }
};

const { getProgress, awardActivity, resetProgress } = await import('../js/modules/kids-progress.js');

let pass = 0;
function check(label, cond) {
  assert.ok(cond, label);
  console.log(`PASS: ${label}`);
  pass += 1;
}

resetProgress();
const setIds = ['a1', 'a2', 'a3'];

// --- First completion ---
let p = awardActivity('a1', 'tool-scout', setIds);
check('first completion of a1 awards 10 XP', p.xp === 10);
check('first completion of a1 records exactly 1 unique completed id', p.completedActivityIds.length === 1);
check('first completion of a1 awards its badge', p.badges.includes('tool-scout'));
check('fixy-helper is NOT awarded yet (only 1 of 3 activities done)', !p.badges.includes('fixy-helper'));

// --- Replay once ---
p = awardActivity('a1', 'tool-scout', setIds);
check('replaying a1 once does not add XP (still 10)', p.xp === 10);
check('replaying a1 once does not duplicate the completed id (still length 1)', p.completedActivityIds.length === 1);
check('replaying a1 once does not prematurely award fixy-helper', !p.badges.includes('fixy-helper'));

// --- Replay multiple times ---
for (let i = 0; i < 5; i += 1) awardActivity('a1', 'tool-scout', setIds);
p = getProgress();
check('replaying a1 five more times still leaves XP at 10', p.xp === 10);
check('replaying a1 five more times still leaves 1 unique completed id', p.completedActivityIds.length === 1);

// --- Completing several different activities for the first time ---
p = awardActivity('a2', 'measurement-master', setIds);
check('first completion of a2 awards a further 10 XP (total 20)', p.xp === 20);
check('fixy-helper still not awarded (2 of 3 done)', !p.badges.includes('fixy-helper'));

p = awardActivity('a3', 'problem-solver', setIds);
check('first completion of a3 awards a further 10 XP (total 30)', p.xp === 30);
check('fixy-helper badge threshold reached at 3 of 3 unique completions', p.badges.includes('fixy-helper'));
check('level advances correctly from accumulated XP', p.level === Math.floor(30 / 30) + 1);

// --- Replay after the set is fully complete ---
p = awardActivity('a3', 'problem-solver', setIds);
check('replaying a3 after full completion does not add more XP', p.xp === 30);
check('replaying a3 after full completion keeps 3 unique completed ids', p.completedActivityIds.length === 3);
check('fixy-helper badge is not duplicated in the badges list', p.badges.filter(b => b === 'fixy-helper').length === 1);

// --- Simulated reload: progress must survive as valid persisted JSON ---
const persisted = JSON.parse(globalThis.window.localStorage.getItem('fixwiseKidsProgress'));
check('progress persists correctly for a simulated page reload', persisted.xp === 30 && persisted.completedActivityIds.length === 3 && persisted.badges.includes('fixy-helper'));

console.log(`\nregression-kids-progress.mjs: ${pass} checks passed`);
