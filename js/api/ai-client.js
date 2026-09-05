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

// TODO: point this at your real backend once it exists, e.g.
// const BACKEND_BASE_URL = 'https://api.yourfixwisebackend.com';
const BACKEND_BASE_URL = null; // null = no backend connected yet (demo mode)

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

function localDemoDiagnosis({ category, problem, seen, heard, smell, otherSymptoms }) {
  const categoryKey = (category || '').toLowerCase();
  const categoryData = diagnosisDatabase[categoryKey];

  const combinedText = [problem, seen, heard, smell, otherSymptoms]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!categoryData || !combinedText.trim()) {
    return { matched: false, category };
  }

  let hasDanger = false;
  const dangerConfig = categoryData.dangers;
  if (dangerConfig && dangerConfig.keywords) {
    hasDanger = dangerConfig.keywords.some(kw => combinedText.includes(kw));
  }

  let matchedIssue = null;
  if (categoryData.issues) {
    for (const [keyPattern, issueData] of Object.entries(categoryData.issues)) {
      const patterns = keyPattern.split('|').map(p => p.trim());
      if (patterns.some(p => combinedText.includes(p))) {
        matchedIssue = issueData;
        break;
      }
    }
  }

  return {
    matched: Boolean(matchedIssue),
    hasDanger,
    dangerConfig,
    issue: matchedIssue,
    category
  };
}
