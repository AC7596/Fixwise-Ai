import { getPersonalizedTips, getSessionHistory } from './repair-session.js';

export function getChronicleTips() {
  return getPersonalizedTips(getSessionHistory());
}

export function reviewChronicleTips() {
  return getChronicleTips();
}

export function initChronicleTips() {
  const list = document.getElementById('chronicleTipsList');
  if (!list) return;

  const tips = getChronicleTips();
  list.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');
}
