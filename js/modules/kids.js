// ========================================
// FIXWISE KIDS / FIXY: small front-end interactivity
// ========================================
// This keeps Fixy playful today while leaving clear hooks for future
// features (parent-linked activities, levels, badges, animated content).
// Message content lives in js/data/fixy-messages.js so it can be reused by
// the interactive repair mode and kids activities (same voice everywhere).
import { FIXY_CONTEXT, getFixyMessage } from '../data/fixy-messages.js';

export function initFixy() {
  const fixyCard = document.querySelector('.fixy-card');
  const speech = document.getElementById('fixySpeech');
  if (!fixyCard || !speech) return;

  fixyCard.setAttribute('role', 'button');
  fixyCard.setAttribute('tabindex', '0');
  fixyCard.setAttribute('aria-label', 'Tap Fixy for an encouraging message');

  const sayNewPhrase = () => {
    speech.textContent = getFixyMessage(FIXY_CONTEXT.IDLE, speech.textContent);
  };

  fixyCard.addEventListener('click', sayNewPhrase);
  fixyCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sayNewPhrase();
    }
  });
}

/**
 * Say a specific contextual Fixy line into any element that has a
 * `data-fixy-speech` region, e.g. inside the interactive repair mode or
 * kids activities. Returns the message shown, so callers can log it to a
 * repair session if useful.
 * @param {HTMLElement} targetEl element whose textContent gets the message
 * @param {string} context one of FIXY_CONTEXT.*
 */
export function sayFixy(targetEl, context) {
  if (!targetEl) return '';
  const message = getFixyMessage(context, targetEl.textContent);
  targetEl.textContent = message;
  return message;
}

export { FIXY_CONTEXT };

