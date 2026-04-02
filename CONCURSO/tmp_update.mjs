import fs from 'fs';

const filePath = 'C:\\Users\\israe\\OneDrive\\Documentos\\Projetos\\projeto-67-Dias\\CONCURSO\\src\\pages\\ContentTopicPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. the renderTopicFilesDetail ending to inject the submatter list
const oldTopicDetailEnd = `        {topicTheoreticalContents.length === 0 ? (
          <EmptyState message="Nenhum conteúdo teórico cadastrado para esta matéria." />
        ) : null}
      </SectionCard>
    </div>
  );`;

const newTopicDetailEnd = `        {topicTheoreticalContents.length === 0 ? (
          <EmptyState message="Nenhum conteúdo teórico cadastrado para esta matéria." />
        ) : null}
      </SectionCard>

      <SectionCard
        kicker="Contextos Específicos"
        title="Arquivos por Submatéria"
        aside={<span className="review-queue-counter">{sortedSubmatters.length} submatéria(s)</span>}
      >
        <div className="topic-files-submatter-list">
          {sortedSubmatters.map((submatter) => {
            const submatterContents = submatterTheoreticalContentsMap.get(submatter.id) ?? [];
            const completedCount = submatterContents.filter((item) => item.completedAt !== null).length;

            return (
              <article
                key={\`files-topic-submatter-\${submatter.id}\`}
                className={\`topic-files-submatter-card \${
                  focusedSubmatterId === submatter.id ? 'topic-files-submatter-card-focused' : ''
                }\`}
              >
                <div>
                  <strong>{submatter.title}</strong>
                  <p className="projects-card-meta">
                    Nota {submatter.grade} · {submatterContents.length} arquivo(s) · {completedCount} feito(s)
                  </p>
                </div>
                <div className="button-row">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => handleOpenSubmatterFiles(submatter.id)}
                  >
                    Gerenciar arquivos isolados
                  </button>
                </div>
              </article>
            );
          })}

          {sortedSubmatters.length === 0 ? (
            <EmptyState message="Cadastre uma submatéria para organizar arquivos por contexto." />
          ) : null}
        </div>
      </SectionCard>
    </div>
  );`;

// 2. the entire renderFilesHub function
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

// normalize CRLF to LF for reliable string replacement
let normalizedContent = content.replace(/\\r\\n/g, '\\n');
let topicReplaceTarget = oldTopicDetailEnd.replace(/\\r\\n/g, '\\n');

if (normalizedContent.includes(topicReplaceTarget)) {
  normalizedContent = normalizedContent.replace(topicReplaceTarget, newTopicDetailEnd);
  console.log('Successfully replaced topic details block');
} else {
  console.error('Failed to find topic details block');
}

if (hubRegex.test(normalizedContent)) {
  normalizedContent = normalizedContent.replace(hubRegex, newHub);
  console.log('Successfully replaced central hub block');
} else {
  console.error('Failed to find central hub block');
}

fs.writeFileSync(filePath, normalizedContent, 'utf-8');
console.log('Done.');
