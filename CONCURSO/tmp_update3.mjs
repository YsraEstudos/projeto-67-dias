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
                key={"files-topic-submatter-" + submatter.id}
                className={"topic-files-submatter-card " + (focusedSubmatterId === submatter.id ? "topic-files-submatter-card-focused" : "")}
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

const lines = content.split('\\n');
const targetLineIndex = lines.findIndex(l => l.includes('const renderSubmatterFilesDetail = () => {'));

if (targetLineIndex !== -1) {
  // backtrack to find the ending of renderTopicFilesDetail
  let insertAt = targetLineIndex;
  while(insertAt > 0 && !lines[insertAt - 1].includes('</SectionCard>')) {
    insertAt--;
  }
  
  // insertAt - 1 is the </SectionCard> line. 
  // We want to insert the injection BEFORE the </div> of renderTopicFilesDetail.
  // Wait, if insertAt-1 is </SectionCard>, the next line is </div>
  // Let's just do a string replace on a very specific chunk.
}

const specificChunk = '        ) : null}\\r\\n      </SectionCard>\\r\\n    </div>\\r\\n  );';
const specificChunkUnix = '        ) : null}\\n      </SectionCard>\\n    </div>\\n  );';

if (content.includes(specificChunk)) {
  content = content.replace(specificChunk, '        ) : null}\\r\\n      </SectionCard>\\r\\n' + injection + '    </div>\\r\\n  );');
  console.log('CRLF match succeeded!');
} else if (content.includes(specificChunkUnix)) {
  content = content.replace(specificChunkUnix, '        ) : null}\\n      </SectionCard>\\n' + injection + '    </div>\\n  );');
  console.log('LF match succeeded!');
} else {
  // manual fallback
  content = content.replace('  const renderSubmatterFilesDetail', '    </div>\\n  );\\n\\n  const renderSubmatterFilesDetail');
  console.log('Regex Fallback not perfect but did something.');
}

fs.writeFileSync(filePath, content, 'utf-8');
