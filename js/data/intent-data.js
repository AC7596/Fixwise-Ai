// ========================================
// INTENT UNDERSTANDING (front-end demo)
// ========================================
// A real AI backend will eventually classify user intent with a language
// model. Until then, this module is a structured, rule-based stand-in that
// distinguishes *what the homeowner is trying to do* from *what the
// symptoms are*. That distinction is the difference between:
//   "I want to replace my outlets."        -> INTENT.REPLACE
//   "My outlet isn't working."              -> INTENT.TROUBLESHOOT
// Treating those the same (matching only on the word "outlet") is the bug
// this module exists to fix. See js/api/ai-client.js for how this is used
// alongside js/data/safety-data.js (symptom-based risk) and
// js/data/diagnosis-data.js (malfunction knowledge base).

export const INTENT = {
  TROUBLESHOOT: 'troubleshoot',
  REPAIR: 'repair',
  REPLACE: 'replace',
  INSTALL: 'install',
  MAINTENANCE: 'maintenance',
  INSPECTION: 'inspection',
  UPGRADE: 'upgrade',
  HOW_IT_WORKS: 'how_it_works',
  EMERGENCY: 'emergency'
};

// Human-facing copy for "here is what FixWise understands you're trying to
// do", always phrased as an interpretation rather than a fact.
export const INTENT_META = {
  [INTENT.EMERGENCY]: {
    label: 'Possible emergency / safety hazard',
    understanding: 'this sounds like it may be an active safety hazard, not a routine repair question'
  },
  [INTENT.TROUBLESHOOT]: {
    label: 'Troubleshooting a malfunction',
    understanding: 'you\'re trying to figure out why something isn\'t working the way it should'
  },
  [INTENT.REPAIR]: {
    label: 'Repairing something',
    understanding: 'you\'re looking to fix or restore something that is damaged or not functioning correctly'
  },
  [INTENT.REPLACE]: {
    label: 'Replacing something',
    understanding: 'you\'re planning to swap out an existing item for a new one'
  },
  [INTENT.INSTALL]: {
    label: 'Installing something new',
    understanding: 'you\'re setting up something that isn\'t already in place'
  },
  [INTENT.MAINTENANCE]: {
    label: 'Routine maintenance',
    understanding: 'you\'re doing routine upkeep rather than responding to a specific problem'
  },
  [INTENT.INSPECTION]: {
    label: 'Inspecting / checking something',
    understanding: 'you want to look something over and understand its condition, not necessarily fix anything yet'
  },
  [INTENT.UPGRADE]: {
    label: 'Improving / upgrading',
    understanding: 'you\'re looking to improve on something that already works, not fix a failure'
  },
  [INTENT.HOW_IT_WORKS]: {
    label: 'Understanding how something works',
    understanding: 'you want to understand how this works before deciding what to do'
  }
};

// Ordered intent detectors. Order matters: more specific "intentional
// action" phrasing (replace/install/maintenance/inspection/upgrade/how it
// works) is checked BEFORE generic malfunction language, so a sentence like
// "I want to replace my outlets" is never forced into the troubleshooting
// bucket just because it mentions a component that also appears in a
// failure-related word list.
const DETECTORS = [
  {
    intent: INTENT.HOW_IT_WORKS,
    patterns: [
      /\bhow (does|do|did|would|can|could) .*\bwork/i,
      /\bwhy (does|do|did) .*\b(work|happen|do that)/i,
      /\bwhat (is|are|does) .*\b(for|do)\b/i,
      /\bexplain (how|why|what)/i,
      /\bcurious (how|why|about)\b/i
    ]
  },
  {
    intent: INTENT.REPLACE,
    patterns: [
      /\breplac(e|ing|ement|es)\b/i,
      /\bswap(ping)? out\b/i,
      /\bnew (outlet|faucet|switch|breaker|toilet|water heater|thermostat|fixture|unit|filter|window|door)\b/i,
      /\bget rid of (the|my|this) old\b/i,
      /\bput in a new\b/i
    ]
  },
  {
    intent: INTENT.INSTALL,
    patterns: [
      /\binstall(ing|ation|s|ed)?\b/i,
      /\bhook(ing)? up\b/i,
      /\badd(ing)? a new\b/i,
      /\bwire in a new\b/i,
      /\bmount(ing)? a new\b/i
    ]
  },
  {
    intent: INTENT.UPGRADE,
    patterns: [
      /\bupgrad(e|ing|es|ed)\b/i,
      /\bmoderniz(e|ing)\b/i,
      /\bimprove (the|my)\b/i,
      /\bmore efficient\b/i,
      /\bnicer looking\b/i
    ]
  },
  {
    intent: INTENT.MAINTENANCE,
    patterns: [
      /\bmaintenance\b/i,
      /\btune[- ]?up\b/i,
      /\bseasonal (check|service|maintenance)\b/i,
      /\bclean(ing)? (the|my|out)\b/i,
      /\bhow often should i\b/i,
      /\broutine (check|service)\b/i
    ]
  },
  {
    intent: INTENT.INSPECTION,
    patterns: [
      /\binspect(ion|ing|ed)?\b/i,
      /\bcheck(ing)? (if|whether|on)\b/i,
      /\blook(ing)? (it |this )?over\b/i,
      /\bassess(ing|ment)?\b/i,
      /\bmake sure (it'?s|it is|everything is) (ok|okay|fine|safe)\b/i
    ]
  },
  {
    intent: INTENT.REPAIR,
    patterns: [
      /\brepair(ing|ed|s)?\b/i,
      /\bfix(ing|ed)?\b/i,
      /\bpatch(ing|ed)?\b/i
    ]
  },
  {
    intent: INTENT.TROUBLESHOOT,
    patterns: [
      /\bnot working\b/i,
      /\bwon'?t (work|start|turn on|stop|open|close|latch|drain|heat|cool)\b/i,
      /\bdoesn'?t (work|turn on|start|drain|heat|cool)\b/i,
      /\bstopped (working|running|draining|heating|cooling)\b/i,
      /\bbroken\b/i,
      /\bfailing\b/i,
      /\bkeeps? (tripping|dripping|running|leaking|stopping)\b/i,
      /\bwhy is\b/i,
      /\bwhat'?s wrong\b/i,
      /\bissue\b/i,
      /\bproblem\b/i
    ]
  }
];

/**
 * Classify the primary intent behind a homeowner's free-text description.
 * Returns the first matching intent using the priority order above, or
 * `null` if nothing recognizable was found (the caller should treat that
 * as "not enough information yet" rather than guessing).
 * @param {string} text combined, lowercased description text
 * @returns {{ intent: string, meta: object } | null}
 */
export function classifyIntent(text) {
  const normalized = (text || '').toLowerCase();
  if (!normalized.trim()) return null;

  for (const detector of DETECTORS) {
    if (detector.patterns.some(pattern => pattern.test(normalized))) {
      return { intent: detector.intent, meta: INTENT_META[detector.intent] };
    }
  }
  return null;
}

// Intents where the homeowner is describing an *intentional action* rather
// than reporting something broken. For these, FixWise should not assume a
// malfunction exists just because a component name matches a keyword.
export const INTENTIONAL_ACTION_INTENTS = new Set([
  INTENT.REPLACE, INTENT.INSTALL, INTENT.MAINTENANCE, INTENT.INSPECTION,
  INTENT.UPGRADE, INTENT.HOW_IT_WORKS
]);

// Generic, intent-shaped clarifying questions used as a fallback when there
// is no more specific category+intent entry in CATEGORY_INTENT_QUESTIONS
// below. Kept short and homeowner-friendly, never assuming an answer.
const GENERIC_INTENT_QUESTIONS = {
  [INTENT.REPLACE]: [
    'Is the current one still working, or has it failed or been damaged?',
    'Do you already have the replacement part/unit, or are you deciding what to buy?',
    'Is there any sign of damage, wear, corrosion, or heat on the current one?'
  ],
  [INTENT.INSTALL]: [
    'Is this a brand-new installation, or are you replacing something that was removed?',
    'Do you have the manufacturer instructions for this specific model?',
    'Do you know whether the existing wiring, plumbing, or framing supports this addition?'
  ],
  [INTENT.MAINTENANCE]: [
    'About how long has it been since this was last serviced or cleaned?',
    'Are you noticing any performance changes, or is this purely routine upkeep?'
  ],
  [INTENT.INSPECTION]: [
    'What specifically prompted you to take a closer look?',
    'Have you noticed anything unusual, or is this a routine check?'
  ],
  [INTENT.UPGRADE]: [
    'What\'s motivating the upgrade — performance, appearance, efficiency, or a problem you\'ve noticed?',
    'Do you know if your current setup can support the upgrade (wiring, plumbing, framing, capacity)?'
  ],
  [INTENT.HOW_IT_WORKS]: [
    'What part of how it works are you most curious about?'
  ]
};

// Category + intent specific clarifying questions. This is where FixWise
// gets genuinely conversational instead of generic. Add more entries here
// as the knowledge base grows — the key is `${category}:${intent}` using
// the same category keys as js/data/diagnosis-data.js.
export const CATEGORY_INTENT_QUESTIONS = {
  'electrical:replace': [
    'Are you replacing an existing working outlet, or one that has failed or shows damage?',
    'Is this a standard outlet, a GFCI, an AFCI, or a USB-style outlet?',
    'Do you see any signs of heat, burning smell, discoloration, sparking, or damaged wiring?',
    'Do you know whether the circuit can be safely de-energized (breaker clearly labeled)?'
  ],
  'electrical:install': [
    'Is this a brand-new circuit/outlet location, or extending an existing one?',
    'Do you know the amperage/wire gauge already in use on that circuit?',
    'Will this be done with the breaker off and verified with a non-contact voltage tester?'
  ],
  'electrical:upgrade': [
    'Is this an upgrade for capacity (e.g. more amps), safety (GFCI/AFCI), or appearance?',
    'Do you know the age and condition of the existing wiring and panel?'
  ],
  'electrical:inspection': [
    'Is anything currently behaving unusually, or is this a routine safety check?',
    'Do you have a non-contact voltage tester available for a safe visual check?'
  ],
  'plumbing:replace': [
    'What type of faucet is it — cartridge, compression (two-handle with washers), ceramic-disc, or ball-type?',
    'Is the current fixture leaking, damaged, or simply outdated?',
    'Do you know where the shutoff valves are, and do they turn easily?'
  ],
  'plumbing:install': [
    'Is there existing plumbing in place (supply lines, drain) for this fixture?',
    'Do you have the manufacturer\'s installation instructions for this exact model?'
  ],
  'plumbing:maintenance': [
    'Is this routine (e.g. seasonal water heater flush) or prompted by something you noticed?',
    'Do you know the age of the fixture or appliance involved?'
  ],
  'heating & cooling:replace': [
    'Are you replacing a filter/thermostat/component, or the whole system?',
    'Is the current unit still running, or has it already failed?'
  ],
  'heating & cooling:maintenance': [
    'Is this a seasonal tune-up, or have you noticed a change in performance?',
    'When was the filter last changed?'
  ],
  'appliance:replace': [
    'Is the current appliance still working, or has it failed?',
    'Do you know the model number, so parts/instructions match exactly?'
  ],
  'doors & windows:replace': [
    'Are you replacing hardware (hinges, lock) or the entire door/window unit?',
    'Is the current one damaged, or just being upgraded?'
  ]
};

/**
 * Get clarifying questions appropriate for a given category + intent,
 * falling back to generic intent-level questions if no specific entry
 * exists yet.
 * @param {string} categoryKey lowercased category key
 * @param {string} intent one of INTENT.*
 * @returns {string[]}
 */
export function getIntentFollowUpQuestions(categoryKey, intent) {
  const specific = CATEGORY_INTENT_QUESTIONS[`${categoryKey}:${intent}`];
  if (specific && specific.length) return specific;
  return GENERIC_INTENT_QUESTIONS[intent] || [];
}
