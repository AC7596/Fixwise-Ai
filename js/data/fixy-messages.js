// ========================================
// FIXY MESSAGES: personality data
// ========================================
// Centralized so js/modules/kids.js (mascot tap) and js/modules/repair-mode.js
// / js/modules/kids-activities.js (contextual reactions) all draw from the
// same voice. Structured by context so Fixy can react appropriately instead
// of showing a random unrelated line. Keep this data-only (no DOM) so a
// future animated/illustrated Fixy component can reuse it unchanged.
//
// Fixy's core philosophy, always preserved:
//   "I don't know yet — let's figure it out!"
// Personality: curious, encouraging, practical, funny without being
// annoying, never pretends to know something it doesn't, celebrates
// problem-solving, and teaches that not knowing is okay.

export const FIXY_CONTEXT = {
  IDLE: 'idle',
  START_REPAIR: 'start_repair',
  SOLVED_PROBLEM: 'solved_problem',
  MISTAKE: 'mistake',
  LEARNED_TOOL: 'learned_tool',
  MEASUREMENT: 'measurement',
  FINISHED_ACTIVITY: 'finished_activity',
  UNSAFE: 'unsafe'
};

export const FIXY_MESSAGES = {
  [FIXY_CONTEXT.IDLE]: [
    'I don\'t know yet — let\'s figure it out!',
    'Every builder started as a beginner!',
    'Tools are just answers to "how do I do that?"',
    'Mistakes help us learn how things really work.',
    'Let\'s measure twice before we decide anything!',
    'Curious minds fix the best stuff.',
    'A good question is half of a good repair.',
    'I love a mystery. Especially a squeaky-floor mystery.'
  ],
  [FIXY_CONTEXT.START_REPAIR]: [
    'New repair, new adventure — let\'s go step by step!',
    'First things first: let\'s see what we\'re working with.',
    'I\'m ready when you are. One step at a time!',
    'Let\'s figure this out together, nice and safe.'
  ],
  [FIXY_CONTEXT.SOLVED_PROBLEM]: [
    'Nailed it! That\'s what careful checking looks like.',
    'You found it! That\'s real problem-solving.',
    'Boom — mystery solved. Great work.',
    'That\'s the good stuff. You figured it out!'
  ],
  [FIXY_CONTEXT.MISTAKE]: [
    'No worries — that\'s how we learn what NOT to do next time!',
    'Not knowing is okay. Let\'s figure it out together.',
    'Even pros redo steps sometimes. Let\'s try again.',
    'That\'s not a fail, that\'s a fact-finding mission.'
  ],
  [FIXY_CONTEXT.LEARNED_TOOL]: [
    'Nice! Now you know what that tool is for.',
    'One more tool unlocked in your brain-toolbox!',
    'Tools make sense once you know their job — you just learned one.'
  ],
  [FIXY_CONTEXT.MEASUREMENT]: [
    'Measuring first saves fixing twice!',
    'Numbers don\'t lie — good measuring!',
    'That\'s exactly why we measure before we cut or buy.'
  ],
  [FIXY_CONTEXT.FINISHED_ACTIVITY]: [
    'Activity complete! You\'re getting the hang of this.',
    'You did it! I\'m adding that to your Junior Helper badges.',
    'That\'s a wrap on this one — nice work, helper!'
  ],
  [FIXY_CONTEXT.UNSAFE]: [
    'Whoa — that one is a grown-up-only job. Let\'s watch instead!',
    'Good instinct asking! Some jobs are for pros and parents only.',
    'That\'s a "hands off, eyes on" job. Safety first, always.'
  ]
};

/**
 * Pick a message for a given context, avoiding an immediate repeat.
 * @param {string} context one of FIXY_CONTEXT.*
 * @param {string} [previous] previously shown message to avoid repeating
 */
export function getFixyMessage(context, previous) {
  const pool = FIXY_MESSAGES[context] || FIXY_MESSAGES[FIXY_CONTEXT.IDLE];
  if (pool.length === 1) return pool[0];
  let next = previous;
  while (next === previous) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next;
}
