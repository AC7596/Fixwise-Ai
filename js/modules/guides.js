// ========================================
// REPAIR GUIDES: render, search, filter, expand detail
// ========================================
import { repairGuides, getCategories } from '../data/guides-data.js';
import { getLevelBySlug } from '../data/levels.js';
import { escapeHtml } from '../utils/html.js';

let activeCategory = 'All';
let searchTerm = '';

export function initGuides() {
  renderFilterBar();
  renderGuides();

  const searchInput = document.getElementById('guideSearch');
  searchInput?.addEventListener('input', () => {
    searchTerm = searchInput.value.trim().toLowerCase();
    renderGuides();
  });
}

function renderFilterBar() {
  const bar = document.getElementById('guideFilters');
  if (!bar) return;
  const categories = getCategories();
  bar.innerHTML = categories.map(cat => `
    <button type="button" class="filter-chip${cat === activeCategory ? ' active' : ''}" data-category="${escapeHtml(cat)}">
      ${escapeHtml(cat)}
    </button>
  `).join('');

  bar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      bar.querySelectorAll('.filter-chip').forEach(b => b.classList.toggle('active', b === btn));
      renderGuides();
    });
  });
}

function matchesFilters(guide) {
  const categoryMatch = activeCategory === 'All' || guide.category === activeCategory;
  if (!categoryMatch) return false;
  if (!searchTerm) return true;
  const haystack = `${guide.title} ${guide.category} ${guide.symptoms}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function renderGuides() {
  const grid = document.getElementById('guidesGrid');
  const emptyState = document.getElementById('guidesEmpty');
  if (!grid) return;

  const visible = repairGuides.filter(matchesFilters);

  if (visible.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = visible.map(guideCardHtml).join('');

  grid.querySelectorAll('.guide-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.guide-card');
      const detail = card.querySelector('.guide-detail');
      const expanded = detail.style.display === 'block';
      detail.style.display = expanded ? 'none' : 'block';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.textContent = expanded ? 'View full guide' : 'Hide full guide';
    });
  });
}

function guideCardHtml(guide) {
  const level = getLevelBySlug(guide.difficulty);
  return `
    <article class="guide-card" data-id="${escapeHtml(guide.id)}">
      <div class="guide-icon">${guide.icon}</div>
      <span class="tag">${escapeHtml(guide.category)}</span>
      <h3>${escapeHtml(guide.title)}</h3>
      <p>${escapeHtml(guide.symptoms)}</p>
      <div class="guide-meta">
        <span>${escapeHtml(guide.time)}</span>
        <span class="result-badge${level ? ` ${level.className}` : ''}">${level ? level.label : '—'}</span>
      </div>
      <button type="button" class="btn secondary full guide-toggle" aria-expanded="false">View full guide</button>
      <div class="guide-detail" style="display:none">
        ${section('Possible causes', listHtml(guide.causes))}
        ${section('Tools needed', listHtml(guide.tools))}
        ${section('Parts / materials', listHtml(guide.parts))}
        ${section('Safety warnings', listHtml(guide.safety), 'guide-safety')}
        ${section('Step-by-step', listHtml(guide.steps, true))}
        ${section('Helpful tips', listHtml(guide.tips))}
        ${guide.stopWhen ? section('Stop and call a professional if', `<p>${escapeHtml(guide.stopWhen)}</p>`, 'guide-stop') : ''}
        ${guide.callPro ? section('When to call a professional', `<p>${escapeHtml(guide.callPro)}</p>`) : ''}
      </div>
    </article>
  `;
}

function section(title, bodyHtml, extraClass) {
  if (!bodyHtml) return '';
  return `<div class="guide-detail-section${extraClass ? ' ' + extraClass : ''}"><h4>${escapeHtml(title)}</h4>${bodyHtml}</div>`;
}

function listHtml(items, ordered) {
  if (!items || items.length === 0) return '';
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`;
}

