// ========================================
// FIXWISE KIDS: interactive parent-linked activities
// ========================================
// Turns the FixWise Kids section from a description into a working
// front-end prototype (problem statement section 8/10/11): a child works
// through a small set of activities based on the SAME repair a parent is
// doing, tracked with simple localStorage progress/badges.
import { getActivitySet, defaultActivitySetId, kidsActivitySets } from '../data/kids-activities-data.js';
import { getActiveParentGuideId } from './repair-session.js';
import { getProgress, awardActivity, BADGES, xpForNextLevel } from './kids-progress.js';
import { FIXY_CONTEXT, getFixyMessage } from '../data/fixy-messages.js';
import { escapeHtml } from '../utils/html.js';

let currentSetId = defaultActivitySetId;
let currentIndex = 0;
let orderSelection = [];

function els() {
  return {
    heading: document.getElementById('kidsActivityHeading'),
    sub: document.getElementById('kidsActivitySub'),
    body: document.getElementById('kidsActivityBody'),
    progress: document.getElementById('kidsProgress'),
    picker: document.getElementById('kidsSetPicker')
  };
}

function renderProgress() {
  const { progress } = els();
  if (!progress) return;
  const p = getProgress();
  const xp = xpForNextLevel(p);
  const badgeHtml = Object.values(BADGES).map(b => `
    <span class="kid-badge${p.badges.includes(b.id) ? ' earned' : ''}" title="${escapeHtml(b.description)}">
      <span aria-hidden="true">${b.icon}</span> ${escapeHtml(b.label)}
    </span>
  `).join('');
  progress.innerHTML = `
    <div class="kid-level">Junior Helper — Level ${p.level}</div>
    <div class="kid-xp-bar"><span style="width:${Math.min(100, Math.round((xp.current / xp.needed) * 100))}%"></span></div>
    <div class="kid-badges">${badgeHtml}</div>
  `;
}

function setActiveSet(setId) {
  currentSetId = setId;
  currentIndex = 0;
  renderHeader();
  renderActivity();
}

function renderHeader() {
  const { heading, sub, picker } = els();
  const set = getActivitySet(currentSetId);
  const linkedGuideId = getActiveParentGuideId();
  if (heading) heading.textContent = set ? set.parentTaskLabel : 'Try a sample activity';
  if (sub) {
    sub.textContent = linkedGuideId === currentSetId
      ? 'This activity is based on the repair your parent is currently working on.'
      : 'Sample activity — pick a repair to see the matching Junior Helper activities.';
  }
  if (picker) {
    picker.innerHTML = Object.keys(kidsActivitySets).map(id => {
      const s = kidsActivitySets[id];
      return `<button type="button" class="filter-chip${id === currentSetId ? ' active' : ''}" data-set="${escapeHtml(id)}">${s.icon} ${escapeHtml(s.parentTaskLabel)}</button>`;
    }).join('');
    picker.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => setActiveSet(btn.dataset.set));
    });
  }
}

function renderActivity() {
  const { body } = els();
  if (!body) return;
  const set = getActivitySet(currentSetId);
  if (!set) {
    body.innerHTML = '<p class="empty-state">No activity set available yet.</p>';
    return;
  }

  if (currentIndex >= set.activities.length) {
    const message = getFixyMessage(FIXY_CONTEXT.FINISHED_ACTIVITY);
    body.innerHTML = `
      <div class="kid-activity-card kid-activity-complete">
        <p class="kid-fixy-line">🔧 Fixy says: "${escapeHtml(message)}"</p>
        <h4>All activities complete for this repair!</h4>
        <button type="button" class="btn secondary" id="kidsRestartBtn">Do it again</button>
      </div>
    `;
    document.getElementById('kidsRestartBtn')?.addEventListener('click', () => setActiveSet(currentSetId));
    return;
  }

  const activity = set.activities[currentIndex];
  orderSelection = [];
  body.innerHTML = activityHtml(activity, set.activities.length);
  wireActivity(activity, set.activities.length);
}

function progressLabel(index, total) {
  return `Activity ${index + 1} of ${total}`;
}

function activityHtml(activity, total) {
  const header = `<div class="kid-activity-meta">${progressLabel(currentIndex, total)} · ${BADGES[activity.badge] ? BADGES[activity.badge].icon + ' ' + escapeHtml(BADGES[activity.badge].label) : ''}</div>
    <h4>${escapeHtml(activity.title)}</h4>`;

  if (activity.type === 'info') {
    return `<div class="kid-activity-card">${header}
      <p class="kid-activity-body-text">${escapeHtml(activity.body)}</p>
      <p class="kid-activity-prompt">${escapeHtml(activity.prompt)}</p>
      <div class="kid-options" role="group">
        ${activity.options.map((opt, i) => `<button type="button" class="btn secondary kid-option" data-index="${i}">${escapeHtml(opt)}</button>`).join('')}
      </div>
      <p class="kid-feedback" id="kidFeedback" aria-live="polite"></p>
    </div>`;
  }

  if (activity.type === 'multiple-choice') {
    return `<div class="kid-activity-card">${header}
      <p class="kid-activity-prompt">${escapeHtml(activity.prompt)}</p>
      <div class="kid-options" role="group">
        ${activity.options.map((opt, i) => `<button type="button" class="btn secondary kid-option" data-index="${i}">${escapeHtml(opt)}</button>`).join('')}
      </div>
      <p class="kid-feedback" id="kidFeedback" aria-live="polite"></p>
    </div>`;
  }

  if (activity.type === 'number') {
    return `<div class="kid-activity-card">${header}
      <p class="kid-activity-prompt">${escapeHtml(activity.prompt)}</p>
      <div class="kid-number-row">
        <input type="number" id="kidNumberInput" min="0" inputmode="numeric" aria-label="Your answer" />
        <button type="button" class="btn primary" id="kidNumberSubmit">Check answer</button>
      </div>
      <p class="kid-feedback" id="kidFeedback" aria-live="polite"></p>
    </div>`;
  }

  if (activity.type === 'order') {
    return `<div class="kid-activity-card">${header}
      <p class="kid-activity-prompt">${escapeHtml(activity.prompt)}</p>
      <div class="kid-order-pool" id="kidOrderPool">
        ${shuffle(activity.items).map(item => `<button type="button" class="btn secondary kid-order-item" data-id="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`).join('')}
      </div>
      <div class="kid-order-chosen" id="kidOrderChosen" aria-live="polite"></div>
      <div class="kid-order-actions">
        <button type="button" class="btn secondary" id="kidOrderReset">Start over</button>
        <button type="button" class="btn primary" id="kidOrderCheck">Check order</button>
      </div>
      <p class="kid-feedback" id="kidFeedback" aria-live="polite"></p>
    </div>`;
  }

  return '<p class="empty-state">Activity type not supported yet.</p>';
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function onCorrect(activity, totalInSet) {
  const set = getActivitySet(currentSetId);
  const progress = awardActivity(activity.id, activity.badge, set.activities.length, countCompletedInSet(set));
  renderProgress();
  const feedback = document.getElementById('kidFeedback');
  const message = getFixyMessage(FIXY_CONTEXT.SOLVED_PROBLEM);
  if (feedback) {
    feedback.textContent = `✅ ${activity.explanation} — Fixy: "${message}"`;
    feedback.className = 'kid-feedback is-correct';
  }
  setTimeout(() => {
    currentIndex += 1;
    renderActivity();
  }, 1400);
  return progress;
}

function onIncorrect() {
  const feedback = document.getElementById('kidFeedback');
  const message = getFixyMessage(FIXY_CONTEXT.MISTAKE);
  if (feedback) {
    feedback.textContent = `Not quite — Fixy: "${message}" Try again!`;
    feedback.className = 'kid-feedback is-incorrect';
  }
}

function countCompletedInSet(set) {
  const progress = getProgress();
  return set.activities.filter(a => progress.completedActivityIds.includes(a.id)).length + 1;
}

function wireActivity(activity, total) {
  if (activity.type === 'multiple-choice' || activity.type === 'info') {
    document.querySelectorAll('.kid-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        if (idx === activity.correctIndex) {
          onCorrect(activity, total);
        } else {
          onIncorrect();
        }
      });
    });
  }

  if (activity.type === 'number') {
    document.getElementById('kidNumberSubmit')?.addEventListener('click', () => {
      const input = document.getElementById('kidNumberInput');
      const value = Number(input?.value);
      if (value === activity.correctAnswer) {
        onCorrect(activity, total);
      } else {
        onIncorrect();
      }
    });
  }

  if (activity.type === 'order') {
    const pool = document.getElementById('kidOrderPool');
    const chosen = document.getElementById('kidOrderChosen');
    const renderChosen = () => {
      if (!chosen) return;
      chosen.innerHTML = orderSelection.map((id, i) => {
        const item = activity.items.find(it => it.id === id);
        return `<span class="kid-order-chip">${i + 1}. ${escapeHtml(item ? item.label : id)}</span>`;
      }).join('');
    };
    pool?.querySelectorAll('.kid-order-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (orderSelection.includes(id)) return;
        orderSelection.push(id);
        btn.disabled = true;
        btn.classList.add('is-used');
        renderChosen();
      });
    });
    document.getElementById('kidOrderReset')?.addEventListener('click', () => {
      orderSelection = [];
      renderChosen();
      pool?.querySelectorAll('.kid-order-item').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('is-used');
      });
    });
    document.getElementById('kidOrderCheck')?.addEventListener('click', () => {
      const correctOrder = activity.items.map(it => it.id);
      const matches = orderSelection.length === correctOrder.length
        && orderSelection.every((id, i) => id === correctOrder[i]);
      if (matches) {
        onCorrect(activity, total);
      } else {
        onIncorrect();
      }
    });
  }
}

export function initKidsActivities() {
  if (!document.getElementById('kidsActivityBody')) return;
  const linkedGuideId = getActiveParentGuideId();
  currentSetId = (linkedGuideId && getActivitySet(linkedGuideId)) ? linkedGuideId : defaultActivitySetId;
  renderProgress();
  renderHeader();
  renderActivity();
}

// Allow the repair-mode module to refresh Kids once a parent starts a new
// repair session, so the activity set stays linked to the active repair.
export function refreshKidsForActiveSession() {
  const linkedGuideId = getActiveParentGuideId();
  if (linkedGuideId && getActivitySet(linkedGuideId)) {
    setActiveSet(linkedGuideId);
  }
}
