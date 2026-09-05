// ========================================
// FIXWISE AI — main entry point
// ========================================
import { initNav } from './modules/nav.js';
import { initPhotoUpload } from './modules/photo-upload.js';
import { initDiagnosisForm } from './modules/diagnosis.js';
import { initGuides } from './modules/guides.js';
import { initFixy } from './modules/kids.js';

initNav();
initPhotoUpload({ inputId: 'photoUpload', previewGridId: 'photoPreviewGrid', errorId: 'photoError' });
initDiagnosisForm();
initGuides();
initFixy();
