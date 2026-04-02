import fs from 'fs';

const tsxPath = 'C:\\Users\\israe\\OneDrive\\Documentos\\Projetos\\projeto-67-Dias\\CONCURSO\\src\\pages\\ContentTopicPage.tsx';
let txt = fs.readFileSync(tsxPath, 'utf8');

// Replace the old renderFilesHub specifically
const hubRegex = /const renderFilesHub = \(\) => \([\s\S]*?Cadastre uma submatéria para organizar os arquivos por contexto\." \/>\s*\) : null\}\s*<\/div>\s*<\/SectionCard>\s*<\/div>\s*\);/g;

const newHub = `const renderFilesHub = () => {
    const hasLessons = topicContextTheoreticalContents.length > 0;
    const firstLesson = topicContextTheoreticalContents[0];

    return (
      <div className="topic-files-hub-grid" data-testid="topic-files-hub">
        <SectionCard
          kicker="Gestão"
          title="Adicionar Arquivos"
          className="topic-files-hub-card"
        >
          <div className="topic-files-hub-card-copy">
            <p className="topic-files-hub-note" style={{ color: 'var(--text-dim)' }}>
              Faça upload de PDFs, cole anotações em Markdown e organize as aulas por submatéria ou na matéria geral.
            </p>
          </div>
          <div className="button-row" style={{ marginTop: 'auto' }}>
            <button className="button button-secondary" type="button" onClick={handleOpenTopicFiles}>
              Gerenciar Banco de Aulas
            </button>
          </div>
        </SectionCard>

        <SectionCard
          kicker="Foco"
          title="Entrar nas Aulas"
          className={\`topic-files-hub-card \${hasLessons ? 'topic-files-hub-card-primary' : ''}\`}
        >
          <div className="topic-files-hub-card-copy">
            {hasLessons ? (
              <>
                <p className="projects-card-meta">
                  {topicContextTheoreticalContents.length} aula(s) disponíveis · {completedLessonCount} concluída(s)
                </p>
                <p className="topic-files-hub-note" style={{ color: 'var(--color-primary)' }}>
                  Acesse o leitor focado, assista sem distrações e vá concluindo seu fluxo lógico.
                </p>
              </>
            ) : (
              <p className="topic-files-hub-note" style={{ color: 'var(--text-dim)' }}>
                Nenhuma aula disponível ainda. Você precisa adicionar PDFs ou Markdown na seção "Gerenciar Banco de Aulas" para poder estudar.
              </p>
            )}
          </div>
          <div className="button-row" style={{ marginTop: 'auto' }}>
            <button 
              className="button" 
              type="button" 
              onClick={() => {
                if (firstLesson) {
                  handleOpenLesson(firstLesson, { layer: 'files-hub', submatterId: null });
                }
              }}
              disabled={!hasLessons}
            >
              Iniciar Estudo
            </button>
          </div>
        </SectionCard>
      </div>
    );
  };`;

if (hubRegex.test(txt)) {
  txt = txt.replace(hubRegex, newHub);
  fs.writeFileSync(tsxPath, txt, 'utf8');
  console.log('Successfully repatched ContentTopicPage.tsx');
} else {
  console.log('WARNING: renderFilesHub regex did not match. It might already be patched or the regex is wrong.');
}

const cssPath = 'C:\\Users\\israe\\OneDrive\\Documentos\\Projetos\\projeto-67-Dias\\CONCURSO\\src\\styles\\pages.css';
const cssAppend = `
/* PHASE 4: OVERLAY PANEL BRUTALISM */
.topic-files-panel {
  background: var(--surface-container-high, rgba(14, 14, 14, 0.95)) !important;
  backdrop-filter: blur(24px) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 24px !important;
  box-shadow: 0 32px 120px rgba(0, 0, 0, 0.8) !important;
}

.topic-files-panel-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  padding-bottom: 24px !important;
  margin-bottom: 24px !important;
}

.topic-files-panel-heading h3 {
  font-family: var(--font-heading, "Space Grotesk", sans-serif) !important;
  font-size: 2.2rem !important;
  letter-spacing: -0.03em !important;
  color: #fff !important;
}

.topic-files-panel-stat {
  background: rgba(255, 255, 255, 0.02) !important;
  border: none !important;
  border-left: 3px solid var(--color-primary, #f5ffc4) !important;
  border-radius: 12px !important;
  padding: 14px 20px !important;
  box-shadow: inset 1px 0 0 rgba(255,255,255,0.02) !important;
}

.topic-files-panel-stat strong {
  color: var(--color-primary, #f5ffc4) !important;
  font-family: var(--font-mono, monospace) !important;
  font-size: 2rem !important;
  text-shadow: 0 0 16px rgba(245, 255, 196, 0.2) !important;
}

.topic-files-panel-heading .btn-back {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 100px !important;
  padding: 8px 16px !important;
  color: var(--text-main) !important;
  font-weight: 600 !important;
  box-shadow: none !important;
}
.topic-files-panel-heading .btn-back:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}
`;

fs.appendFileSync(cssPath, cssAppend, 'utf8');
console.log('Successfully appended overlay CSS to pages.css');
