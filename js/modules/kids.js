// ========================================
// FIXWISE KIDS / FIXY: small front-end interactivity
// ========================================
// This keeps Fixy playful today while leaving clear hooks for future
// features (parent-linked activities, levels, badges, animated content).
const fixyPhrases = [
  'I don\'t know yet — let\'s figure it out!',
  'Every builder started as a beginner!',
  'Tools are just answers to "how do I do that?"',
  'Mistakes help us learn how things really work.',
  'Let\'s measure twice before we decide anything!'
];

export function initFixy() {
  const fixyCard = document.querySelector('.fixy-card');
  const speech = document.getElementById('fixySpeech');
  if (!fixyCard || !speech) return;

  fixyCard.setAttribute('role', 'button');
  fixyCard.setAttribute('tabindex', '0');
  fixyCard.setAttribute('aria-label', 'Tap Fixy for an encouraging message');

  const sayNewPhrase = () => {
    const current = speech.textContent;
    let next = current;
    while (next === current) {
      next = fixyPhrases[Math.floor(Math.random() * fixyPhrases.length)];
    }
    speech.textContent = next;
  };

  fixyCard.addEventListener('click', sayNewPhrase);
  fixyCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sayNewPhrase();
    }
  });
}
