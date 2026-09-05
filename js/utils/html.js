// ========================================
// Small shared DOM/string helpers
// ========================================
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}
