// ========================================
// AI DIAGNOSIS: form handling + results rendering
// ========================================
import { diagnoseProblem, analyzePhotos, isBackendConnected } from '../api/ai-client.js';
import { getSelectedPhotos, clearPhotos } from './photo-upload.js';
import { getLevelBySlug } from '../data/levels.js';
import { escapeHtml } from '../utils/html.js';

const els = {};

function cacheEls() {
  const ids = [
    'diagnosisForm', 'category', 'problem', 'seen', 'heard', 'smell', 'otherSymptoms',
    'resultCard', 'resultTitle', 'resultText', 'resultState',
    'dangerWarning', 'warningTitle', 'warningText', 'warningBadge',
    'mostLikelyCauses', 'mostLikelyList',
    'otherCausesSection', 'otherCausesList',
    'clarifyingSection', 'clarifyingList',
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
    'stepsSection', 'toolsSection', 'partsSection', 'tipsSection', 'stopSection',
    'professionalNote', 'photoNote'].forEach(key => {
    if (els[key]) els[key].style.display = 'none';
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
  setListOrHide(els.otherCausesSection, els.otherCausesList, issue.otherCauses);
  setListOrHide(els.clarifyingSection, els.clarifyingList, issue.clarifyingQuestions);
  setListOrHide(els.stepsSection, els.stepsList, issue.steps);
  setListOrHide(els.toolsSection, els.toolsList, issue.tools);
  setListOrHide(els.partsSection, els.partsList, issue.parts);
  setListOrHide(els.tipsSection, els.tipsList, issue.tips);

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

  showEmptyState('Enter a repair problem and press "Analyze problem." This demo shows how the future AI diagnosis flow can respond.');

  els.diagnosisForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const category = els.category.value;
    const problem = els.problem.value.trim();
    const seen = els.seen.value.trim();
    const heard = els.heard.value.trim();
    const smell = els.smell.value.trim();
    const otherSymptoms = els.otherSymptoms.value.trim();

    if (els.formError) els.formError.textContent = '';

    if (!problem && !seen && !heard && !smell && !otherSymptoms) {
      if (els.formError) {
        els.formError.textContent = 'Please describe the problem in at least one field before analyzing.';
      }
      showEmptyState('Describe what is happening, then press "Analyze problem."');
      return;
    }

    els.analyzeBtn.disabled = true;
    els.analyzeBtn.textContent = 'Analyzing…';
    showLoadingState();

    try {
      const photos = getSelectedPhotos();
      const [diagnosis, photoResult] = await Promise.all([
        diagnoseProblem({ category, problem, seen, heard, smell, otherSymptoms, photos }),
        analyzePhotos(photos)
      ]);
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
  });

  document.getElementById('resetDiagnosis')?.addEventListener('click', () => {
    els.diagnosisForm.reset();
    clearPhotos();
    if (els.formError) els.formError.textContent = '';
    showEmptyState('Enter a repair problem and press "Analyze problem." This demo shows how the future AI diagnosis flow can respond.');
  });
}
