import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { TOPIC_STALE_BUCKETS_DAYS } from '../app/constants';
import { buildGradesSummary, buildStaleSummary } from '../app/contentSubmatters';
import { subjectLabel } from '../app/formatters';
import type { SubjectKey } from '../app/types';

export const ContentPage = () => {
  const { topics, state } = useAppContext();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');

  const groupedSections = useMemo(() => {
    const sectionTopics = topics.filter((topic) => !topic.isLeaf);

    return sectionTopics
      .map((section) => {
        const children = topics.filter(
          (topic) =>
            topic.parentId === section.id &&
            (subjectFilter === 'all' || topic.subject === subjectFilter) &&
            topic.title.toLowerCase().includes(search.toLowerCase()),
        );

        return { section, children };
      })
      .filter((item) => item.children.length > 0);
  }, [search, subjectFilter, topics]);

  const gradesSummary = useMemo(
    () => buildGradesSummary(state.topicSubmattersByTopic),
    [state.topicSubmattersByTopic],
  );
  const staleSummary = useMemo(
    () => buildStaleSummary(state.topicSubmattersByTopic),
    [state.topicSubmattersByTopic],
  );

  return (
    <section className="page">
      <header className="page-header">
        <h2>Conteúdo Pragmático</h2>
        <p>
          Agora a evolução é por nota de desempenho A até E. Clique no tópico para abrir a tabela de
          submatérias.
        </p>
      </header>

      <div className="panel content-summary-grid">
        <article className="content-summary-card">
          <p className="content-summary-label">Total de submatérias</p>
          <p className="content-summary-value">{gradesSummary.total}</p>
        </article>
        <article className="content-summary-card">
          <p className="content-summary-label">Notas</p>
          <p className="content-summary-value">
            A {gradesSummary.byGrade.A} | B {gradesSummary.byGrade.B} | C {gradesSummary.byGrade.C} | D{' '}
            {gradesSummary.byGrade.D} | E {gradesSummary.byGrade.E}
          </p>
        </article>
        <article className="content-summary-card">
          <p className="content-summary-label">Sem revisar</p>
          <p className="content-summary-value">
            {TOPIC_STALE_BUCKETS_DAYS.map((days) => `>${days}d: ${staleSummary.byDays[days]}`).join(' | ')}
          </p>
        </article>
      </div>

      <div className="panel controls-row">
        <input
          className="input"
          placeholder="Buscar tópico..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="input"
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value as 'all' | SubjectKey)}
        >
          <option value="all">Todas as matérias</option>
          <option value="portugues">Português</option>
          <option value="rlm">RLM</option>
          <option value="legislacao">Legislação</option>
          <option value="especificos">Específicos</option>
        </select>
      </div>

      <div className="accordion-list">
        {groupedSections.map(({ section, children }) => (
          <details className="panel" open key={section.id}>
            <summary>
              {section.title} ({children.length})
            </summary>
            <div className="topic-list">
              {children.map((topic) => {
                const submatters = state.topicSubmattersByTopic[topic.id] ?? [];
                return (
                  <article className="topic-item" key={topic.id}>
                    <Link className="topic-title topic-title-link" to={`/conteudo/topico/${topic.id}`}>
                      {topic.title}
                    </Link>
                    <p className="projects-card-meta">
                      Matéria: {subjectLabel(topic.subject)} | Submatérias: {submatters.length}
                    </p>
                  </article>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};
