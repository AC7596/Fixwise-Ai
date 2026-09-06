// ========================================
// INTERACTIVE REPAIR MODE: "Guide Me Through It"
// ========================================
// Walks the user through a repair guide ONE STEP AT A TIME instead of a
// long article (problem statement section 6). Data-driven from
// `guide.interactive` in js/data/guides-data.js when available (supports
// equipment-type branches), and falls back to a simple linear walk built
// from `guide.steps` for any guide that doesn't have a rich interactive
// definition yet — so every guide gets a working "Guide Me Through It"
// mode today, with room to add more `interactive` detail over time.
//
// The step/flow shape here is intentionally simple JSON so a future AI
// backend could serve/alter this flow dynamically (e.g. skip steps based
// on a photo analysis result) without changing this renderer.
import { getLevelBySlug } from '../data/levels.js';
import { escapeHtml } from '../utils/html.js';
import { startSession, updateStepProgress, completeSession } from './repair-session.js';
import { FIXY_CONTEXT, getFixyMessage } from '../data/fixy-messages.js';
import { refreshKidsForActiveSession } from './kids-activities.js';

let modalEl = null;
let state = null; // { guide, flow: [...], index, showTroubleshoot, showHelp }

function buildFallbackFlow(guide) {
  const steps = (guide.steps || []).map((instruction, i) => ({
    kind: 'step',
    instruction,
    explanation: (guide.tips && guide.tips[i]) || '',
    safetyNote: i === 0 && guide.safety && guide.safety[0] ? guide.safety[0] : null
  }));
  return steps;
}

function buildFlow(guide) {
  if (guide.interactive) {
    const flow = guide.interactive.commonSteps.map(s => ({ kind: 'step', ...s }));
    flow.push({ kind: 'choice', ...guide.interactive.variantPrompt });
    return flow;
  }
  return buildFallbackFlow(guide);
}

function ensureModal() {
  if (modalEl) return modalEl;
  modalEl = document.createElement('div');
  modalEl.className = 'repair-modal';
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');
  modalEl.setAttribute('aria-label', 'Interactive repair guide');
  modalEl.hidden = true;
  modalEl.innerHTML = `
    <div class="repair-modal-backdrop" id="repairModalBackdrop"></div>
    <div class="repair-modal-panel">
      <button type="button" class="repair-modal-close" id="repairModalClose" aria-label="Close guided repair">✕</button>
      <div id="repairModalBody"></div>
    </div>
  `;
  document.body.appendChild(modalEl);
  modalEl.querySelector('#repairModalBackdrop').addEventListener('click', closeRepairMode);
  modalEl.querySelector('#repairModalClose').addEventListener('click', closeRepairMode);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && !modalEl.hidden) closeRepairMode();
  });
  return modalEl;
}

export function openRepairMode(guide) {
  ensureModal();
  const flow = buildFlow(guide);
  state = { guide, flow, index: 0, showTroubleshoot: false, showHelp: false, variantChosen: null };
  startSession({
    guideId: guide.id,
    title: guide.title,
    category: guide.category,
    difficulty: guide.difficulty,
    safetyLevel: (guide.safety && guide.safety.length) ? 'caution' : 'low',
    totalSteps: flow.length
  });
  modalEl.hidden = false;
  document.body.style.overflow = 'hidden';
  render();
}

function closeRepairMode() {
  if (!modalEl) return;
  modalEl.hidden = true;
  document.body.style.overflow = '';
  state = null;
}

function insertVariantSteps(value) {
  const { guide, flow, index } = state;
  const variantSteps = (guide.interactive.variantSteps[value] || []).map(s => ({ kind: 'step', ...s }));
  const finalSteps = (guide.interactive.finalSteps || []).map(s => ({ kind: 'step', ...s }));
  flow.splice(index + 1, 0, ...variantSteps, ...finalSteps);
  state.variantChosen = value;
  updateStepProgress({ variant: value, totalSteps: flow.length });
}

function currentNode() {
  return state.flow[state.index];
}

function progressHtml() {
  const total = state.flow.length;
  const shownIndex = Math.min(state.index + 1, total);
  const pct = Math.round((shownIndex / total) * 100);
  return `<div class="repair-progress"><div class="repair-progress-bar"><span style="width:${pct}%"></span></div><span class="repair-progress-label">Step ${shownIndex} of ${total}</span></div>`;
}

function render() {
  const body = document.getElementById('repairModalBody');
  if (!body || !state) return;

  if (state.index >= state.flow.length) {
    renderComplete(body);
    return;
  }

  const node = currentNode();
  const level = getLevelBySlug(state.guide.difficulty);

  if (node.kind === 'choice') {
    body.innerHTML = `
      ${progressHtml()}
      <div class="repair-guide-title">${escapeHtml(state.guide.title)}</div>
      <h3 class="repair-step-instruction">${escapeHtml(node.question)}</h3>
      ${node.helpText ? `<p class="repair-step-explanation">${escapeHtml(node.helpText)}</p>` : ''}
      <div class="repair-choice-options">
        ${node.options.map(opt => `<button type="button" class="btn secondary repair-choice-btn" data-value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</button>`).join('')}
      </div>
      <div class="repair-step-actions">
        <button type="button" class="btn secondary" id="repairBack" ${state.index === 0 ? 'disabled' : ''}>Back</button>
      </div>
    `;
    body.querySelectorAll('.repair-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        insertVariantSteps(btn.dataset.value);
        state.index += 1;
        render();
      });
    });
    document.getElementById('repairBack')?.addEventListener('click', goBack);
    return;
  }

  // Regular instructional step
  body.innerHTML = `
    ${progressHtml()}
    <div class="repair-guide-title">${escapeHtml(state.guide.title)}</div>
    <div class="repair-step-number">Step ${state.index + 1}</div>
    <h3 class="repair-step-instruction">${escapeHtml(node.instruction)}</h3>
    ${node.explanation ? `<p class="repair-step-explanation"><strong>Why this matters:</strong> ${escapeHtml(node.explanation)}</p>` : ''}
    ${node.whatYoullSee ? `<p class="repair-step-see"><strong>What you should see:</strong> ${escapeHtml(node.whatYoullSee)}</p>` : ''}
    ${node.safetyNote ? `<p class="repair-step-safety">⚠️ ${escapeHtml(node.safetyNote)}</p>` : ''}
    ${(node.tools && node.tools.length) || (node.parts && node.parts.length) ? `
      <div class="repair-step-meta">
        ${node.tools && node.tools.length ? `<span><strong>Tools:</strong> ${escapeHtml(node.tools.join(', '))}</span>` : ''}
        ${node.parts && node.parts.length ? `<span><strong>Parts:</strong> ${escapeHtml(node.parts.join(', '))}</span>` : ''}
      </div>` : ''}
    <div class="repair-step-actions">
      <button type="button" class="btn secondary" id="repairBack" ${state.index === 0 ? 'disabled' : ''}>Back</button>
      <button type="button" class="btn secondary" id="repairMismatch">Something doesn't match</button>
      <button type="button" class="btn secondary" id="repairHelp">I need help</button>
      <button type="button" class="btn primary" id="repairNext">${state.index === state.flow.length - 1 ? 'Finish' : 'Next step'}</button>
    </div>
    <div id="repairInlinePanel"></div>
    <div class="repair-level-note">${level ? `<span class="result-badge ${level.className}">${escapeHtml(level.label)}</span>` : ''}</div>
  `;

  document.getElementById('repairBack')?.addEventListener('click', goBack);
  document.getElementById('repairNext')?.addEventListener('click', goNext);
  document.getElementById('repairMismatch')?.addEventListener('click', () => toggleInlinePanel('mismatch', node));
  document.getElementById('repairHelp')?.addEventListener('click', () => toggleInlinePanel('help', node));
}

function toggleInlinePanel(kind, node) {
  const panel = document.getElementById('repairInlinePanel');
  if (!panel) return;
  if (panel.dataset.kind === kind) {
    panel.innerHTML = '';
    panel.dataset.kind = '';
    return;
  }
  panel.dataset.kind = kind;
  if (kind === 'mismatch') {
    if (node.troubleshoot) {
      panel.innerHTML = `<div class="repair-inline-note"><strong>${escapeHtml(node.troubleshoot.question)}</strong><p>${escapeHtml(node.troubleshoot.help)}</p></div>`;
    } else {
      panel.innerHTML = `<div class="repair-inline-note"><strong>Let's slow down.</strong><p>Stop before forcing anything. Double-check the previous step, and if it still doesn't match what's expected, this is a good point to pause and consult a professional guide or a licensed pro for this task.</p></div>`;
    }
  } else if (kind === 'help') {
    const message = getFixyMessage(FIXY_CONTEXT.MISTAKE);
    const proNote = state.guide.callPro ? `<p>${escapeHtml(state.guide.callPro)}</p>` : '';
    panel.innerHTML = `<div class="repair-inline-note"><strong>🔧 Fixy says: "${escapeHtml(message)}"</strong><p>Take your time — re-read the step, check the "what you should see" note, and back up a step if needed.</p>${proNote}</div>`;
  }
}

function goBack() {
  if (state.index === 0) return;
  state.index -= 1;
  updateStepProgress({ currentIndex: state.index });
  render();
}

function goNext() {
  state.index += 1;
  updateStepProgress({ currentIndex: state.index });
  render();
}

function renderComplete(body) {
  completeSession();
  refreshKidsForActiveSession();
  const message = getFixyMessage(FIXY_CONTEXT.SOLVED_PROBLEM);
  body.innerHTML = `
    <div class="repair-complete">
      <div class="repair-complete-icon">🎉</div>
      <h3>Nice work — that's the full repair!</h3>
      <p class="kid-fixy-line">🔧 Fixy says: "${escapeHtml(message)}"</p>
      ${state.guide.verification ? `<p><strong>Verify it worked:</strong> ${escapeHtml(state.guide.verification)}</p>` : ''}
      ${state.guide.callPro ? `<p class="professional-note"><strong>Still not right?</strong> ${escapeHtml(state.guide.callPro)}</p>` : ''}
      <div class="repair-step-actions">
        <button type="button" class="btn secondary" id="repairCloseComplete">Close</button>
        <a class="btn primary" href="#kids" id="repairSeeKids">See the FixWise Kids activity for this repair</a>
      </div>
    </div>
  `;
  document.getElementById('repairCloseComplete')?.addEventListener('click', closeRepairMode);
  document.getElementById('repairSeeKids')?.addEventListener('click', closeRepairMode);
}

export function initRepairMode() {
  ensureModal();
}
