import fs from 'fs';

const filePath = 'C:\\Users\\israe\\OneDrive\\Documentos\\Projetos\\projeto-67-Dias\\CONCURSO\\src\\styles\\pages.css';

const overrides = `
/* PHASE 3: UPLOAD & LESSON CARD BRUTALISM */
.lesson-card {
  gap: 12px;
  background: var(--surface-container-low, rgba(255, 255, 255, 0.02)) !important;
  border: none !important;
  border-left: 2px solid transparent !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
  padding: 16px !important;
}

.lesson-card:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  border-left-color: var(--color-tertiary, #c6fff3) !important;
}

.lesson-paste-input {
  background: rgba(32, 31, 31, 0.6) !important;
  border: none !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05) !important;
  transition: all 0.2s !important;
  color: var(--text-main) !important;
}

.lesson-paste-input:focus {
  box-shadow: inset 0 0 0 1px var(--color-tertiary, #c6fff3),
              0 0 20px rgba(198, 255, 243, 0.15) !important;
  outline: none !important;
}
`;

fs.appendFileSync(filePath, overrides, 'utf-8');
console.log('Appended Brutalism CSS for Phase 3 to pages.css');
