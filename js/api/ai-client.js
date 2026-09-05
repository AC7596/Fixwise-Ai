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
 * @param {Array<{question: string, answer: string}>} [request.conversationHistory]
 *   Prior follow-up question/answer pairs from this diagnosis session, so a
 *   real backend can progressively narrow the diagnosis instead of treating
 *   every request as unrelated.
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

function localDemoDiagnosis({ category, problem, seen, heard, smell, otherSymptoms, conversationHistory }) {
  const categoryKey = (category || '').toLowerCase();
  const categoryData = diagnosisDatabase[categoryKey];

  const followUpText = (conversationHistory || [])
    .map(entry => entry.answer)
    .filter(Boolean)
    .join(' ');

  const fields = [problem, seen, heard, smell, otherSymptoms, followUpText].filter(Boolean);
  const combinedText = fields.join(' ').toLowerCase();

  if (!categoryData || !combinedText.trim()) {
    return { matched: false, category };
  }

  let hasDanger = false;
  const dangerConfig = categoryData.dangers;
  if (dangerConfig && dangerConfig.keywords) {
    hasDanger = dangerConfig.keywords.some(kw => combinedText.includes(kw));
  }

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

  // A simple, honest stand-in for a real AI confidence score: more filled-in
  // fields and more matched keywords means more informational signal, so
  // the label leans toward "likely" rather than "possible". Never phrased
  // as a certainty — see language requirements in README/BACKEND.md.
  let confidence = null;
  if (matchedIssue) {
    const signalScore = fields.length + matchedKeywordHits + (conversationHistory && conversationHistory.length ? 1 : 0);
    if (signalScore >= 5) {
      confidence = { level: 'high', label: 'Likely cause, based on the details you provided' };
    } else if (signalScore >= 3) {
      confidence = { level: 'medium', label: 'Possible cause, based on the information provided so far' };
    } else {
      confidence = { level: 'low', label: 'Low confidence — add more detail or answer a follow-up question to narrow this down' };
    }
  }

  return {
    matched: Boolean(matchedIssue),
    confidence,
    hasDanger,
    dangerConfig,
    issue: matchedIssue,
    category
  };
}
