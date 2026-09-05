// ========================================
// PHOTO UPLOAD: multi-select, preview, remove
// ========================================
const MAX_PHOTOS = 6;
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB per photo

let selectedPhotos = [];

export function getSelectedPhotos() {
  return selectedPhotos;
}

export function clearPhotos() {
  selectedPhotos = [];
  renderPreviews();
}

export function initPhotoUpload({ inputId, previewGridId, errorId }) {
  const input = document.getElementById(inputId);
  const previewGrid = document.getElementById(previewGridId);
  const errorEl = document.getElementById(errorId);

  if (!input || !previewGrid) return;

  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);
    let error = '';

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        error = 'Only image files can be added.';
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        error = `"${file.name}" is larger than 8MB and was skipped.`;
        continue;
      }
      if (selectedPhotos.length >= MAX_PHOTOS) {
        error = `You can add up to ${MAX_PHOTOS} photos.`;
        break;
      }
      const alreadyAdded = selectedPhotos.some(p => p.name === file.name && p.size === file.size);
      if (!alreadyAdded) {
        selectedPhotos.push(file);
      }
    }

    if (errorEl) errorEl.textContent = error;
    input.value = ''; // allow re-selecting the same file later
    renderPreviews(previewGrid);
  });

  renderPreviews(previewGrid);

  function renderPreviews(grid) {
    const targetGrid = grid || document.getElementById(previewGridId);
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    selectedPhotos.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const tile = document.createElement('div');
      tile.className = 'photo-tile';
      tile.innerHTML = `
        <img src="${url}" alt="Preview of uploaded photo ${index + 1}: ${escapeHtml(file.name)}" />
        <button type="button" class="photo-remove" aria-label="Remove photo ${index + 1}">✕</button>
        <span class="photo-tile-name">${escapeHtml(truncate(file.name, 18))}</span>
      `;
      tile.querySelector('.photo-remove').addEventListener('click', () => {
        URL.revokeObjectURL(url);
        selectedPhotos.splice(index, 1);
        renderPreviews(targetGrid);
      });
      targetGrid.appendChild(tile);
    });

    const countLabel = document.getElementById('photoCountLabel');
    if (countLabel) {
      countLabel.textContent = selectedPhotos.length
        ? `${selectedPhotos.length} of ${MAX_PHOTOS} photos added`
        : '';
    }
  }
}

// Exposed so form submit handler can force a re-render after clearing.
export function renderPhotoPreviews(previewGridId) {
  const grid = document.getElementById(previewGridId);
  if (!grid) return;
  grid.innerHTML = '';
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
