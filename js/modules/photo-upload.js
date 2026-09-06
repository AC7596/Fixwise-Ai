// ========================================
// PHOTO UPLOAD: multi-select, preview, remove
// ========================================
const MAX_PHOTOS = 6;
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB per photo

// Each entry: { file, url } — the object URL is created once per file and
// revoked when the photo is removed or the selection is cleared, so we
// never leak URLs by regenerating them on every render.
let selectedPhotos = [];

// Module-level refs to the currently-initialized preview UI, so
// clearPhotos() (called from diagnosis.js on Reset) can re-render the
// preview grid even though it's not part of the initPhotoUpload() closure.
let activePreviewGrid = null;
let activeCountLabel = null;

export function getSelectedPhotos() {
  return selectedPhotos.map(p => p.file);
}

export function clearPhotos() {
  selectedPhotos.forEach(p => URL.revokeObjectURL(p.url));
  selectedPhotos = [];
  renderPreviews();
}

function renderPreviews() {
  const targetGrid = activePreviewGrid;
  if (!targetGrid) return;
  targetGrid.textContent = '';

  selectedPhotos.forEach((entry, index) => {
    targetGrid.appendChild(buildPhotoTile(entry, index));
  });

  if (activeCountLabel) {
    activeCountLabel.textContent = selectedPhotos.length
      ? `${selectedPhotos.length} of ${MAX_PHOTOS} photos added`
      : '';
  }
}

function buildPhotoTile({ file, url }, index) {
  const tile = document.createElement('div');
  tile.className = 'photo-tile';

  const img = document.createElement('img');
  // `url` is always a same-origin `blob:` URI produced locally by
  // URL.createObjectURL(file) below (never remote or user-supplied HTML),
  // so assigning it to `.src` is safe; this is not an HTML-injection sink.
  img.src = url;
  img.alt = `Preview of uploaded photo ${index + 1}: ${file.name}`;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'photo-remove';
  removeBtn.setAttribute('aria-label', `Remove photo ${index + 1}`);
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', () => {
    URL.revokeObjectURL(url);
    selectedPhotos.splice(index, 1);
    renderPreviews();
  });

  const nameLabel = document.createElement('span');
  nameLabel.className = 'photo-tile-name';
  nameLabel.textContent = file.name;
  nameLabel.title = file.name;

  tile.append(img, removeBtn, nameLabel);
  return tile;
}

export function initPhotoUpload({ inputId, previewGridId, errorId, countLabelId, dropZoneId }) {
  const input = document.getElementById(inputId);
  const previewGrid = document.getElementById(previewGridId);
  const errorEl = document.getElementById(errorId);
  const countLabel = countLabelId ? document.getElementById(countLabelId) : null;
  const dropZone = dropZoneId ? document.getElementById(dropZoneId) : null;

  if (!input || !previewGrid) return;

  activePreviewGrid = previewGrid;
  activeCountLabel = countLabel;

  function processFiles(fileList) {
    const files = Array.from(fileList || []);
    const errors = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        errors.push('Only image files can be added.');
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`"${file.name}" is larger than 8MB and was skipped.`);
        continue;
      }
      if (selectedPhotos.length >= MAX_PHOTOS) {
        errors.push(`You can add up to ${MAX_PHOTOS} photos.`);
        break;
      }
      const alreadyAdded = selectedPhotos.some(p => p.file.name === file.name && p.file.size === file.size);
      if (!alreadyAdded) {
        selectedPhotos.push({ file, url: URL.createObjectURL(file) });
      }
    }

    if (errorEl) errorEl.textContent = Array.from(new Set(errors)).join(' ');
    renderPreviews();
  }

  input.addEventListener('change', () => {
    processFiles(input.files);
    input.value = ''; // allow re-selecting the same file later
  });

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.add('is-drag-active');
      });
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropZone.classList.remove('is-drag-active');
      });
    });

    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove('is-drag-active');
      const files = event.dataTransfer && event.dataTransfer.files;
      if (files && files.length) processFiles(files);
    });
  }

  renderPreviews();
}
