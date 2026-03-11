import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { TOPIC_STALE_BUCKETS_DAYS } from '../app/constants';
import {
  buildGradesSummary,
  buildReviewQueue,
  buildStaleSummary,
  buildTopicRollups,
} from '../app/contentSubmatters';
import { subjectLabel, topicGradeLabel } from '../app/formatters';
import type { SubjectKey, TopicGrade, TopicSubmatter } from '../app/types';

type QuickFilter = 'all' | 'review-now' | 'stale' | 'unreviewed' | TopicGrade;

type FilterChip = {
  key: QuickFilter;
  label: string;
  tone?: 'neutral' | 'danger';
};

const FILTER_CHIPS: FilterChip[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'review-now', label: 'Revisar agora', tone: 'danger' },
  { key: 'A', label: 'A' },
  { key: 'B', label: 'B' },
  { key: 'C', label: 'C' },
  { key: 'D', label: 'D' },
  { key: 'E', label: 'E' },
  { key: 'unreviewed', label: 'Sem revisão' },
  { key: 'stale', label: 'Mais antigas' },
];

const resolveInitialQuickFilter = (value: string | null): QuickFilter => {
  if (value === 'review-now') {
    return 'review-now';
  }

  return 'all';
};

const matchesSearch = (topicTitle: string, submatters: TopicSubmatter[], normalizedSearch: string): boolean => {
  if (!normalizedSearch) {
    return true;
  }

  if (topicTitle.toLowerCase().includes(normalizedSearch)) {
    return true;
  }

  return submatters.some((submatter) =>
    [submatter.title, submatter.errorNote, submatter.actionNote].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
};

const matchesQuickFilter = (
  filter: QuickFilter,
  submatters: TopicSubmatter[],
  reviewQueueById: Map<string, ReturnType<typeof buildReviewQueue>[number]>,
): boolean => {
  if (filter === 'all') {
    return true;
  }

  return submatters.some((submatter) => {
    const queueItem = reviewQueueById.get(submatter.id);
    if (!queueItem) {
      return false;
    }

    if (filter === 'review-now') {
      return queueItem.needsReview;
    }

    if (filter === 'stale') {
      return queueItem.staleBucket === 'warning' || queueItem.staleBucket === 'critical';
    }

    if (filter === 'unreviewed') {
      return queueItem.staleBucket === 'unreviewed';
    }

    return submatter.grade === filter;
  });
};

export const ContentPage = () => {
  const { topics, state } = useAppContext();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(() =>
    resolveInitialQuickFilter(searchParams.get('focus')),
  );

  const normalizedSearch = search.trim().toLowerCase();

  const gradesSummary = useMemo(
    () => buildGradesSummary(state.topicSubmattersByTopic),
    [state.topicSubmattersByTopic],
  );
  const staleSummary = useMemo(
    () => buildStaleSummary(state.topicSubmattersByTopic),
    [state.topicSubmattersByTopic],
  );
  const reviewQueue = useMemo(
    () => buildReviewQueue(state.topicSubmattersByTopic, topics),
    [state.topicSubmattersByTopic, topics],
  );
  const topicRollups = useMemo(
    () => buildTopicRollups(state.topicSubmattersByTopic, topics),
    [state.topicSubmattersByTopic, topics],
  );

  const reviewQueueById = useMemo(
    () => new Map(reviewQueue.map((item) => [item.submatterId, item])),
    [reviewQueue],
  );

  const filteredReviewQueue = useMemo(() => {
    return reviewQueue.filter((item) => {
      if (!item.needsReview) {
        return false;
      }

      if (subjectFilter !== 'all' && item.subject !== subjectFilter) {
        return false;
      }

      if (
        normalizedSearch &&
        !`${item.topicTitle} ${item.submatterTitle}`.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (quickFilter === 'all' || quickFilter === 'review-now') {
        return true;
      }

      if (quickFilter === 'stale') {
        return item.staleBucket === 'warning' || item.staleBucket === 'critical';
      }

      if (quickFilter === 'unreviewed') {
        return item.staleBucket === 'unreviewed';
      }

      return item.grade === quickFilter;
    });
  }, [normalizedSearch, quickFilter, reviewQueue, subjectFilter]);

  const groupedSections = useMemo(() => {
    const sectionTopics = topics.filter((topic) => !topic.isLeaf);

    return sectionTopics
      .map((section) => {
        const children = topics
          .filter((topic) => topic.parentId === section.id)
          .filter((topic) => topic.isLeaf)
          .filter((topic) => subjectFilter === 'all' || topic.subject === subjectFilter)
          .filter((topic) => {
            const submatters = state.topicSubmattersByTopic[topic.id] ?? [];
            return (
              matchesSearch(topic.title, submatters, normalizedSearch) &&
              matchesQuickFilter(quickFilter, submatters, reviewQueueById)
            );
          })
          .map((topic) => ({
            topic,
            rollup: topicRollups[topic.id],
          }));

        return { section, children };
      })
      .filter((item) => item.children.length > 0);
  }, [
    normalizedSearch,
    quickFilter,
    reviewQueueById,
    state.topicSubmattersByTopic,
    subjectFilter,
    topicRollups,
    topics,
  ]);

  const reviewNowCount = reviewQueue.filter((item) => item.needsReview).length;
  const staleCount = reviewQueue.filter(
    (item) => item.staleBucket === 'warning' || item.staleBucket === 'critical',
  ).length;
  const unreviewedCount = reviewQueue.filter((item) => item.staleBucket === 'unreviewed').length;

  return (
    <section className="page">
      <header className="page-header">
        <h2>Conteúdo Pragmático</h2>
        <p>
          A visão agora começa pelas fraquezas: notas A-E, fila de revisão e tópicos mais
          pressionados para você agir rápido.
        </p>
      </header>

      <section className="panel review-hero">
        <div className="review-hero-header">
          <div>
            <p className="review-widget-kicker">Visão geral do edital</p>
            <h3>Painel de revisão imediata</h3>
            <p className="review-widget-copy">
              O foco é enxergar rápido o que está ruim, o que está parado e onde concentrar a próxima
              revisão.
            </p>
          </div>

          <div className="review-hero-aside">
            <div className="review-hero-stat">
              <span className="review-hero-stat-label">Total</span>
              <strong>{gradesSummary.total}</strong>
            </div>
            <div className="review-hero-stat review-hero-stat-alert">
              <span className="review-hero-stat-label">Revisar agora</span>
              <strong data-testid="content-review-now-total">{reviewNowCount}</strong>
            </div>
          </div>
        </div>

        <div className="review-grade-grid" data-testid="content-grade-overview">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((grade, index) => (
            <article
              key={grade}
              className={`review-grade-card review-grade-card-${grade.toLowerCase()}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span className="review-grade-label">{topicGradeLabel(grade)}</span>
              <strong className="review-grade-value">{gradesSummary.byGrade[grade]}</strong>
            </article>
          ))}
        </div>

        <div className="review-signal-row">
          <article className="review-signal-card">
            <span className="review-signal-label">Sem revisão</span>
            <strong>{unreviewedCount}</strong>
          </article>
          <article className="review-signal-card">
            <span className="review-signal-label">Mais antigas</span>
            <strong>{staleCount}</strong>
          </article>
          <article className="review-signal-card review-signal-card-wide">
            <span className="review-signal-label">Buckets de atraso</span>
            <strong>
              {TOPIC_STALE_BUCKETS_DAYS.map((days) => `>${days}d ${staleSummary.byDays[days]}`).join(' · ')}
            </strong>
          </article>
        </div>
      </section>

      <div className="panel controls-row">
        <input
          className="input"
          placeholder="Buscar tópico, submatéria, erro ou ação..."
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

      <div className="filter-chip-row" data-testid="content-quick-filters">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`filter-chip ${
              quickFilter === chip.key ? 'filter-chip-active' : ''
            } ${chip.tone === 'danger' ? 'filter-chip-danger' : ''}`}
            onClick={() => setQuickFilter(chip.key)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <section className="panel review-queue-panel">
        <div className="review-section-head">
          <div>
            <p className="review-widget-kicker">Revisar agora</p>
            <h3>Fila priorizada por pior nota e mais tempo sem revisão</h3>
          </div>
          <span className="review-queue-counter">{filteredReviewQueue.length} item(ns)</span>
        </div>

        <div className="review-queue-list" data-testid="review-queue-list">
          {filteredReviewQueue.slice(0, 8).map((item) => (
            <Link
              key={item.submatterId}
              className={`review-queue-item review-queue-item-${item.grade.toLowerCase()}`}
              to={`/conteudo/topico/${item.topicId}?submatter=${item.submatterId}`}
            >
              <div className="review-queue-grade">
                <span className={`grade-dot grade-dot-${item.grade.toLowerCase()}`} aria-hidden="true" />
                <strong>{item.grade}</strong>
              </div>
              <div className="review-queue-copy">
                <strong>{item.submatterTitle}</strong>
                <span>
                  {item.topicTitle} · {subjectLabel(item.subject)}
                </span>
              </div>
              <div className="review-queue-meta">
                <span>{item.daysSinceReview === null ? 'Sem revisão' : `${item.daysSinceReview} dia(s)`}</span>
                <span>{item.staleBucket === 'critical' ? 'Crítico' : item.staleBucket === 'warning' ? 'Atrasado' : 'Prioridade'}</span>
              </div>
            </Link>
          ))}

          {filteredReviewQueue.length === 0 ? (
            <p className="review-empty-state">Nenhum item da fila bate com os filtros atuais.</p>
          ) : null}
        </div>
      </section>

      <div className="accordion-list" data-testid="topic-rollup-list">
        {groupedSections.map(({ section, children }) => (
          <details className="panel" open key={section.id}>
            <summary>
              {section.title} ({children.length})
            </summary>
            <div className="topic-rollup-list">
              {children.map(({ topic, rollup }) => (
                <article className="topic-rollup-card" key={topic.id}>
                  <div className="topic-rollup-head">
                    <div>
                      <Link className="topic-title topic-title-link" to={`/conteudo/topico/${topic.id}`}>
                        {topic.title}
                      </Link>
                      <p className="projects-card-meta">
                        {subjectLabel(topic.subject)} · {rollup?.total ?? 0} submatéria(s)
                      </p>
                    </div>
                    <div className="topic-rollup-badges">
                      {rollup?.worstGrade ? (
                        <span className={`grade-pill grade-pill-${rollup.worstGrade.toLowerCase()}`}>
                          Pior: {rollup.worstGrade}
                        </span>
                      ) : null}
                      {rollup?.dominantGrade ? (
                        <span className={`grade-pill grade-pill-${rollup.dominantGrade.toLowerCase()}`}>
                          Domina: {rollup.dominantGrade}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="topic-rollup-stats">
                    <span>Revisar agora: {rollup?.reviewNowCount ?? 0}</span>
                    <span>Mais antigas: {rollup?.staleCount ?? 0}</span>
                    <span>Sem revisão: {rollup?.unreviewedCount ?? 0}</span>
                  </div>

                  <div className="topic-rollup-grade-strip">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => (
                      <span
                        key={grade}
                        className={`topic-rollup-grade topic-rollup-grade-${grade.toLowerCase()}`}
                      >
                        {grade}: {rollup?.byGrade[grade] ?? 0}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
};
