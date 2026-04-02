import fs from 'fs';

const filePath = 'C:\\Users\\israe\\OneDrive\\Documentos\\Projetos\\projeto-67-Dias\\CONCURSO\\src\\pages\\ContentTopicPage.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const injection = `
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
`;

const needle = '        ) : null}\\n      </SectionCard>\\n    </div>\\n  );';
const needleRegex = /        \) : null\}\s*<\/SectionCard>\s*<\/div>\s*\);/m;

if (needleRegex.test(content)) {
  content = content.replace(needleRegex, (match) => {
     return \`        ) : null}
      </SectionCard>
\${injection}
    </div>
  );\`;
  });
  console.log('Successfully injected the submatter list.');
} else {
  console.log('Could not find the injection point.');
}

fs.writeFileSync(filePath, content, 'utf-8');
