// ========================================
// SAFETY / RISK CLASSIFICATION (front-end demo)
// ========================================
// Real risk assessment should eventually be backed by a proper safety
// model on the backend. Until then, this module replaces "every task in a
// dangerous-sounding category gets the same scary banner" with symptom-
// based risk signals: the actual words used ("sparking", "burning smell",
// "gas smell"...) drive the severity, not just the category picked in the
// dropdown. This lets an ordinary "how do I replace an outlet" question
// get calm, practical guidance while "my outlet is sparking" still stops
// the homeowner immediately.

export const RISK_LEVEL = {
  NONE: 'none',
  LOW: 'low',
  CAUTION: 'caution',
  HIGH: 'high',
  STOP: 'stop'
};

// Numeric ranking so the highest matched severity wins when multiple
// signals are present in the same description.
const RISK_RANK = { none: 0, low: 1, caution: 2, high: 3, stop: 4 };

// Each signal: id, level, the words/phrases that indicate it, a plain-
// language explanation of WHY it's dangerous, and the safe next action a
// homeowner should take. Keep phrases as plain substrings (checked against
// lowercased text) so this stays easy to extend without a regex course.
export const RISK_SIGNALS = [
  {
    id: 'exposed-wiring',
    level: RISK_LEVEL.STOP,
    keywords: ['exposed wire', 'bare wire', 'wires touching', 'energized wire', 'live wire'],
    title: 'Exposed energized wiring',
    message: 'Exposed or energized wiring is a serious shock and fire risk — it should never be handled without the circuit confirmed off.',
    action: 'Do not touch the wiring. If you can safely reach the breaker panel, turn off the breaker for that circuit, then call a licensed electrician.'
  },
  {
    id: 'sparking',
    level: RISK_LEVEL.STOP,
    keywords: ['spark', 'sparking', 'arcing', 'arced'],
    title: 'Sparking or electrical arcing',
    message: 'Sparking or arcing means electricity is jumping where it shouldn\'t — this can start a fire or cause a severe shock.',
    action: 'Turn off the breaker for that circuit if you can safely reach it, stop using the item, and call a licensed electrician.'
  },
  {
    id: 'shock',
    level: RISK_LEVEL.STOP,
    keywords: ['shock', 'shocked', 'shocking me', 'zapped', 'tingling when i touch'],
    title: 'Electric shock hazard',
    message: 'Getting shocked means current is reaching a surface it shouldn\'t — continuing to touch it risks serious injury.',
    action: 'Stop touching the item immediately. Unplug it only if you can do so without contact risk, and call a licensed electrician.'
  },
  {
    id: 'burning-smell',
    level: RISK_LEVEL.STOP,
    keywords: ['burning smell', 'smells like burning', 'burning plastic', 'burning odor', 'smell burning'],
    title: 'Burning smell',
    message: 'A burning smell near electrical or heating equipment can mean overheating insulation or components — an early fire warning sign.',
    action: 'Turn off power at the breaker if it is safe to reach, do not use the item again, and call a licensed electrician or HVAC technician.'
  },
  {
    id: 'fire-smoke',
    level: RISK_LEVEL.STOP,
    keywords: ['fire', 'flames', 'smoke coming from', 'smoke is coming'],
    title: 'Fire or smoke',
    message: 'Any visible fire or smoke is an immediate life-safety emergency, not a repair question.',
    action: 'Evacuate if there is any visible flame or heavy smoke and call 911 or your local emergency number right now.'
  },
  {
    id: 'gas-leak',
    level: RISK_LEVEL.STOP,
    keywords: ['gas smell', 'smell gas', 'smell of gas', 'rotten egg smell', 'hissing near the gas', 'gas leak'],
    title: 'Possible gas leak',
    message: 'A gas odor can mean a leak that risks fire, explosion, or asphyxiation.',
    action: 'Leave the area immediately, don\'t flip switches or light anything, and call your gas utility\'s emergency line or 911 from outside.'
  },
  {
    id: 'carbon-monoxide',
    level: RISK_LEVEL.STOP,
    keywords: ['carbon monoxide', 'co alarm', 'co detector', 'co2 alarm'],
    title: 'Possible carbon monoxide danger',
    message: 'Carbon monoxide is invisible and odorless — an alarm going off is a genuine emergency, not a false-positive to troubleshoot.',
    action: 'Get everyone outside into fresh air immediately and call 911 or your fire department. Do not re-enter until cleared.'
  },
  {
    id: 'sewage',
    level: RISK_LEVEL.STOP,
    keywords: ['sewage', 'raw sewage', 'sewage backup', 'sewage smell'],
    title: 'Sewage backup',
    message: 'Raw sewage carries serious health hazards and usually indicates a main line blockage.',
    action: 'Avoid contact with the area and water, ventilate if possible, and call a licensed plumber right away.'
  },
  {
    id: 'structural',
    level: RISK_LEVEL.STOP,
    keywords: ['sagging roof', 'roof caving', 'leaning wall', 'foundation collapsing', 'floor collapsing', 'wall bowing', 'ceiling sagging', 'ceiling bulging'],
    title: 'Possible major structural hazard',
    message: 'Sagging, bowing, or collapsing building elements can fail suddenly and are a life-safety risk.',
    action: 'Stay out of the affected area and contact a structural engineer or licensed contractor immediately.'
  },
  {
    id: 'overheated-component',
    level: RISK_LEVEL.HIGH,
    keywords: ['warm to the touch', 'hot to the touch', 'overheating', 'warm outlet', 'hot outlet', 'warm switch', 'hot switch', 'warm plug', 'hot plug'],
    title: 'Overheated component',
    message: 'An electrical component that feels warm or hot to the touch is a fire warning sign, even without visible sparks.',
    action: 'Stop using it, avoid touching it further, and have a licensed electrician inspect it before it is used again.'
  },
  {
    id: 'flooding',
    level: RISK_LEVEL.HIGH,
    keywords: ['flooding', 'burst pipe', 'water gushing', 'water spraying', 'pipe burst'],
    title: 'Active flooding or burst pipe',
    message: 'Actively flowing water can cause rapid water damage and, near electrical sources, a shock hazard.',
    action: 'Shut off the main water supply if you can reach it safely, avoid electrical areas with standing water, and call a plumber.'
  },
  {
    id: 'mold-large',
    level: RISK_LEVEL.CAUTION,
    keywords: ['mold covering', 'mold everywhere', 'black mold', 'large area of mold'],
    title: 'Extensive mold',
    message: 'Large mold areas can affect air quality and health, especially with prolonged exposure.',
    action: 'Limit time in the area, improve ventilation, and contact a mold remediation professional for anything beyond a small surface patch.'
  },
  {
    id: 'heights',
    level: RISK_LEVEL.CAUTION,
    keywords: ['on the roof', 'steep roof', 'tall ladder', 'second story window', 'second-story window', 'up on a ladder'],
    title: 'Fall / height hazard',
    message: 'Falls from height are one of the most common serious home-repair injuries.',
    action: 'Use a stable ladder on level ground with a spotter, or consider hiring a professional for steep or high work.'
  },
  {
    id: 'hazmat',
    level: RISK_LEVEL.CAUTION,
    keywords: ['asbestos', 'lead paint', 'chemical spill'],
    title: 'Possible hazardous material',
    message: 'Some older building materials (asbestos, lead paint) are hazardous if disturbed.',
    action: 'Avoid sanding, cutting, or disturbing the material and consult a certified abatement professional before proceeding.'
  }
];

/**
 * Scan free text for known risk signals and return the highest-severity
 * match (plus all matches, for reference). Returns RISK_LEVEL.NONE with no
 * signals if nothing concerning was mentioned — an ordinary "replace my
 * outlet" style request should land here, not in a STOP banner.
 * @param {string} text combined description text
 * @returns {{ level: string, signals: object[] }}
 */
export function assessRisk(text) {
  const normalized = (text || '').toLowerCase();
  const matched = RISK_SIGNALS.filter(signal => signal.keywords.some(kw => normalized.includes(kw)));

  if (!matched.length) return { level: RISK_LEVEL.NONE, signals: [] };

  const topLevel = matched.reduce((highest, signal) => (
    RISK_RANK[signal.level] > RISK_RANK[highest] ? signal.level : highest
  ), RISK_LEVEL.NONE);

  return { level: topLevel, signals: matched };
}

export const RISK_BADGE_LABEL = {
  [RISK_LEVEL.STOP]: 'STOP — Call a Professional Now',
  [RISK_LEVEL.HIGH]: 'Call a Professional Soon',
  [RISK_LEVEL.CAUTION]: 'Proceed with Caution',
  [RISK_LEVEL.LOW]: 'Low Risk',
  [RISK_LEVEL.NONE]: 'Ordinary Precautions'
};
