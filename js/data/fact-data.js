// ========================================
// SESSION FACT EXTRACTION & REASONING (front-end demo)
// ========================================
// This module is the "memory" of the demo diagnosis engine. It turns the
// homeowner's own words — the original description AND every follow-up
// answer in the current diagnosis session — into explicit facts
// (e.g. { key: 'applianceRuns', value: true, subject: 'dryer' }) that the
// rest of the engine reasons over:
//
//   1. extractFacts()          — pull useful facts out of each message,
//                                separately, so newer answers never re-ask
//                                or overwrite what is already known.
//   2. findContradiction()     — a later answer that directly conflicts
//                                with an earlier one is surfaced so FixWise
//                                can ask the homeowner to clarify instead
//                                of silently picking one reading.
//   3. conditionMatches()      — declarative { all, any, not, negated }
//                                checks used by knowledge-base entries
//                                (js/data/diagnosis-data.js) to pick the
//                                right sub-issue (no-heat vs no-start) and
//                                to drop causes/questions that contradict
//                                an established fact.
//   4. filterAnsweredQuestions — never ask a question whose condition is
//                                already resolved by known facts.
//
// A real AI backend replaces this with model-side reasoning, but the demo
// engine must model the same behavior so the swap (see BACKEND.md) keeps
// the same response shape. Nothing here is dryer-specific: generic power /
// heat / water-flow / leak timing patterns work across plumbing,
// electrical, HVAC, doors/windows, kitchens, bathrooms, and general home
// repair, and additional subjects are registered in SUBJECT_FACT_RULES.

// (keyword matching is local to this module — see kwMatches above)

// ----------------------------------------------------------------------
// Subject detection: which specific item/system the message is about.
// Fact rules can then be registered per subject (e.g. "powerType" only
// makes sense once we know it's a dryer or an oven). Longer phrases are
// matched before shorter ones so "washing machine" wins over "machine".
// `has`/`hasNot` scopes the subject to the right category of problem so,
// for example, "drip irrigation line" in a plumbing question is not
// misread as a "dripping faucet" issue.
// ----------------------------------------------------------------------
const SUBJECT_KEYWORDS = [
  { subject: 'dryer', keywords: ['dryer', 'tumble dryer', 'clothes dryer'] },
  { subject: 'washer', keywords: ['washer', 'washing machine'] },
  { subject: 'refrigerator', keywords: ['refrigerator', 'fridge', 'freezer'] },
  { subject: 'oven', keywords: ['oven', 'stove', 'range', 'cooktop', 'cooker'] },
  { subject: 'dishwasher', keywords: ['dishwasher'] },
  { subject: 'microwave', keywords: ['microwave'] },
  { subject: 'furnace', keywords: ['furnace', 'boiler', 'heater', 'hvac', 'heat pump'] },
  { subject: 'air conditioner', keywords: ['air conditioner', 'ac unit', 'a/c', 'condenser', 'central air'] },
  { subject: 'toilet', keywords: ['toilet'] },
  { subject: 'faucet', keywords: ['faucet', 'tap', 'sink', 'shower', 'tub', 'spigot'], has: ['drip', 'leak', 'water', 'flow', 'pressure', 'running'], hasNot: ['drip irrigation', 'irrigation'] },
  { subject: 'outlet', keywords: ['outlet', 'socket', 'receptacle', 'plug'] },
  { subject: 'breaker', keywords: ['breaker', 'fuse box', 'electrical panel', 'panel'] },
  { subject: 'switch', keywords: ['light switch', 'switch'], has: ['light', 'lamp', 'switch', 'flip', 'toggle', 'dim'] },
  { subject: 'door', keywords: ['door', 'hinge', 'deadbolt', 'latch'] },
  { subject: 'window', keywords: ['window', 'windowpane'] },
  { subject: 'drain', keywords: ['drain', 'garbage disposal', 'disposal'] },
  { subject: 'water heater', keywords: ['water heater', 'hot water tank', 'geyser'] }
];

// ----------------------------------------------------------------------
// Generic fact rules: checked against every message regardless of subject
// (a generic rule may still use `subject`/`hasNot` guards). Each rule adds
// at most one fact per message; keyed rules record `source` so a later
// answer can refine an open value (e.g. "won't heat" -> "electric") and so
// contradictory repeats can be detected by findContradiction().
// Values: true (positive), false (negated), or a string (open value).
// ----------------------------------------------------------------------
const GENERIC_FACT_RULES = [
  // ---- powered / running state ----
  // "won't turn on/start" => not running. "doesn't turn on/start" is
  // handled as the negated form of the positive "turns on/starts"
  // keywords below, so "the display doesn't turn on" does not claim the
  // whole appliance is dead.
  {
    key: 'runs', value: true,
    keywords: [
      'turns on', 'does turn on', 'it runs', 'still runs', 'runs fine', 'runs normally',
      'powers on', 'powered on', 'is running', 'comes on', 'starts up', 'does start',
      'spins', 'tumbles', 'drum turns', 'motor runs', 'fan runs', 'hums'
    ],
    // "X but Y" affirms X — "runs but doesn't heat" still means it runs.
    // positiveOverride phrases are checked BEFORE the plain keywords so a
    // contrastive opener records the positive fact (the contrasting clause
    // is picked up separately, by the other rules).
    positiveOverride: ['runs but', 'runs, but', 'turns on but', 'starts but', 'starts, but'],
    negated: ["doesn't run", 'does not run', 'not running', 'never runs', "won't run", 'will not run', "doesn't turn on", 'does not turn on', "doesn't start", 'does not start', 'never starts', "doesn't come on", 'does not come on']
  },
  { key: 'runs', value: false, keywords: ["won't turn on", 'will not turn on', "won't start", 'will not start', 'not starting', 'no power', 'completely dead', 'won\'t power on', 'will not power on', 'does nothing when'] },
  // Functional state for things that don't "run" (outlets, switches,
  // lights): "works but gets hot" affirms function; the contrastive form
  // is checked first, then the plain positives, then the negations.
  {
    key: 'runs', value: true,
    keywords: ['it works', 'still works', 'works fine', 'works normally', 'does work'],
    positiveOverride: ['works but', 'works, but', 'worked but', 'works but'],
    negated: ["doesn't work", 'does not work', "isn't working", 'is not working', 'not working', "won't work", 'will not work']
  },

  // ---- heat production ----
  // "not getting hot" / "no heat" etc. => heat false. Positive "heats up"
  // style phrases exist for completeness (e.g. "it heats but takes forever"
  // records BOTH heats=true and slowProgress=true below — complementary
  // facts, not a contradiction).
  {
    key: 'heats', value: true,
    keywords: ['heats up', 'does heat', 'gets hot', 'produces heat', 'warms up', 'gets warm', 'slightly warm', 'still heats', 'has heat'],
    // Overheating-symptom phrasing ("gets hot to the touch", "gets hot
    // when it shouldn't") is a genuine heat-present reading, NOT a
    // negation — it lives in `negated` only historically and would flip
    // the value, so it is deliberately not listed here.
    negated: ['never gets hot', 'never heats up']
  },
  {
    key: 'heats', value: false,
    keywords: [
      "doesn't get hot", 'does not get hot', "doesn't heat", 'does not heat', 'not heating',
      'no heat', "won't heat", 'will not heat', 'not getting hot', "isn't getting hot", 'is not getting hot',
      "isn't heating", 'is not heating', "won't get hot", 'will not get hot', 'no hot air',
      'stays cold', 'blows cold', 'cold air only', 'never gets hot', 'never heats', "doesn't get warm", 'not getting warm'
    ]
  },

  // ---- drum / agitator movement ( washers & dryers mostly, but generic ) ----
  { key: 'drumTurns', value: true, keywords: ['drum turns', 'drum spins', 'drum rotates', 'tumbling normally', 'drum does turn'] },
  { key: 'drumTurns', value: false, keywords: ["drum doesn't turn", 'drum does not turn', "drum won't turn", 'drum will not turn', 'drum not turning', "drum isn't turning", 'drum is not turning', 'drum not spinning', "drum doesn't spin", 'drum does not spin', 'drum not tumbling', "doesn't tumble", 'not tumbling'] },

  // ---- water flow / drainage (plumbing, washers, dishwashers) ----
  { key: 'waterFlow', value: true, keywords: ['water flows', 'water comes out', 'water runs', 'has water', 'getting water', 'fills with water', 'does fill'] },
  { key: 'waterFlow', value: false, keywords: ['no water', "won't fill", 'will not fill', 'not filling', 'no water coming', 'no water comes out', "doesn't fill", 'does not fill', 'water not coming out', 'barely any water'] },
  { key: 'drains', value: true, keywords: ['drains fine', 'drains normally', 'it drains', 'does drain', 'empties fine'] },
  { key: 'drains', value: false, keywords: ["won't drain", 'will not drain', 'not draining', "doesn't drain", 'does not drain', 'drains slowly', 'draining slowly', 'slow to drain', 'standing water', 'water pooling'] },

  // ---- leak presence / timing ----
  { key: 'leaks', value: true, keywords: ['leaking', 'leaks', 'dripping', 'drips', 'puddle', 'water on the floor', 'water under'] },
  { key: 'leakTiming', value: 'during operation', keywords: ['only when running', 'only while running', 'when it runs', 'while it runs', 'during the cycle', 'only when on', 'when in use', 'only when the water is running', 'when water is running', 'while running'] },
  { key: 'leakTiming', value: 'constant', keywords: ['leaks all the time', 'constantly leaking', 'leaks constantly', 'even when off', 'even when not running', 'drips constantly', 'constant drip'] },

  // ---- cooling ----
  { key: 'cools', value: true, keywords: ['cools fine', 'gets cold', 'does cool', 'blows cold', 'stays cold', 'is cooling'] },
  { key: 'cools', value: false, keywords: ['not cooling', "isn't cooling", 'is not cooling', "won't cool", 'will not cool', 'no cold air', 'blows warm', 'blowing warm', 'not getting cold', 'never gets cold', 'barely cool'] },

  // ---- gradual degradation ("slowly takes longer", "getting weaker") ----
  { key: 'slowProgress', value: true, keywords: ['takes longer', 'taking longer', 'getting weaker', 'gradually worse', 'getting worse', 'slowly gotten worse', 'less and less', 'weaker airflow', 'takes forever', 'takes two cycles', 'multiple cycles to dry'] },

  // ---- weak airflow / circulation ----
  { key: 'weakAirflow', value: true, keywords: ['weak airflow', 'little airflow', 'barely any air', 'poor airflow', 'no airflow', 'weak air flow', 'vent barely blows', 'outside vent is weak'] }
];

// ----------------------------------------------------------------------
// Per-subject fact rules: only checked once the subject is known (either
// from this message or earlier in the session) — e.g. only a dryer/oven
// has a gas-vs-electric "powerType".
// ----------------------------------------------------------------------
const SUBJECT_FACT_RULES = {
  dryer: [
    { key: 'powerType', value: 'electric', keywords: ["it's electric", 'it is electric', 'is electric', 'actually electric', 'electric dryer', 'electric one', 'plugged into a 240', '240 volt', '240v'], negated: ['not electric', "isn't electric", 'is not electric'] },
    { key: 'powerType', value: 'gas', keywords: ["it's gas", 'it is gas', 'is gas', 'actually gas', 'gas dryer', 'gas one', 'runs on gas', 'gas powered', 'gas-powered'], negated: ['not gas', "isn't gas", 'is not gas'] }
  ],
  oven: [
    { key: 'powerType', value: 'electric', keywords: ["it's electric", 'it is electric', 'electric oven', 'electric stove', 'electric range'], negated: ['not electric', "isn't electric", 'is not electric'] },
    { key: 'powerType', value: 'gas', keywords: ["it's gas", 'it is gas', 'gas oven', 'gas stove', 'gas range', 'runs on gas'], negated: ['not gas', "isn't gas", 'is not gas'] }
  ],
  furnace: [
    { key: 'powerType', value: 'electric', keywords: ['electric furnace', 'electric heater'], negated: ['not electric', "isn't electric", 'is not electric'] },
    { key: 'powerType', value: 'gas', keywords: ['gas furnace', 'gas heater', 'runs on gas', 'natural gas', 'propane'], negated: ['not gas', "isn't gas", 'is not gas'] }
  ],
  'water heater': [
    { key: 'powerType', value: 'electric', keywords: ['electric water heater'], negated: ['not electric', "isn't electric"] },
    { key: 'powerType', value: 'gas', keywords: ['gas water heater', 'runs on gas', 'propane'], negated: ['not gas', "isn't gas"] }
  ]
};

// Facts that directly contradict each other when both are present with
// different values. When a NEW message introduces the later-arriving side
// of one of these pairs against an already-known opposite, FixWise asks
// the homeowner to clarify instead of silently choosing one reading.
// `pairs` lists [key, valueA, valueB] combinations that conflict.
export const CONTRADICTING_FACT_PAIRS = [
  ['runs', true, false],
  ['heats', true, false],
  ['drumTurns', true, false],
  ['waterFlow', true, false],
  ['drains', true, false],
  ['cools', true, false],
  ['leakTiming', 'during operation', 'constant'],
  ['powerType', 'gas', 'electric']
];

// ----------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------

// Regex cache so repeated checks against the same keyword don't rebuild
// the pattern on every call.
const KEYWORD_CACHE = new Map();
function kwMatches(normalizedText, keyword) {
  let pattern = KEYWORD_CACHE.get(keyword);
  if (!pattern) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // \b at a non-word edge (e.g. a trailing apostrophe in "doesn't")
    // never matches before another non-word char, so use manual edge
    // checks there — same semantics as safety-data.js's matchesKeyword.
    const left = /^\w/.test(keyword) ? '\\b' : '(?:^|[^\\w])';
    const right = /\w$/.test(keyword) ? '\\b' : '(?!\\w)';
    pattern = new RegExp(`${left}${escaped}${right}`, 'i');
    KEYWORD_CACHE.set(keyword, pattern);
  }
  return pattern.test(normalizedText);
}

// Longest-first so multi-word phrases ("washing machine") win over any
// shorter overlapping keyword.
function sortedKeywords(rule) {
  return [...rule.keywords].sort((a, b) => b.length - a.length);
}

function ruleApplies(rule, normalizedText, subject) {
  if (rule.subject && rule.subject !== subject) return false;
  // `has` requires a co-occurring word OTHER than the rule's own keywords
  // (e.g. the subject 'switch' needs 'light'/'lamp' nearby, not just the
  // word "switch" itself, or every "door switch" mention would be read as
  // a light-switch problem).
  if (rule.has) {
    const others = rule.has.filter(kw => !(rule.keywords || []).includes(kw));
    if (!others.some(kw => kwMatches(normalizedText, kw))) return false;
  }
  if (rule.hasNot && rule.hasNot.some(kw => kwMatches(normalizedText, kw))) return false;
  return true;
}

function detectSubject(normalizedText) {
  for (const entry of SUBJECT_KEYWORDS) {
    // The entry's own `subject` field is the LABEL, not a guard — only
    // has/hasNot scope the detection (ruleApplies' subject guard is for
    // fact rules, not subject entries).
    if (entry.has) {
      const others = entry.has.filter(kw => !entry.keywords.includes(kw));
      if (!others.some(kw => kwMatches(normalizedText, kw))) continue;
    }
    if (entry.hasNot && entry.hasNot.some(kw => kwMatches(normalizedText, kw))) continue;
    if (sortedKeywords(entry).some(kw => kwMatches(normalizedText, kw))) {
      return entry.subject;
    }
  }
  return null;
}

function collectRuleFacts(rule, normalizedText, subject) {
  if (!ruleApplies(rule, normalizedText, subject)) return [];
  // Contrastive openers ("runs but won't heat") affirm the rule's positive
  // value even though the standalone positive keywords don't appear.
  for (const kw of rule.positiveOverride || []) {
    if (kwMatches(normalizedText, kw)) {
      return [{ key: rule.key, value: rule.value === false ? true : rule.value, evidence: kw }];
    }
  }
  // Negated phrases are checked BEFORE the plain keywords: a negation can
  // textually contain a positive-looking phrase ("not electric" contains
  // "electric"; "is not gas" ends in "gas"), and the negated reading must
  // win.
  for (const kw of rule.negated || []) {
    if (kwMatches(normalizedText, kw)) {
      return [{ key: rule.key, value: rule.value === true ? false : rule.value === false ? true : rule.value, evidence: kw, negated: true }];
    }
  }
  for (const kw of sortedKeywords(rule)) {
    if (kwMatches(normalizedText, kw)) {
      return [{ key: rule.key, value: rule.value, evidence: kw }];
    }
  }
  return [];
}

/**
 * Extract structured facts from a single user message.
 * @param {string} text raw user text (any casing)
 * @param {string|null} sessionSubject subject already established earlier
 *   in the session (follow-up answers like "it's electric" carry no
 *   subject keyword of their own)
 * @returns {{ subject: string|null, facts: Array<{key, value, evidence, negated?}> }}
 */
export function extractFacts(text, sessionSubject = null) {
  const normalized = (text || '').toLowerCase();
  if (!normalized.trim()) return { subject: sessionSubject, facts: [] };

  const subject = detectSubject(normalized) || sessionSubject;
  let facts = GENERIC_FACT_RULES.flatMap(rule => collectRuleFacts(rule, normalized, subject));
  if (subject && SUBJECT_FACT_RULES[subject]) {
    facts = facts.concat(SUBJECT_FACT_RULES[subject].flatMap(rule => collectRuleFacts(rule, normalized, subject)));
  }

  // De-duplicate within one message: the same key may be derived twice
  // (e.g. "runs but won't heat" -> runs=true from 'runs but' AND from
  // 'it runs'-style overlap). Keep the first (keyword) reading.
  const seen = new Set();
  facts = facts.filter(fact => {
    const id = `${fact.key}:${String(fact.value)}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return { subject, facts };
}

/**
 * Merge a new message's facts into the running session fact table.
 * - Same key + same value        -> already known; nothing changes.
 * - Same key + different value   -> if [oldValue, newValue] is a declared
 *   contradiction pair, the OLD fact is kept and the new fact is returned
 *   as a pending contradiction for the caller to clarify; otherwise the
 *   newer value refines the earlier one (e.g. a corrected statement).
 * - New key                      -> added.
 *
 * @param {Map<string, {key, value, source}>} knownFacts keyed fact table
 * @param {Array} newFacts facts from the latest message
 * @param {number} sourceIndex index of the message the facts came from
 * @returns {{ contradictions: Array<{key, earlier, latest}> }}
 */
export function mergeFacts(knownFacts, newFacts, sourceIndex) {
  const contradictions = [];
  for (const fact of newFacts) {
    const existing = knownFacts.get(fact.key);
    if (!existing) {
      knownFacts.set(fact.key, { ...fact, source: sourceIndex });
      continue;
    }
    if (existing.value === fact.value) continue;

    const isContradiction = CONTRADICTING_FACT_PAIRS.some(([key, a, b]) =>
      key === fact.key &&
      ((existing.value === a && fact.value === b) || (existing.value === b && fact.value === a))
    );
    if (isContradiction) {
      contradictions.push({ key: fact.key, earlier: existing, latest: fact });
    } else {
      // A non-conflicting refinement (no declared pair) — the newer,
      // more recent statement wins.
      knownFacts.set(fact.key, { ...fact, source: sourceIndex });
    }
  }
  return { contradictions };
}

/**
 * Build the full session fact table from the original description fields
 * plus each follow-up answer, in order. Returns the facts, the detected
 * subject, and any contradictions found along the way (the FIRST
 * unresolved contradiction is what the caller should ask about).
 *
 * `clarification` covers combinations that are not outright contradictions
 * but need the homeowner to distinguish two genuinely different problems —
 * e.g. "runs but no heat" followed by "the drum doesn't turn": the motor
 * running while the drum stays still is a different repair (belt) than a
 * no-heat problem, so FixWise asks rather than silently merging them.
 */
export function buildSessionFacts({ problem, seen, heard, smell, otherSymptoms, conversationHistory }) {
  const knownFacts = new Map();
  let subject = null;
  let contradiction = null;

  const ingest = (text, sourceIndex) => {
    const extraction = extractFacts(text, subject);
    if (extraction.subject) subject = extraction.subject;
    const { contradictions } = mergeFacts(knownFacts, extraction.facts, sourceIndex);
    if (contradictions.length && !contradiction) {
      contradiction = contradictions[0];
    }
  };

  [problem, seen, heard, smell, otherSymptoms].filter(Boolean).forEach((text, i) => ingest(text, i));
  (conversationHistory || []).forEach((entry, i) => {
    if (entry && entry.answer) ingest(entry.answer, 100 + i);
  });

  let clarification = null;
  const latestHas = (key, value) => {
    const fact = knownFacts.get(key);
    return fact && fact.value === value && fact.source >= 100;
  };
  if (latestHas('drumTurns', false) && knownFacts.get('runs')?.value === true) {
    clarification = 'Do you hear the motor running but the drum stays still (which usually points to a broken belt), or does the drum turn normally while it runs?';
  }

  return { facts: knownFacts, subject, contradiction, clarification };
}

// ----------------------------------------------------------------------
// Condition evaluation. Knowledge-base entries (sub-issues, causes,
// clarifying questions) declare when they apply:
//   when:    { all: {...}, any: {...}, not: {...}, negated: 'key' }
//   notWhen: same shape (checked against the SAME facts)
// A condition PASSES only when every declared group passes AND every
// referenced fact key is actually known — an entry that needs a fact the
// homeowner hasn't given yet must NOT match on an assumption.
// ----------------------------------------------------------------------

function everyFact(facts, shape) {
  return Object.entries(shape || {}).every(([key, expected]) => {
    if (!facts.has(key)) return false;
    const actual = facts.get(key).value;
    if (Array.isArray(expected)) return expected.includes(actual);
    return actual === expected;
  });
}

function someFact(facts, shape) {
  return Object.entries(shape || {}).some(([key, expected]) => {
    if (!facts.has(key)) return false;
    const actual = facts.get(key).value;
    if (Array.isArray(expected)) return expected.includes(actual);
    return actual === expected;
  });
}

/**
 * Evaluate one condition group ({ all, any, not, negated }) against the
 * known-fact table. `not` means "every listed key is known AND none match
 * the listed values". `negated` names a single key that must be known and
 * false (used by questions like "Does it get slightly warm?" that only
 * make sense once heat=false is established).
 */
export function conditionMatches(condition, facts) {
  if (!condition) return true;
  if (condition.all && !everyFact(facts, condition.all)) return false;
  if (condition.any && !someFact(facts, condition.any)) return false;
  if (condition.not && !Object.entries(condition.not).every(([key, expected]) => {
    if (!facts.has(key)) return false;
    const actual = facts.get(key).value;
    if (Array.isArray(expected)) return !expected.includes(actual);
    return actual !== expected;
  })) return false;
  if (condition.negated) {
    const key = condition.negated;
    if (!facts.has(key) || facts.get(key).value !== false) return false;
  }
  return true;
}

/**
 * An entry (cause, question) is suppressed when its notWhen condition is
 * fully satisfied by the known facts — e.g. "Worn drive belt" declares
 * notWhen { all: { drumTurns: true } }, so once the homeowner has said
 * the drum turns, suggesting a broken belt contradicts known facts.
 */
export function conditionContradicted(condition, facts) {
  return conditionMatches(condition, facts);
}

/**
 * Question-specific condition evaluation. A clarifying question's `when`
 * describes the world in which ASKING still makes sense, which differs
 * from conditionMatches in one key way: a `not` group passes while the
 * fact is simply UNKNOWN (the question exists to establish it) and only
 * fails once the fact is known to be one of the listed values.
 *   { text: 'Is the dryer gas or electric?', when: { not: { powerType: ['gas','electric'] } } }
 * is shown while powerType is unknown, and dropped once it is known.
 */
function questionConditionOpen(condition, facts) {
  if (!condition) return true;
  if (condition.all && !everyFact(facts, condition.all)) return false;
  if (condition.any && !someFact(facts, condition.any)) return false;
  if (condition.not && !Object.entries(condition.not).every(([key, expected]) => {
    if (!facts.has(key)) return true; // unknown — asking is exactly how we find out
    const actual = facts.get(key).value;
    if (Array.isArray(expected)) return !expected.includes(actual);
    return actual !== expected;
  })) return false;
  if (condition.negated) {
    const key = condition.negated;
    if (!facts.has(key) || facts.get(key).value !== false) return false;
  }
  return true;
}

/**
 * Filter a list of clarifying questions (strings or { text, when }
 * objects) so FixWise never asks something the session facts already
 * answer. Questions without conditions always pass; questions with
 * conditions stay only while asking them still makes sense.
 * @param {Array<string|{text:string, when?:object}>} questions
 * @param {Map} facts
 * @returns {string[]} question texts still worth asking
 */
export function filterAnsweredQuestions(questions, facts) {
  return (questions || [])
    .map(q => (typeof q === 'string' ? { text: q } : q))
    .filter(q => {
      if (!q || !q.text) return false;
      return questionConditionOpen(q.when, facts);
    })
    .map(q => q.text);
}

/**
 * Apply fact reasoning to a cause list. Causes may be plain strings or
 * { text, when?, notWhen? } objects:
 *   - notWhen satisfied by known facts  -> contradicted (the cause needs a
 *     state the homeowner has already ruled out, e.g. a broken drive belt
 *     when the drum turns) — reported separately so the caller can demote
 *     it honestly instead of deleting it.
 *   - when not satisfied by known facts -> hidden (the cause depends on a
 *     fact that isn't established yet, e.g. gas-specific parts before the
 *     homeowner has said whether the appliance is gas or electric).
 *   - otherwise                         -> kept, in original order.
 * @returns {{ kept: string[], contradicted: string[], hidden: string[] }}
 */
export function applyFactsToCauses(causes, facts) {
  const kept = [];
  const contradicted = [];
  const hidden = [];
  for (const raw of causes || []) {
    const cause = typeof raw === 'string' ? { text: raw } : raw;
    if (!cause || !cause.text) continue;
    if (cause.notWhen && conditionContradicted(cause.notWhen, facts)) {
      contradicted.push(cause.text);
      continue;
    }
    if (cause.when && !conditionMatches(cause.when, facts)) {
      hidden.push(cause.text);
      continue;
    }
    kept.push(cause.text);
  }
  return { kept, contradicted, hidden };
}
