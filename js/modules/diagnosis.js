// ========================================
// AI DIAGNOSIS: form handling + results rendering
// ========================================
import { diagnoseProblem, analyzePhotos, isBackendConnected } from '../api/ai-client.js';
import { getSelectedPhotos, clearPhotos } from './photo-upload.js';
import { getLevelBySlug } from '../data/levels.js';
import { escapeHtml } from '../utils/html.js';

const els = {};

// In-browser session state for the current diagnosis conversation. This is
// intentionally simple client-side state (not a real chat backend): it lets
// follow-up answers build on the original description and on each other,
// instead of every submission being treated as an unrelated new problem.
// It is persisted to sessionStorage so the conversation survives a reload
// within the same browser tab/session (cleared on "Reset" or tab close).
const SESSION_KEY = 'fixwiseDiagnosisSession';
let session = createEmptySession();

function createEmptySession() {
  return {
    category: '', problem: '', seen: '', heard: '', smell: '', otherSymptoms: '',
    conversationHistory: [], // [{ answer: string, timestamp: string }]
    lastDiagnosis: null
  };
}

function saveSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    // sessionStorage may be unavailable (e.g. privacy mode) — conversation
    // still works in-memory for the current page view.
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return { ...createEmptySession(), ...JSON.parse(raw) };
  } catch (err) {
    // Ignore malformed/unavailable storage and start a fresh session.
  }
  return createEmptySession();
}

function clearSession() {
  session = createEmptySession();
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (err) {
    // Ignore — nothing persisted to clear.
  }
}

function cacheEls() {
  const ids = [
    'diagnosisForm', 'category', 'problem', 'seen', 'heard', 'smell', 'otherSymptoms',
    'resultCard', 'resultTitle', 'resultText', 'resultState', 'modeBadge', 'confidenceBadge',
    'dangerWarning', 'warningTitle', 'warningText', 'warningBadge',
    'mostLikelyCauses', 'mostLikelyList',
    'otherCausesSection', 'otherCausesList',
    'clarifyingSection', 'clarifyingList',
    'followUpSection', 'followUpAnswer', 'submitFollowUp', 'conversationLog',
    'stepsSection', 'stepsList',
    'toolsSection', 'toolsList',
    'partsSection', 'partsList',
    'tipsSection', 'tipsList',
    'stopSection', 'stopText',
    'nextCheck', 'diyLevel', 'safetyLevel', 'estimatedTime',
    'professionalNote', 'professionalText',
    'photoNote', 'analyzeBtn', 'formError'
  ];
  ids.forEach(id => { els[id] = document.getElementById(id); });
}

function setListOrHide(sectionEl, listEl, items) {
  if (!sectionEl || !listEl) return;
  if (!items || items.length === 0) {
    sectionEl.style.display = 'none';
    return;
  }
  sectionEl.style.display = 'block';
  listEl.innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function resetResultSections() {
  ['dangerWarning', 'mostLikelyCauses', 'otherCausesSection', 'clarifyingSection',
    'followUpSection', 'stepsSection', 'toolsSection', 'partsSection', 'tipsSection', 'stopSection',
    'professionalNote', 'photoNote'].forEach(key => {
    if (els[key]) els[key].style.display = 'none';
  });
  if (els.confidenceBadge) els.confidenceBadge.textContent = '';
}

function renderModeBadge() {
  if (!els.modeBadge) return;
  const connected = isBackendConnected();
  els.modeBadge.textContent = connected ? 'Backend connected' : 'Demo Mode';
  els.modeBadge.className = 'mode-badge' + (connected ? ' mode-live' : ' mode-demo');
}

function renderConversationLog() {
  if (!els.conversationLog) return;
  els.conversationLog.innerHTML = session.conversationHistory
    .map(entry => `<li><strong>You added:</strong> ${escapeHtml(entry.answer)}</li>`)
    .join('');
}

function showEmptyState(message) {
  resetResultSections();
  els.resultTitle.textContent = 'Tell me what you\'re seeing';
  els.resultText.textContent = message;
  els.nextCheck.textContent = 'Add symptoms';
  els.diyLevel.textContent = '—';
  els.safetyLevel.textContent = '—';
  els.estimatedTime.textContent = '—';
}

function showLoadingState() {
  resetResultSections();
  els.resultTitle.textContent = 'Analyzing…';
  els.resultText.textContent = isBackendConnected()
    ? 'Sending your description to the FixWise diagnosis service…'
    : 'Reviewing your description with the FixWise demo diagnosis engine…';
  els.resultCard.classList.add('is-loading');
}

function renderLevelBadge(el, slug) {
  const level = getLevelBySlug(slug);
  if (!el) return;
  el.textContent = level ? level.label : '—';
  el.className = 'result-badge' + (level ? ` ${level.className}` : '');
}

function renderResults(diagnosis, photoResult) {
  els.resultCard.classList.remove('is-loading');
  resetResultSections();

  if (!diagnosis || !diagnosis.matched) {
    els.resultTitle.textContent = 'No specific match yet';
    els.resultText.textContent = 'I didn\'t find a strong match. Try adding more detail about what you see, hear, smell, or notice — specific words like "dripping," "spark," "gurgling," or "won\'t heat" help narrow it down.';
    els.nextCheck.textContent = 'Add more details';
    els.diyLevel.textContent = '—';
    els.safetyLevel.textContent = '—';
    els.estimatedTime.textContent = '—';
    return;
  }

  const { hasDanger, dangerConfig, issue, category } = diagnosis;

  if (hasDanger && dangerConfig) {
    els.dangerWarning.style.display = 'flex';
    els.warningTitle.textContent = 'Safety Alert';
    els.warningText.textContent = dangerConfig.message;
    els.warningBadge.textContent = dangerConfig.badge;
  }

  els.resultTitle.textContent = `${category} diagnosis`;
  els.resultText.textContent = `Based on what you described, here is FixWise's informational guidance for this ${category.toLowerCase()} issue. This is not a guaranteed diagnosis — use it as a starting point.`;

  setListOrHide(els.mostLikelyCauses, els.mostLikelyList, issue.causes);
  if (diagnosis.confidence && els.confidenceBadge) {
    els.confidenceBadge.textContent = diagnosis.confidence.label;
    els.confidenceBadge.className = `confidence-badge confidence-${diagnosis.confidence.level}`;
  }
  setListOrHide(els.otherCausesSection, els.otherCausesList, issue.otherCauses);
  setListOrHide(els.clarifyingSection, els.clarifyingList, issue.clarifyingQuestions);
  setListOrHide(els.stepsSection, els.stepsList, issue.steps);
  setListOrHide(els.toolsSection, els.toolsList, issue.tools);
  setListOrHide(els.partsSection, els.partsList, issue.parts);
  setListOrHide(els.tipsSection, els.tipsList, issue.tips);

  if (els.followUpSection) {
    els.followUpSection.style.display = 'block';
    renderConversationLog();
  }

  if (issue.stopWhen) {
    els.stopSection.style.display = 'block';
    els.stopText.textContent = issue.stopWhen;
  }

  els.nextCheck.textContent = issue.nextCheck || 'Inspect the affected area';
  renderLevelBadge(els.diyLevel, issue.difficulty);
  els.safetyLevel.textContent = issue.safety || 'Use caution';
  els.estimatedTime.textContent = issue.time || '—';

  if (issue.pro) {
    els.professionalNote.style.display = 'block';
    els.professionalText.textContent = issue.pro;
  }

  if (photoResult && photoResult.note) {
    els.photoNote.style.display = 'block';
    els.photoNote.textContent = photoResult.note;
  }
}

export function initDiagnosisForm() {
  cacheEls();
  if (!els.diagnosisForm) return;

  renderModeBadge();
  session = loadSession();

  // Restore the in-progress form + conversation from this browser session,
  // if one exists, so a page reload doesn't lose context mid-diagnosis.
  if (els.category && session.category) els.category.value = session.category;
  if (els.problem) els.problem.value = session.problem || '';
  if (els.seen) els.seen.value = session.seen || '';
  if (els.heard) els.heard.value = session.heard || '';
  if (els.smell) els.smell.value = session.smell || '';
  if (els.otherSymptoms) els.otherSymptoms.value = session.otherSymptoms || '';

  if (session.lastDiagnosis) {
    renderResults(session.lastDiagnosis, null);
  } else {
    showEmptyState('Enter a repair problem and press "Analyze problem." This demo shows how the future AI diagnosis flow can respond.');
  }

  async function runDiagnosis() {
    els.analyzeBtn.disabled = true;
    els.analyzeBtn.textContent = 'Analyzing…';
    showLoadingState();

    try {
      const photos = getSelectedPhotos();
      const [diagnosis, photoResult] = await Promise.all([
        diagnoseProblem({
          category: session.category,
          problem: session.problem,
          seen: session.seen,
          heard: session.heard,
          smell: session.smell,
          otherSymptoms: session.otherSymptoms,
          photos,
          conversationHistory: session.conversationHistory
        }),
        analyzePhotos({ photos })
      ]);
      session.lastDiagnosis = diagnosis;
      saveSession();
      renderResults(diagnosis, photoResult);
      els.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      resetResultSections();
      els.resultCard.classList.remove('is-loading');
      els.resultTitle.textContent = 'Something went wrong';
      els.resultText.textContent = 'We couldn\'t complete the analysis. Please try again in a moment.';
      els.nextCheck.textContent = '—';
      els.diyLevel.textContent = '—';
      els.safetyLevel.textContent = '—';
      els.estimatedTime.textContent = '—';
    } finally {
      els.analyzeBtn.disabled = false;
      els.analyzeBtn.textContent = 'Analyze problem';
    }
  }

  els.diagnosisForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // A new form submission starts a fresh diagnosis session/conversation.
    session = createEmptySession();
    session.category = els.category.value;
    session.problem = els.problem.value.trim();
    session.seen = els.seen.value.trim();
    session.heard = els.heard.value.trim();
    session.smell = els.smell.value.trim();
    session.otherSymptoms = els.otherSymptoms.value.trim();

    if (els.formError) els.formError.textContent = '';

    if (!session.problem && !session.seen && !session.heard && !session.smell && !session.otherSymptoms) {
      if (els.formError) {
        els.formError.textContent = 'Please describe the problem in at least one field before analyzing.';
      }
      showEmptyState('Describe what is happening, then press "Analyze problem."');
      return;
    }

    saveSession();
    runDiagnosis();
  });

  els.submitFollowUp?.addEventListener('click', () => {
    const answer = els.followUpAnswer?.value.trim();
    if (!answer) return;

    session.conversationHistory.push({ answer, timestamp: new Date().toISOString() });
    saveSession();
    if (els.followUpAnswer) els.followUpAnswer.value = '';
    runDiagnosis();
  });

  document.getElementById('resetDiagnosis')?.addEventListener('click', () => {
    els.diagnosisForm.reset();
    clearPhotos();
    clearSession();
    if (els.formError) els.formError.textContent = '';
    showEmptyState('Enter a repair problem and press "Analyze problem." This demo shows how the future AI diagnosis flow can respond.');
  });
}
