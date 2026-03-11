import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { TOPIC_GRADE_OPTIONS, TOPIC_STALE_BUCKETS_DAYS } from '../app/constants';
import {
  buildGradesSummary,
  buildStaleSummary,
  getSubmatterReviewAgeDays,
  getSubmatterStaleBucket,
  shouldReviewSubmatterNow,
} from '../app/contentSubmatters';
import { topicGradeLabel } from '../app/formatters';
import type { TopicGrade, TopicSubmatter } from '../app/types';

interface NewSubmatterForm {
  title: string;
  grade: TopicGrade;
  lastReviewedAt: string;
  errorNote: string;
  actionNote: string;
}

type TopicViewMode = 'cards' | 'table';
type TopicSortMode = 'priority' | 'oldest' | 'newest' | 'alphabetical';

const initialForm: NewSubmatterForm = {
  title: '',
  grade: 'C',
  lastReviewedAt: '',
  errorNote: '',
  actionNote: '',
};

const gradeSeverity: Record<TopicGrade, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
};

const compareSubmatters = (sortMode: TopicSortMode, left: TopicSubmatter, right: TopicSubmatter): number => {
  if (sortMode === 'alphabetical') {
    return left.title.localeCompare(right.title, 'pt-BR');
  }

  const leftAge = getSubmatterReviewAgeDays(left) ?? Number.POSITIVE_INFINITY;
  const rightAge = getSubmatterReviewAgeDays(right) ?? Number.POSITIVE_INFINITY;

  if (sortMode === 'oldest') {
    if (rightAge !== leftAge) {
      return rightAge - leftAge;
    }
    return gradeSeverity[right.grade] - gradeSeverity[left.grade];
  }

  if (sortMode === 'newest') {
    if (leftAge !== rightAge) {
      return leftAge - rightAge;
    }
    return left.title.localeCompare(right.title, 'pt-BR');
  }

  const severityDiff = gradeSeverity[right.grade] - gradeSeverity[left.grade];
  if (severityDiff !== 0) {
    return severityDiff;
  }

  if (rightAge !== leftAge) {
    return rightAge - leftAge;
  }

  return left.title.localeCompare(right.title, 'pt-BR');
};

const reviewStatusLabel = (submatter: TopicSubmatter): string => {
  const daysSinceReview = getSubmatterReviewAgeDays(submatter);
  if (daysSinceReview === null) {
    return 'Sem revisão registrada';
  }

  if (daysSinceReview === 0) {
    return 'Revisado hoje';
  }

  return `${daysSinceReview} dia(s) sem revisar`;
};

export const ContentTopicPage = () => {
  const { topicId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const {
    topics,
    state,
    addTopicSubmatter,
    updateTopicSubmatter,
    removeTopicSubmatter,
    markTopicSubmatterReviewedToday,
  } = useAppContext();
  const [form, setForm] = useState<NewSubmatterForm>(initialForm);
  const [viewMode, setViewMode] = useState<TopicViewMode>('cards');
  const [sortMode, setSortMode] = useState<TopicSortMode>('priority');

  const topic = topics.find((item) => item.id === topicId && item.isLeaf);
  const focusedSubmatterId = searchParams.get('submatter');
  const submatters = useMemo(
    () => state.topicSubmattersByTopic[topicId] ?? [],
    [state.topicSubmattersByTopic, topicId],
  );

  const sortedSubmatters = useMemo(
    () => [...submatters].sort((left, right) => compareSubmatters(sortMode, left, right)),
    [sortMode, submatters],
  );

  const topicSummary = useMemo(
    () => buildGradesSummary({ [topicId]: submatters }),
    [submatters, topicId],
  );
  const staleSummary = useMemo(
    () => buildStaleSummary({ [topicId]: submatters }),
    [submatters, topicId],
  );
  const reviewNowCount = useMemo(
    () => submatters.filter((submatter) => shouldReviewSubmatterNow(submatter)).length,
    [submatters],
  );

  const handleCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const title = form.title.trim();
    if (!topic || !title) {
      return;
    }

    addTopicSubmatter(topic.id, {
      title,
      grade: form.grade,
      lastReviewedAt: form.lastReviewedAt || null,
      errorNote: form.errorNote.trim(),
      actionNote: form.actionNote.trim(),
    });

    setForm(initialForm);
  };

  if (!topic) {
    return (
      <section className="page">
        <header className="page-header">
          <h2>Tópico não encontrado</h2>
          <p>Esse tópico não existe no conteúdo atual.</p>
        </header>
        <Link className="button" to="/conteudo">
          Voltar para Conteúdo
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <h2>{topic.title}</h2>
        <p>Modo rápido para reavaliar, revisar hoje e registrar erro/ação sem depender da tabela.</p>
      </header>

      <div className="button-row">
        <Link className="button" to="/conteudo">
          Voltar para Conteúdo
        </Link>
        <button
          className={`button ${viewMode === 'cards' ? '' : 'button-secondary'}`}
          type="button"
          onClick={() => setViewMode('cards')}
        >
          Cards rápidos
        </button>
        <button
          className={`button ${viewMode === 'table' ? '' : 'button-secondary'}`}
          type="button"
          onClick={() => setViewMode('table')}
        >
          Tabela avançada
        </button>
      </div>

      <section className="panel review-hero topic-review-hero">
        <div className="review-hero-header">
          <div>
            <p className="review-widget-kicker">Resumo do tópico</p>
            <h3>Ritmo de revisão por submatéria</h3>
          </div>
          <div className="review-hero-aside">
            <div className="review-hero-stat">
              <span className="review-hero-stat-label">Total</span>
              <strong>{topicSummary.total}</strong>
            </div>
            <div className="review-hero-stat review-hero-stat-alert">
              <span className="review-hero-stat-label">Revisar agora</span>
              <strong data-testid="topic-review-now-count">{reviewNowCount}</strong>
            </div>
          </div>
        </div>

        <div className="review-grade-grid">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((grade, index) => (
            <article
              key={grade}
              className={`review-grade-card review-grade-card-${grade.toLowerCase()}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="review-grade-label">{topicGradeLabel(grade)}</span>
              <strong className="review-grade-value">{topicSummary.byGrade[grade]}</strong>
            </article>
          ))}
        </div>

        <div className="review-signal-row">
          <article className="review-signal-card">
            <span className="review-signal-label">Sem revisão</span>
            <strong>{submatters.filter((item) => item.lastReviewedAt === null).length}</strong>
          </article>
          <article className="review-signal-card">
            <span className="review-signal-label">Mais antigas</span>
            <strong>{staleSummary.byDays[15]}</strong>
          </article>
          <article className="review-signal-card review-signal-card-wide">
            <span className="review-signal-label">Buckets do tópico</span>
            <strong>
              {TOPIC_STALE_BUCKETS_DAYS.map((days) => `>${days}d ${staleSummary.byDays[days]}`).join(' · ')}
            </strong>
          </article>
        </div>
      </section>

      <form className="panel submatter-composer" onSubmit={handleCreate}>
        <div className="submatter-composer-head">
          <h3>Nova submatéria</h3>
          <span>Crie e já classifique sem sair da fila.</span>
        </div>

        <div className="submatter-composer-grid">
          <label className="field-label">
            Submatéria
            <input
              className="input"
              data-testid="submatter-create-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>

          <label className="field-label">
            Última revisão
            <input
              className="input"
              type="date"
              value={form.lastReviewedAt}
              onChange={(event) => setForm((current) => ({ ...current, lastReviewedAt: event.target.value }))}
            />
          </label>
        </div>

        <div className="grade-chip-row">
          {TOPIC_GRADE_OPTIONS.map((grade) => (
            <button
              key={grade}
              type="button"
              className={`grade-chip grade-chip-${grade.toLowerCase()} ${
                form.grade === grade ? 'grade-chip-active' : ''
              }`}
              onClick={() => setForm((current) => ({ ...current, grade }))}
            >
              {grade}
            </button>
          ))}
        </div>

        <div className="submatter-composer-grid submatter-composer-grid-wide">
          <label className="field-label">
            Erro
            <textarea
              className="textarea"
              rows={2}
              placeholder="Erro: confundi X com Y"
              value={form.errorNote}
              onChange={(event) => setForm((current) => ({ ...current, errorNote: event.target.value }))}
            />
          </label>
          <label className="field-label">
            Ação
            <textarea
              className="textarea"
              rows={2}
              placeholder="Ação: refazer 20 questões e criar 3 cards"
              value={form.actionNote}
              onChange={(event) => setForm((current) => ({ ...current, actionNote: event.target.value }))}
            />
          </label>
        </div>

        <div className="button-row">
          <button className="button" type="submit" data-testid="submatter-create-submit">
            Adicionar submatéria
          </button>
        </div>
      </form>

      <section className="panel">
        <div className="review-section-head">
          <div>
            <p className="review-widget-kicker">Ordenação</p>
            <h3>{viewMode === 'cards' ? 'Cards rápidos' : 'Tabela avançada'}</h3>
          </div>
          <select
            className="input topic-sort-select"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as TopicSortMode)}
          >
            <option value="priority">Pior primeiro</option>
            <option value="oldest">Mais antigas</option>
            <option value="newest">Mais recentes</option>
            <option value="alphabetical">Alfabética</option>
          </select>
        </div>

        {viewMode === 'cards' ? (
          <div className="submatter-card-list" data-testid="submatter-card-list">
            {sortedSubmatters.map((submatter) => {
              const staleBucket = getSubmatterStaleBucket(submatter);
              const needsReview = shouldReviewSubmatterNow(submatter);

              return (
                <article
                  key={submatter.id}
                  className={`submatter-card submatter-card-${submatter.grade.toLowerCase()} ${
                    needsReview ? 'submatter-card-priority' : ''
                  } ${focusedSubmatterId === submatter.id ? 'submatter-card-focused' : ''}`}
                  data-testid={`submatter-card-${submatter.id}`}
                >
                  <div className="submatter-card-head">
                    <div className="submatter-card-title-wrap">
                      <input
                        className="input submatter-card-title"
                        value={submatter.title}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            title: event.target.value,
                          })
                        }
                      />
                      <div className="submatter-card-statuses">
                        <span className={`grade-pill grade-pill-${submatter.grade.toLowerCase()}`}>
                          Nota {submatter.grade}
                        </span>
                        <span className={`review-badge review-badge-${staleBucket}`}>
                          {reviewStatusLabel(submatter)}
                        </span>
                      </div>
                    </div>

                    <button
                      className="button button-danger"
                      type="button"
                      onClick={() => removeTopicSubmatter(topic.id, submatter.id)}
                    >
                      Excluir
                    </button>
                  </div>

                  <div className="grade-chip-row" data-testid={`grade-chip-row-${submatter.id}`}>
                    {TOPIC_GRADE_OPTIONS.map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        className={`grade-chip grade-chip-${grade.toLowerCase()} ${
                          submatter.grade === grade ? 'grade-chip-active' : ''
                        }`}
                        aria-pressed={submatter.grade === grade}
                        onClick={() =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            grade,
                          })
                        }
                      >
                        {grade}
                      </button>
                    ))}
                  </div>

                  <div className="submatter-card-review-row">
                    <label className="field-label">
                      Última revisão
                      <input
                        className="input"
                        type="date"
                        value={submatter.lastReviewedAt ?? ''}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            lastReviewedAt: event.target.value || null,
                          })
                        }
                      />
                    </label>
                    <button
                      className="button"
                      type="button"
                      onClick={() => markTopicSubmatterReviewedToday(topic.id, submatter.id)}
                    >
                      Hoje
                    </button>
                  </div>

                  <div className="submatter-card-notes">
                    <label className="field-label">
                      Erro
                      <textarea
                        className="textarea"
                        rows={3}
                        value={submatter.errorNote}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            errorNote: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="field-label">
                      Ação
                      <textarea
                        className="textarea"
                        rows={3}
                        value={submatter.actionNote}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            actionNote: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </article>
              );
            })}

            {sortedSubmatters.length === 0 ? (
              <p className="review-empty-state">Nenhuma submatéria cadastrada.</p>
            ) : null}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table submatter-table">
              <thead>
                <tr>
                  <th>Submatéria</th>
                  <th>Nota</th>
                  <th>Última revisão</th>
                  <th>Erro</th>
                  <th>Ação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody data-testid="submatter-table-body">
                {sortedSubmatters.map((submatter) => (
                  <tr key={submatter.id}>
                    <td>
                      <input
                        className="input"
                        value={submatter.title}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            title: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="input"
                        value={submatter.grade}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            grade: event.target.value as TopicGrade,
                          })
                        }
                      >
                        {TOPIC_GRADE_OPTIONS.map((grade) => (
                          <option key={grade} value={grade}>
                            {topicGradeLabel(grade)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="submatter-review-cell">
                        <input
                          className="input"
                          type="date"
                          value={submatter.lastReviewedAt ?? ''}
                          onChange={(event) =>
                            updateTopicSubmatter(topic.id, submatter.id, {
                              lastReviewedAt: event.target.value || null,
                            })
                          }
                        />
                        <button
                          className="button"
                          type="button"
                          onClick={() => markTopicSubmatterReviewedToday(topic.id, submatter.id)}
                        >
                          Hoje
                        </button>
                      </div>
                    </td>
                    <td>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={submatter.errorNote}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            errorNote: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <textarea
                        className="textarea"
                        rows={2}
                        value={submatter.actionNote}
                        onChange={(event) =>
                          updateTopicSubmatter(topic.id, submatter.id, {
                            actionNote: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => removeTopicSubmatter(topic.id, submatter.id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedSubmatters.length === 0 ? (
                  <tr>
                    <td colSpan={6}>Nenhuma submatéria cadastrada.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
};
