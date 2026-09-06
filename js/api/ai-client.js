// ========================================
// AI BACKEND INTEGRATION LAYER (placeholder)
// ========================================
// GitHub Pages only serves static files, so this file MUST NEVER contain
// API keys, tokens, or secrets. Real AI calls belong on a secure backend
// (serverless function, small API server, etc.) that this file will call
// over HTTPS once it exists.
//
// HOW TO CONNECT A REAL BACKEND LATER:
// 1. Stand up a backend endpoint (e.g. a serverless function such as
//    Azure Functions, AWS Lambda, Cloudflare Workers, or a small Node/
//    Python API) that holds the real AI provider key server-side only.
// 2. Set BACKEND_BASE_URL below (or load it from a non-secret config file)
//    to point at that backend's public HTTPS URL.
// 3. Replace the body of diagnoseProblem() / analyzePhotos() with a
//    fetch() call to that backend, and remove the local demo logic.
// 4. The backend should accept the same request shape used here and
//    return the same response shape so the UI code above this layer
//    (js/modules/diagnosis.js) does not need to change.
//
// See BACKEND.md in the project root for a full description of the
// backend pieces required for a production AI diagnosis service.

import { diagnosisDatabase } from '../data/diagnosis-data.js';
import { classifyIntent, INTENT, INTENT_META, INTENTIONAL_ACTION_INTENTS, getIntentFollowUpQuestions } from '../data/intent-data.js';
import { assessRisk, RISK_LEVEL, RISK_BADGE_LABEL } from '../data/safety-data.js';

// ----------------------------------------------------------------------
// CONFIG: how the backend URL is resolved (no secrets, GitHub-Pages-safe)
// ----------------------------------------------------------------------
// The backend URL itself is not sensitive (it's just an endpoint address,
// not a credential), so it is safe to read from either of these
// non-secret, static-hosting-friendly sources:
//   1. A global `window.FIXWISE_CONFIG.backendUrl` set by a small,
//      un-committed config script (useful for local/staging overrides).
//   2. A `<meta name="fixwise-backend-url" content="...">` tag in
//      index.html (the default, checked-in mechanism — see the <head>).
// If neither is set, the app runs in Demo Mode using local logic only.
function resolveBackendBaseUrl() {
  if (typeof window === 'undefined') return null;
  if (window.FIXWISE_CONFIG && window.FIXWISE_CONFIG.backendUrl) {
    return String(window.FIXWISE_CONFIG.backendUrl).trim() || null;
  }
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="fixwise-backend-url"]');
    const content = meta && meta.getAttribute('content');
    if (content && content.trim()) return content.trim();
  }
  return null;
}

const BACKEND_BASE_URL = resolveBackendBaseUrl(); // null = Demo Mode

export const isBackendConnected = () => Boolean(BACKEND_BASE_URL);

/**
 * Analyze a described home repair problem.
 * @param {object} request
 * @param {string} request.category
 * @param {string} request.problem
 * @param {string} request.seen
 * @param {string} request.heard
 * @param {string} request.smell
 * @param {string} request.otherSymptoms
 * @param {File[]} request.photos
 * @param {Array<{answer: string, timestamp: string}>} [request.conversationHistory]
 *   Prior follow-up answers from this diagnosis session (with an ISO 8601
 *   timestamp for each), so a real backend can progressively narrow the
 *   diagnosis instead of treating every request as unrelated.
 * @returns {Promise<object>} diagnosis result object
 */
export async function diagnoseProblem(request) {
  if (isBackendConnected()) {
    // ------------------------------------------------------------------
    // REAL AI BACKEND CALL GOES HERE.
    // Example (uncomment and adapt once BACKEND_BASE_URL is set):
    //
    // const formData = new FormData();
    // formData.append('category', request.category);
    // formData.append('problem', request.problem);
    // formData.append('seen', request.seen);
    // formData.append('heard', request.heard);
    // formData.append('smell', request.smell);
    // formData.append('otherSymptoms', request.otherSymptoms);
    // formData.append('conversationHistory', JSON.stringify(request.conversationHistory || []));
    // request.photos.forEach(photo => formData.append('photos', photo));
    //
    // const response = await fetch(`${BACKEND_BASE_URL}/api/diagnose`, {
    //   method: 'POST',
    //   body: formData
    // });
    // if (!response.ok) throw new Error('Diagnosis request failed');
    // return await response.json();
    // ------------------------------------------------------------------
  }

  // ---- DEMO MODE: local keyword-matching stand-in (no AI, no network) ----
  return localDemoDiagnosis(request);
}

/**
 * Placeholder for future AI photo analysis. Currently returns an honest
 * "not yet analyzed" result rather than pretending to inspect the images,
 * per project requirements: never fake AI capability that doesn't exist.
 * @param {object} request
 * @param {File[]} request.photos
 */
export async function analyzePhotos({ photos }) {
  if (isBackendConnected()) {
    // Real backend photo analysis call would go here.
  }
  return {
    analyzed: false,
    photoCount: photos.length,
    note: photos.length
      ? `${photos.length} photo(s) attached and included with your description for a professional or future AI reviewer — automatic image analysis is not yet connected.`
      : 'No photos attached.'
  };
}

// Weights applied to each signal when estimating demo confidence below.
// Keyword hits are the strongest signal (they show the exact issue
// matched), filled-in description fields add a smaller weight each
// (more context, but not necessarily about *this* issue), and having any
// follow-up answer at all adds a flat bonus (shows narrowing occurred).
const KEYWORD_HIT_WEIGHT = 2;
const FILLED_FIELD_WEIGHT = 1;
const FOLLOW_UP_BONUS = 1;
const HIGH_CONFIDENCE_SIGNAL_SCORE = 7;
const MEDIUM_CONFIDENCE_SIGNAL_SCORE = 4;

/**
 * Estimate a simple, honest stand-in for a real AI confidence score: more
 * matched keywords and more filled-in fields means more informational
 * signal, so the label leans toward "likely" rather than "possible".
 * Never phrased as a certainty — see language requirements in
 * README.md/BACKEND.md. A real backend would replace this with a
 * model-reported score.
 * @param {number} filledFieldCount
 * @param {number} matchedKeywordHits
 * @param {boolean} hasFollowUp
 * @returns {{level: string, label: string}}
 */
function estimateConfidence(filledFieldCount, matchedKeywordHits, hasFollowUp) {
  const signalScore = (filledFieldCount * FILLED_FIELD_WEIGHT)
    + (matchedKeywordHits * KEYWORD_HIT_WEIGHT)
    + (hasFollowUp ? FOLLOW_UP_BONUS : 0);

  if (signalScore >= HIGH_CONFIDENCE_SIGNAL_SCORE) {
    return { level: 'high', label: 'Likely cause, based on the details you provided' };
  }
  if (signalScore >= MEDIUM_CONFIDENCE_SIGNAL_SCORE) {
    return { level: 'medium', label: 'Possible cause, based on the information provided so far' };
  }
  return { level: 'low', label: 'Low confidence — add more detail or answer a follow-up question to narrow this down' };
}

// Malfunction-signal words that suggest something is actually failing, even
// when the sentence is primarily phrased as an intentional action (e.g.
// "I want to replace my outlet because it sparks"). When these are present
// alongside an intentional-action intent, FixWise treats it as a repair-
// driven replacement rather than asking purely exploratory questions.
const MALFUNCTION_SIGNAL_WORDS = [
  'not working', "isn't working", 'broken', 'stopped working', 'failed', 'failing',
  'spark', 'shock', 'burn', 'burning', 'smoke', 'trip', 'tripping', 'leak', 'leaking',
  'drip', 'dripping', 'crack', 'cracked', 'won\'t', 'doesn\'t', 'no power', 'dead',
  'loose', 'warm to the touch', 'hot to the touch', 'buzzing', 'humming', 'rattling'
];

function hasMalfunctionSignal(text) {
  return MALFUNCTION_SIGNAL_WORDS.some(word => text.includes(word));
}

function localDemoDiagnosis({ category, problem, seen, heard, smell, otherSymptoms, conversationHistory }) {
  const categoryKey = (category || '').toLowerCase();
  const categoryData = diagnosisDatabase[categoryKey];

  const followUpText = (conversationHistory || [])
    .map(entry => entry.answer)
    .filter(Boolean)
    .join(' ');

  const fields = [problem, seen, heard, smell, otherSymptoms, followUpText].filter(Boolean);
  const combinedText = fields.join(' ').toLowerCase();

  if (!combinedText.trim()) {
    return { matched: false, category };
  }

  // ---- 1. Symptom-based risk assessment (independent of category/intent) ----
  const risk = assessRisk(combinedText);
  const hasDanger = risk.level === RISK_LEVEL.STOP || risk.level === RISK_LEVEL.HIGH;
  const dangerConfig = risk.signals.length
    ? {
      message: risk.signals.map(s => s.message).join(' '),
      badge: RISK_BADGE_LABEL[risk.level],
      action: risk.signals.map(s => s.action).join(' '),
      level: risk.level
    }
    : null;

  // ---- 2. Intent classification: what is the homeowner trying to DO? ----
  const intentResult = classifyIntent(combinedText);
  const intent = intentResult ? intentResult.intent : null;
  const intentMeta = intentResult ? intentResult.meta : null;

  if (!categoryData) {
    return { matched: false, category, intent, intentMeta, hasDanger, dangerConfig, riskLevel: risk.level };
  }

  // A true emergency-level risk always takes priority: stop and surface the
  // safety warning rather than any repair/replace guidance.
  if (risk.level === RISK_LEVEL.STOP) {
    return {
      matched: true,
      needsFollowUp: false,
      isEmergency: true,
      intent: INTENT.EMERGENCY,
      intentMeta: INTENT_META[INTENT.EMERGENCY],
      confidence: { level: 'high', label: 'High confidence this needs immediate professional/emergency attention' },
      hasDanger: true,
      dangerConfig,
      riskLevel: risk.level,
      issue: null,
      category
    };
  }

  // ---- 3. Does this look like an intentional action (replace/install/
  // maintenance/inspection/upgrade/how-it-works) rather than a malfunction
  // report? If so, and there's no malfunction language mixed in, FixWise
  // should ask a clarifying question rather than assume a failure. This is
  // the fix for "I want to replace my outlets" being treated like "my
  // outlet isn't working".
  const isIntentionalAction = intent && INTENTIONAL_ACTION_INTENTS.has(intent);
  const mentionsMalfunction = hasMalfunctionSignal(combinedText);

  // Shared shape for "ask a clarifying question instead of guessing" —
  // used both when the intent itself signals an intentional action, and
  // later when a recognized intent didn't match anything in the knowledge
  // base, so the two cases can't silently drift apart.
  const buildFollowUpResult = () => ({
    matched: true,
    needsFollowUp: true,
    intent,
    intentMeta,
    confidence: { level: 'low', label: 'Not enough detail yet to give a specific recommendation' },
    hasDanger,
    dangerConfig,
    riskLevel: risk.level,
    clarifyingQuestions: getIntentFollowUpQuestions(categoryKey, intent),
    category
  });

  if (isIntentionalAction && !mentionsMalfunction) {
    return buildFollowUpResult();
  }

  // ---- 4. Malfunction / troubleshooting-style matching against the
  // knowledge base (also used when an intentional action turned out to be
  // driven by a described malfunction, e.g. "replacing a sparking outlet").
  let matchedIssue = null;
  let matchedKeywordHits = 0;
  if (categoryData.issues) {
    for (const [keyPattern, issueData] of Object.entries(categoryData.issues)) {
      const patterns = keyPattern.split('|').map(p => p.trim());
      const hits = patterns.filter(p => combinedText.includes(p)).length;
      if (hits > 0) {
        matchedIssue = issueData;
        matchedKeywordHits = hits;
        break;
      }
    }
  }

  if (!matchedIssue && intent && !mentionsMalfunction) {
    // Recognized an intent (repair/troubleshoot-shaped) but nothing in the
    // knowledge base matched a specific known issue — ask rather than guess.
    return buildFollowUpResult();
  }

  const confidence = matchedIssue
    ? estimateConfidence(fields.length, matchedKeywordHits, Boolean(conversationHistory && conversationHistory.length))
    : null;

  return {
    matched: Boolean(matchedIssue),
    needsFollowUp: false,
    intent: intent || INTENT.TROUBLESHOOT,
    intentMeta: intentMeta || INTENT_META[INTENT.TROUBLESHOOT],
    confidence,
    hasDanger,
    dangerConfig,
    riskLevel: risk.level,
    issue: matchedIssue,
    category
  };
}
