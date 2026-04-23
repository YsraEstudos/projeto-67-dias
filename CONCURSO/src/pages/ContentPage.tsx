import { useDeferredValue, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, BookOpen, Calculator, Scale, Briefcase } from "lucide-react";
import { useAppContext } from "../app/AppContext";
import { getManualTopicSearchAliases } from "../data/manualDailyPlan";
import { TOPIC_STALE_BUCKETS_DAYS } from "../app/constants";
import { MAIN_SITE_URL } from "../app/mainSite";
import { buildManualPlanSummary } from "../app/manualPlanContentRefs";
import { getChecklistProgressPercent } from "../app/progress";
import {
  buildGradesSummary,
  buildReviewQueue,
  buildStaleSummary,
  buildTopicRollups,
} from "../app/contentSubmatters";
import { buildTheoreticalContentProgress } from "../app/contentTheoreticalFiles";
import { exportFullPlanAsMarkdown } from "../app/planExport";
import { subjectLabel, topicStatusLabel, workActivityLabel } from "../app/formatters";
import { getTopicDisplayTitle, getTopicSearchText } from "../app/topics";
import type { SubjectKey, TopicGrade, TopicNode, TopicSubmatter } from "../app/types";

type QuickFilter = "all" | "pending" | "review-now" | "stale" | "unreviewed" | TopicGrade;

type FilterChipProps = {
  key: QuickFilter;
  label: string;
};

const FILTER_CHIPS: FilterChipProps[] = [
  { key: "all", label: "Tudo" },
  { key: "pending", label: "Pendentes" },
  { key: "review-now", label: "Revisar agora" },
  { key: "A", label: "A" },
  { key: "B", label: "B" },
  { key: "C", label: "C" },
  { key: "D", label: "D" },
  { key: "E", label: "E" },
  { key: "unreviewed", label: "Sem revisão" },
  { key: "stale", label: "Mais antigas" },
];

const resolveInitialQuickFilter = (value: string | null): QuickFilter => {
  if (value === "pending") return "pending";
  if (value === "review-now") return "review-now";
  return "all";
};

const matchesSearch = (
  topicSearchText: string,
  manualAliases: string[],
  submatters: TopicSubmatter[],
  normalizedSearch: string,
): boolean => {
  if (!normalizedSearch) return true;
  const normalizedTopicSearchText = topicSearchText.toLowerCase();
  const matchesOfficialTopic = normalizedTopicSearchText.includes(normalizedSearch);
  const matchesManualAlias = manualAliases.some((alias) => alias.toLowerCase().includes(normalizedSearch));
  const isSpecificManualQuery =
    normalizedSearch.length >= 8 ||
    normalizedSearch.includes(':') ||
    normalizedSearch.split(/\s+/).filter(Boolean).length >= 2;

  if (matchesOfficialTopic) return true;
  if (matchesManualAlias && isSpecificManualQuery) return true;
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
  topicCurrentGrade: TopicGrade,
  isPendingTopic: boolean,
): boolean => {
  if (filter === "all") return true;
  if (filter === "pending") return isPendingTopic;
  if (
    filter === "A" ||
    filter === "B" ||
    filter === "C" ||
    filter === "D" ||
    filter === "E"
  ) {
    return topicCurrentGrade === filter;
  }
  return submatters.some((submatter) => {
    const queueItem = reviewQueueById.get(submatter.id);
    if (!queueItem) return false;
    if (filter === "review-now") return queueItem.needsReview;
    if (filter === "stale")
      return (
        queueItem.staleBucket === "warning" ||
        queueItem.staleBucket === "critical"
      );
    return queueItem.staleBucket === "unreviewed";
  });
};

const getSubjectIcon = (subject: string) => {
  switch (subject) {
    case "portugues": return <BookOpen size={18} />;
    case "rlm": return <Calculator size={18} />;
    case "legislacao": return <Scale size={18} />;
    case "especificos": return <Briefcase size={18} />;
    default: return <BookOpen size={18} />;
  }
};

export const ContentPage = () => {
  const { topics, state, dayPlans, dayPlansByDate, setSelectedDate } = useAppContext();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<"all" | SubjectKey>("all");
  const [downloadError, setDownloadError] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(() =>
    resolveInitialQuickFilter(searchParams.get("focus")),
  );

  // States for the Subject Acordion
  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, boolean>
  >({});

  const record = state.dailyRecords[state.selectedDate];
  const dayPlan = dayPlansByDate[state.selectedDate];
  const dayProgress = record
    ? getChecklistProgressPercent(record.checklist)
    : 0;

  const manualSummary = dayPlan?.manualBlocks
    ? buildManualPlanSummary(dayPlan.manualBlocks)
    : "";
  const dayPlanTitle = dayPlan?.isRestDay
    ? "Domingo de descanso"
    : dayPlan?.planMode === "manual"
      ? `Semana ${dayPlan.weekNumber ?? "-"} | ${manualSummary ?? "Roteiro manual"}`
      : `${subjectLabel(dayPlan?.subjects[0] ?? "portugues")} + ${subjectLabel(
          dayPlan?.subjects[1] ?? "rlm",
        )} | ${workActivityLabel(dayPlan?.workActivity ?? "programacao")}`;

  const deferredSearch = useDeferredValue(search);
  const normalizedSearch = useMemo(
    () => deferredSearch.trim().toLowerCase(),
    [deferredSearch],
  );

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
  const pendingTopicIds = useMemo(
    () =>
      new Set(
        Object.entries(state.topicProgress)
          .filter(([, progress]) => progress.status === "pendente")
          .map(([topicId]) => topicId),
      ),
    [state.topicProgress],
  );
  const topicRollups = useMemo(
    () => buildTopicRollups(state.topicSubmattersByTopic, topics),
    [state.topicSubmattersByTopic, topics],
  );

  const lessonProgressByTopic = useMemo(
    () =>
      topics.reduce<
        Record<string, ReturnType<typeof buildTheoreticalContentProgress>>
      >((accumulator, topic) => {
        if (topic.isLeaf) {
          accumulator[topic.id] = buildTheoreticalContentProgress(
            state.theoreticalContents,
            topic.id,
          );
        }
        return accumulator;
      }, {}),
    [state.theoreticalContents, topics],
  );

  const reviewQueueById = useMemo(
    () => new Map(reviewQueue.map((item) => [item.submatterId, item])),
    [reviewQueue],
  );
  const sectionTopics = useMemo(
    () => topics.filter((topic) => !topic.isLeaf),
    [topics],
  );
  const leafTopicsBySectionId = useMemo(() => {
    const groupedTopics = new Map<string, TopicNode[]>();

    for (const topic of topics) {
      if (!topic.isLeaf || !topic.parentId) continue;

      const siblings = groupedTopics.get(topic.parentId);
      if (siblings) {
        siblings.push(topic);
      } else {
        groupedTopics.set(topic.parentId, [topic]);
      }
    }

    return groupedTopics;
  }, [topics]);
  const pendingTopicsCount = pendingTopicIds.size;

  const groupedSections = useMemo(() => {
    return sectionTopics
      .map((section) => {
        const children = (leafTopicsBySectionId.get(section.id) ?? [])
          .filter(
            (topic) =>
              subjectFilter === "all" || topic.subject === subjectFilter,
          )
          .filter((topic) => {
            const submatters = state.topicSubmattersByTopic[topic.id] ?? [];
            const currentGrade = topicRollups[topic.id]?.currentGrade ?? "E";
            const isPendingTopic = pendingTopicIds.has(topic.id);
            return (
              matchesSearch(
                getTopicSearchText(topic),
                getManualTopicSearchAliases(topic.id),
                submatters,
                normalizedSearch,
              ) &&
              matchesQuickFilter(
                quickFilter,
                submatters,
                reviewQueueById,
                currentGrade,
                isPendingTopic,
              )
            );
          })
          .map((topic) => ({
            topic,
            rollup: topicRollups[topic.id],
            isPendingTopic: pendingTopicIds.has(topic.id),
          }));

        const summary = children.reduce(
          (accumulator, { topic, rollup, isPendingTopic }) => {
            accumulator.reviewNow += rollup?.reviewNowCount ?? 0;
            accumulator.pendingLessons +=
              lessonProgressByTopic[topic.id]?.pendingCount ?? 0;
            if ((rollup?.currentGrade ?? "E") === "E")
              accumulator.criticalTopics += 1;
            if (isPendingTopic) accumulator.pendingTopics += 1;
            return accumulator;
          },
          { reviewNow: 0, pendingLessons: 0, criticalTopics: 0, pendingTopics: 0 },
        );

        return { section, children, summary };
      })
      .filter((item) => item.children.length > 0);
  }, [
    leafTopicsBySectionId,
    lessonProgressByTopic,
    normalizedSearch,
    quickFilter,
    reviewQueueById,
    state.topicSubmattersByTopic,
    pendingTopicIds,
    subjectFilter,
    topicRollups,
    sectionTopics,
  ]);

  const reviewCounts = useMemo(
    () =>
      reviewQueue.reduce(
        (accumulator, item) => {
          if (item.needsReview) accumulator.reviewNow += 1;
          if (item.staleBucket === "unreviewed") accumulator.unreviewed += 1;
          return accumulator;
        },
        { reviewNow: 0, unreviewed: 0 },
      ),
    [reviewQueue],
  );
  const visibleTopicCount = useMemo(
    () => groupedSections.reduce((accumulator, curr) => accumulator + curr.children.length, 0),
    [groupedSections],
  );
  const hasDayPlans = dayPlans.length > 0;

  const handleGlobalDownload = (): void => {
    try {
      exportFullPlanAsMarkdown(dayPlans);

      setDownloadError('');
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : "Falha ao baixar o plano completo.",
      );
    }
  };

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  return (
    <div id="view-dashboard" className="view-container">
      {/* DAILY PLAN BANNER */}
      <div className="daily-plan-banner">
        <div className="plan-info-group">
          <div className="plan-data">
            <span>Dia Selecionado</span>
            <input
              type="date"
              className="date-input"
              value={state.selectedDate}
              aria-label="Dia Selecionado"
              min="2024-01-01"
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="plan-data">
            <span>Plano do Dia</span>
            <span>{dayPlanTitle}</span>
          </div>
          <div className="plan-data">
            <span>Conclusão</span>
            <span className="plan-progress">
              {Math.round(dayProgress)}%
            </span>
          </div>
        </div>
        <button
          className="btn-outline"
          onClick={() => window.location.assign(MAIN_SITE_URL)}
        >
          Voltar ao site principal
        </button>
      </div>

      {/* HEADER */}
      <div className="page-header">
        <div className="header-title">
          <h1>Conteúdo Programático</h1>
          <p>
            A visão agora começa pelas fraquezas: notas A-E, fila de revisão,
            pendências manuais e tópicos mais pressionados para você agir rápido.
          </p>
        </div>
        <button
          className="btn-primary"
          disabled={!hasDayPlans}
          onClick={handleGlobalDownload}
        >
          Baixar plano completo em .md
        </button>
      </div>
      {downloadError && (
        <p className="download-error">
          {downloadError}
        </p>
      )}

      {/* DASHBOARD METRICS */}
      <div className="dashboard-grid">
        {/* Totais */}
        <div className="metric-card">
          <div className="metric-card-title">
            <span>Visão Geral do Edital</span>
          </div>
          <div className="totals-group">
            <div className="tot-box">
              <h4>{gradesSummary.total}</h4>
              <span>Total submatérias</span>
            </div>
            <div className="tot-box highlight">
              <h4>{reviewCounts.reviewNow}</h4>
              <span>Revisar Agora</span>
            </div>
          </div>
        </div>

        {/* Grades */}
        <div className="metric-card">
          <div className="metric-card-title">
            <span>Painel de Notas (A-E)</span>
          </div>
          <div className="grades-container">
            {(["A", "B", "C", "D", "E"] as const).map((grade) => (
              <div key={grade} className={`grade-box g-${grade.toLowerCase()}`}>
                <span className="g-label">{grade}</span>
                <span className="g-val">{gradesSummary.byGrade[grade]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Atrasos */}
        <div className="metric-card">
          <div className="metric-card-title">
            <span>Sem Revisão ({reviewCounts.unreviewed})</span>
            <span>Atrasos</span>
          </div>
          <div className="delay-list">
            {TOPIC_STALE_BUCKETS_DAYS.map((days) => (
              <div key={days} className="delay-item">
                <span>&gt; {days} dias</span>
                <span>{staleSummary.byDays[days]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card metric-card-pending">
          <div className="metric-card-title">
            <span>Matérias pendentes</span>
            <span>Manual</span>
          </div>
          <div className="metric-card-summary">
            <strong>{pendingTopicsCount} matéria(s)</strong>
            <p>
              Tudo que você marcar como não estudado aparece com badge próprio e
              no chip <strong>Pendentes</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="filters-section">
        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar tópico, submatéria, erro ou ação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            aria-label="Filtrar por matéria"
            value={subjectFilter}
            onChange={(e) =>
              setSubjectFilter(e.target.value as "all" | SubjectKey)
            }
          >
            <option value="all">Todas as matérias</option>
            <option value="portugues">Português</option>
            <option value="rlm">RLM</option>
            <option value="legislacao">Legislação</option>
            <option value="especificos">Específicos</option>
          </select>
        </div>
        <div className="chips-row" data-testid="content-quick-filters">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              className={`chip ${quickFilter === chip.key ? "active" : ""}`}
              onClick={() => setQuickFilter(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* TOPIC LIST */}
      <div className="list-header">
        <h3>AÇÕES Mapeadas — Fila priorizada por matéria e nota</h3>
        <span>
          {visibleTopicCount}{" "}
          tópico(s) visíveis
        </span>
      </div>

      {groupedSections.length === 0 ? (
        <div className="empty-topic-list">
          Nenhum tópico encontrado para os filtros atuais.
        </div>
      ) : (
        groupedSections.map(({ section, children, summary }) => {
          const isExpanded = expandedSubjects[section.id] !== false; // Default true
          return (
            <div className="subject-group" key={section.id}>
              <div
                className={`subject-header ${isExpanded ? "expanded" : ""}`}
                onClick={() => toggleSubject(section.id)}
              >
                <div className="subject-header-title-group">
                  <ChevronDown className={`caret-icon ${isExpanded ? "expanded" : "collapsed"}`} size={18} />
                  <div className={`subject-icon-box subject-color-${section.subject}`}>
                    {getSubjectIcon(section.subject)}
                  </div>
                  <h4>{section.title}</h4>
                </div>
                <div className="subject-header-stats">
                  {summary.reviewNow > 0 && (
                    <span className="stat-badge review-badge">
                      Revisar: {summary.reviewNow}
                    </span>
                  )}
                  {summary.pendingTopics > 0 && (
                    <span className="stat-badge pending-badge">
                      Pendentes: {summary.pendingTopics}
                    </span>
                  )}
                  {summary.criticalTopics > 0 && (
                    <span className="stat-badge critical-badge">
                      Nota E: {summary.criticalTopics}
                    </span>
                  )}
                </div>
              </div>

              {isExpanded &&
                children.map(({ topic, rollup, isPendingTopic }) => {
                  const topicGrade = rollup?.currentGrade ?? "E";
                  const topicStatus = state.topicProgress[topic.id]?.status ?? "nao_iniciado";
                  return (
                    <article
                      className={`topic-row ${isPendingTopic ? "topic-row-pending" : ""}`}
                      key={topic.id}
                    >
                      <Link
                        to={`/conteudo/topico/${topic.id}`}
                        className="topic-link-wrapper"
                        aria-label={getTopicDisplayTitle(topic)}
                      >
                        <div className="topic-main">
                          <div className="topic-info">
                            <div
                              className={`status-indicator grade-${topicGrade.toLowerCase()}`}
                            />
                            <div className="topic-text">
                              <h5>{getTopicDisplayTitle(topic)}</h5>
                              <p>
                                {subjectLabel(topic.subject)} •{" "}
                                {rollup?.total ?? 0} submatéria(s)
                              </p>
                            </div>
                          </div>
                          <div className="topic-badges">
                            {isPendingTopic && (
                              <span className="badge pending">
                                {topicStatusLabel(topicStatus)}
                              </span>
                            )}
                            <span
                              className={`badge ${topicGrade === "E" ? "alert" : ""}`}
                            >
                              Nota atual {topicGrade}
                            </span>
                            {rollup?.dominantGrade && (
                              <span className="badge">
                                Domina: {rollup.dominantGrade}
                              </span>
                            )}
                            {(rollup?.unreviewedCount ?? 0) > 0 && (
                              <span className="badge">Sem revisão</span>
                            )}
                          </div>
                        </div>

                        <div className="topic-stats-bar">
                          <div className="mini-stats">
                            <div className="ms-item">
                              Revisar agora:{" "}
                              <strong>{rollup?.reviewNowCount ?? 0}</strong>
                            </div>
                            <div className="ms-item">
                              Mais antigas:{" "}
                              <strong>{rollup?.staleCount ?? 0}</strong>
                            </div>
                            <div className="ms-item">
                              Aulas feitas:{" "}
                              <strong>
                                {lessonProgressByTopic[topic.id]
                                  ?.reviewedCount ?? 0}
                              </strong>
                            </div>
                            <div className="ms-item">
                              Aulas pendentes:{" "}
                              <strong>
                                {lessonProgressByTopic[topic.id]
                                  ?.pendingCount ?? 0}
                              </strong>
                            </div>
                          </div>
                          <div className="mini-grades">
                            {(["A", "B", "C", "D", "E"] as const).map(
                              (grade) => {
                                const count = rollup?.byGrade[grade] ?? 0;
                                const isActive = count > 0;
                                return (
                                  <div
                                    key={grade}
                                    className={`mg-item ${isActive ? (grade === "E" ? "active-e" : "active-other") : ""}`}
                                  >
                                    <span>{grade}:</span>
                                    <span>{count}</span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
            </div>
          );
        })
      )}
    </div>
  );
};
