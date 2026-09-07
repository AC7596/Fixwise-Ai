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
    'dangerWarning', 'warningTitle', 'warningText', 'warningAction', 'warningBadge', 'intentText',
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
    'professionalNote', 'photoNote', 'intentText'].forEach(key => {
    if (els[key]) els[key].style.display = 'none';
  });
  if (els.dangerWarning) els.dangerWarning.className = 'danger-warning';
  if (els.confidenceBadge) {
    els.confidenceBadge.textContent = '';
    els.confidenceBadge.className = 'confidence-badge';
  }
}

function renderModeBadge() {
  if (!els.modeBadge) return;
  const connected = isBackendConnected();
  els.modeBadge.textContent = connected ? 'Backend connected' : 'Demo Mode';
  els.modeBadge.className = 'mode-badge' + (connected ? ' mode-live' : ' mode-demo');
}

function renderConversationLog() {
  if (!els.conversationLog) return;
  els.conversationLog.textContent = '';
  session.conversationHistory.forEach(entry => {
    const li = document.createElement('li');
    const label = document.createElement('strong');
    label.textContent = 'You added: ';
    li.appendChild(label);
    li.appendChild(document.createTextNode(entry.answer));
    els.conversationLog.appendChild(li);
  });
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

function renderIntentLine(diagnosis) {
  if (!els.intentText) return;
  if (!diagnosis.intentMeta) {
    els.intentText.style.display = 'none';
    return;
  }
  els.intentText.style.display = 'block';
  els.intentText.innerHTML = `<strong>What FixWise understands:</strong> Based on what you've described, ${escapeHtml(diagnosis.intentMeta.understanding)}.`;
}

function renderDangerWarning(diagnosis) {
  if (!diagnosis.hasDanger || !diagnosis.dangerConfig) {
    els.dangerWarning.style.display = 'none';
    return;
  }
  const level = diagnosis.dangerConfig.level || diagnosis.riskLevel || 'high';
  els.dangerWarning.style.display = 'flex';
  els.dangerWarning.className = `danger-warning risk-${level}`;
  els.warningTitle.textContent = level === 'stop' ? 'STOP — Safety Alert' : (level === 'caution' ? 'Use Caution' : 'Safety Alert');
  els.warningText.textContent = diagnosis.dangerConfig.message;
  if (els.warningAction) {
    els.warningAction.textContent = diagnosis.dangerConfig.action || '';
    els.warningAction.style.display = diagnosis.dangerConfig.action ? 'block' : 'none';
  }
  els.warningBadge.textContent = diagnosis.dangerConfig.badge;
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

  renderDangerWarning(diagnosis);
  renderIntentLine(diagnosis);

  const { issue, category } = diagnosis;

  // ---- Emergency: show the stop warning as the whole story ----
  if (diagnosis.isEmergency) {
    els.resultTitle.textContent = 'This may need immediate attention';
    els.resultText.textContent = 'Based on what you\'ve described, this looks like a safety hazard rather than a routine repair question. Please follow the safety alert above before doing anything else.';
    els.nextCheck.textContent = 'Follow the safety alert above';
    els.diyLevel.textContent = 'Do not DIY';
    els.diyLevel.className = 'result-badge level-emergency';
    els.safetyLevel.textContent = 'Stop immediately';
    els.estimatedTime.textContent = 'N/A';
    return;
  }

  // ---- Needs follow-up: not enough info to give a specific recommendation,
  // so ask rather than guess (see intent-data.js) ----
  if (diagnosis.needsFollowUp) {
    els.resultTitle.textContent = `Let's narrow this down`;
    els.resultText.textContent = `Based on what you've described, FixWise doesn't have enough detail yet to give a specific, useful recommendation. One of the questions below can help — add an answer in the box below and FixWise will refine its response.`;
    setListOrHide(els.clarifyingSection, els.clarifyingList, diagnosis.clarifyingQuestions);
    if (els.followUpSection) {
      els.followUpSection.style.display = 'block';
      renderConversationLog();
    }
    els.nextCheck.textContent = 'Answer a question below';
    els.diyLevel.textContent = '—';
    els.safetyLevel.textContent = diagnosis.hasDanger ? 'See safety alert' : 'Depends on your answer';
    els.estimatedTime.textContent = '—';
    return;
  }

  // ---- Matched but no specific knowledge-base entry ----
  if (!issue) {
    els.resultTitle.textContent = 'No specific match yet';
    els.resultText.textContent = 'I didn\'t find a strong match. Try adding more detail about what you see, hear, smell, or notice.';
    els.nextCheck.textContent = 'Add more details';
    els.diyLevel.textContent = '—';
    els.safetyLevel.textContent = '—';
    els.estimatedTime.textContent = '—';
    return;
  }

  const introVerb = diagnosis.intent === 'repair' ? 'repair' : (diagnosis.intent === 'replace' ? 'replacement' : 'issue');
  els.resultTitle.textContent = `${category} ${introVerb === 'issue' ? 'diagnosis' : introVerb} guidance`;
  els.resultText.textContent = `Based on what you've described, here is FixWise's informational guidance for this ${category.toLowerCase()} ${introVerb}. One possible cause is listed first below — this is not a guaranteed diagnosis, so use it as a starting point.`;

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
    if (els.submitFollowUp) els.submitFollowUp.disabled = true;
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
      if (els.submitFollowUp) els.submitFollowUp.disabled = false;
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
    if (els.submitFollowUp.disabled) return;
    const answer = els.followUpAnswer?.value.trim();
    if (!answer || !session.lastDiagnosis) return;

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
