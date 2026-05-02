import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Filter,
  Map as MapIcon,
  Play,
  RotateCcw,
  Search,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppContext } from '../app/AppContext';
import {
  buildCleanCalendarEvents,
  buildCleanDayShortcuts,
  buildCleanPlanContentItems,
  buildReviewSchedule,
  findNextSubjectPlanDate,
  getManualBlockSubjectLabel,
} from '../app/cleanConcursoModule';
import { getLocalTodayIsoDate } from '../app/dateUtils';
import { buildReviewQueue, buildTopicRollups } from '../app/contentSubmatters';
import { formatIsoDateCompactPtBr, formatIsoDatePtBr, subjectLabel } from '../app/formatters';
import { getTopicDisplayTitle } from '../app/topics';
import type { ManualBlock, SubjectKey, TopicGrade } from '../app/types';

type ModuleView = 'dia' | 'conteudo' | 'calendario';
type ContentFilter = 'all' | 'review' | TopicGrade;

const CALENDAR_EVENT_BATCH_SIZE = 50;
const gradeFilters: ContentFilter[] = ['all', 'review', 'A', 'B', 'C', 'D', 'E'];

const gradeLabel = (filter: ContentFilter): string => {
  if (filter === 'all') return 'Tudo';
  if (filter === 'review') return 'Revisar';
  return `Nota ${filter}`;
};

const calendarToneLabel: Record<string, string> = {
  study: 'Estudo',
  review: 'Revisão',
  exam: 'Simulado',
  writing: 'Redação',
  rest: 'Descanso',
  failed: 'Realocado',
};

const calendarStatusLabel = {
  pending: 'Pendente',
  done: 'Feito',
  failed: 'Falhou',
} as const;

const groupPlanItemsBySubject = (
  items: Array<{ subject: SubjectKey | null }>,
): Record<SubjectKey, number> =>
  items.reduce<Record<SubjectKey, number>>(
    (accumulator, topic) => {
      if (topic.subject) {
        accumulator[topic.subject] += 1;
      }
      return accumulator;
    },
    {
      portugues: 0,
      rlm: 0,
      legislacao: 0,
      especificos: 0,
    },
  );

const pickPlanItemGrade = (
  topicIds: string[],
  rollups: ReturnType<typeof buildTopicRollups>,
): TopicGrade => {
  const order: TopicGrade[] = ['E', 'D', 'C', 'B', 'A'];
  const grades = topicIds.map((topicId) => rollups[topicId]?.currentGrade ?? 'E');
  return order.find((grade) => grades.includes(grade)) ?? 'E';
};

const hasPlanItemReviewNow = (
  topicIds: string[],
  reviewQueue: ReturnType<typeof buildReviewQueue>,
): boolean => {
  const targetIds = new Set(topicIds);
  return reviewQueue.some((item) => targetIds.has(item.topicId) && item.needsReview);
};

export const CleanConcursoPage = () => {
  const {
    state,
    topics,
    dayPlans,
    dayPlansByDate,
    setSelectedDate,
    completeCalendarEvent,
    failCalendarManualBlock,
    markTopicSubmatterReviewedToday,
    setCalendarEventStatus,
    undoCalendarManualBlockFailure,
    unsetCalendarEventDone,
  } = useAppContext();
  const [activeView, setActiveView] = useState<ModuleView>('dia');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [search, setSearch] = useState('');
  const [mappedTopicId, setMappedTopicId] = useState<string | null>(null);
  const [expandedCalendarEventId, setExpandedCalendarEventId] = useState<string | null>(null);
  const [calendarVisibleCount, setCalendarVisibleCount] = useState(CALENDAR_EVENT_BATCH_SIZE);

  const today = getLocalTodayIsoDate();
  const dayShortcuts = useMemo(() => buildCleanDayShortcuts(today), [today]);
  const selectedPlan = dayPlansByDate[state.selectedDate];
  const selectedBlocks = selectedPlan?.manualBlocks ?? [];
  const reviewQueue = useMemo(
    () => buildReviewQueue(state.topicSubmattersByTopic, topics, state.selectedDate),
    [state.topicSubmattersByTopic, state.selectedDate, topics],
  );
  const rollups = useMemo(
    () => buildTopicRollups(state.topicSubmattersByTopic, topics, state.selectedDate),
    [state.topicSubmattersByTopic, state.selectedDate, topics],
  );
  const pendingReviewQueue = useMemo(
    () => reviewQueue.filter((item) => item.needsReview),
    [reviewQueue],
  );
  const leafTopics = useMemo(() => topics.filter((topic) => topic.isLeaf), [topics]);
  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);
  const planContentItems = useMemo(() => buildCleanPlanContentItems(dayPlans), [dayPlans]);
  const planItemsBySubject = useMemo(() => groupPlanItemsBySubject(planContentItems), [planContentItems]);
  const failedBlocksByDate = useMemo(
    () =>
      state.manualBlockReschedules.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.failedAt] = (accumulator[item.failedAt] ?? 0) + 1;
        return accumulator;
      }, {}),
    [state.manualBlockReschedules],
  );
  const calendarEvents = useMemo(
    () =>
      buildCleanCalendarEvents(
        dayPlans,
        state.topicSubmattersByTopic,
        topics,
        dayPlans[0]?.date,
        state.calendarEventProgress,
        state.manualBlockReschedules,
      ),
    [dayPlans, state.calendarEventProgress, state.manualBlockReschedules, state.topicSubmattersByTopic, topics],
  );
  const mappedTopic = useMemo(
    () => leafTopics.find((topic) => topic.id === mappedTopicId) ?? leafTopics[0] ?? null,
    [leafTopics, mappedTopicId],
  );
  const mappedSubmatters = mappedTopic ? state.topicSubmattersByTopic[mappedTopic.id] ?? [] : [];
  const visibleCalendarEvents = useMemo(
    () => calendarEvents.slice(0, calendarVisibleCount),
    [calendarEvents, calendarVisibleCount],
  );

  const filteredPlanItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return planContentItems.filter((item) => {
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false;

      const currentGrade = pickPlanItemGrade(item.topicIds, rollups);

      if (contentFilter !== 'all' && contentFilter !== 'review' && currentGrade !== contentFilter) {
        return false;
      }

      if (contentFilter === 'review' && !hasPlanItemReviewNow(item.topicIds, reviewQueue)) {
        return false;
      }

      if (!normalizedSearch) return true;
      return [
        item.block.title,
        item.block.detail,
        item.block.area,
        getManualBlockSubjectLabel(item.block),
        ...(item.block.contentTargets ?? []).map((target) => `${target.title} ${target.sectionTitle}`),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [contentFilter, planContentItems, reviewQueue, rollups, search, subjectFilter]);

  const dashboardStats = useMemo(() => {
    const reviewNow = pendingReviewQueue.length;
    const completedItems = planContentItems.filter((item) => pickPlanItemGrade(item.topicIds, rollups) === 'A').length;
    const failedBlocks = state.manualBlockReschedules.length;
    const progress = planContentItems.length > 0 ? Math.round((completedItems / planContentItems.length) * 100) : 0;

    return {
      reviewNow,
      failedBlocks,
      progress,
      totalTopics: leafTopics.length,
      totalPlanItems: planContentItems.length,
      calendarEvents: calendarEvents.length,
    };
  }, [calendarEvents.length, leafTopics.length, pendingReviewQueue.length, planContentItems, rollups, state.manualBlockReschedules.length]);

  const handleBlockFailure = (block: ManualBlock): void => {
    failCalendarManualBlock(state.selectedDate, block);
  };

  const handleReviewTopic = (topicId: string): void => {
    const [firstSubmatter] = state.topicSubmattersByTopic[topicId] ?? [];
    if (firstSubmatter) {
      markTopicSubmatterReviewedToday(topicId, firstSubmatter.id);
    }
  };

  const handleOpenTopicMap = (topicId: string): void => {
    if (!topicId) return;
    setMappedTopicId(topicId);
    setActiveView('conteudo');
  };

  const handleCalendarFailure = (event: (typeof calendarEvents)[number]): void => {
    if (event.block) {
      failCalendarManualBlock(event.date, event.block);
      return;
    }

    if (event.blockId && event.kind === 'failed') {
      undoCalendarManualBlockFailure(event.date, event.blockId);
    }
  };

  const getCalendarEventSubmatters = (event: (typeof calendarEvents)[number]) =>
    event.topicIds.flatMap((topicId) =>
      (state.topicSubmattersByTopic[topicId] ?? []).map((submatter) => ({
        topicId,
        submatter,
        topic: topicById.get(topicId) ?? null,
      })),
    );

  const handleOpenCalendarView = (): void => {
    setActiveView('calendario');
    setCalendarVisibleCount(CALENDAR_EVENT_BATCH_SIZE);
    setExpandedCalendarEventId(null);
  };

  return (
    <section className="clean-module-page" data-testid="clean-concurso-module">
      <header className="clean-hero">
        <div className="clean-hero-copy">
          <span className="clean-kicker">
            <Trophy size={16} />
            Novo módulo de concurso
          </span>
          <h1>Lumina Study Command Center</h1>
          <p>
            Um painel direto para executar o dia, consultar o conteúdo programático completo,
            ver revisões e realocar automaticamente qualquer matéria que falhar.
          </p>
        </div>
        <div className="clean-hero-panel">
          <span>Progresso do edital</span>
          <strong>{dashboardStats.progress}%</strong>
          <div className="clean-meter">
            <div style={{ width: `${dashboardStats.progress}%` }} />
          </div>
        </div>
      </header>

      <nav className="clean-tabs" aria-label="Visões do novo módulo">
        {[
          { key: 'dia', label: 'Dia', icon: Play },
          { key: 'conteudo', label: 'Conteúdo', icon: BookOpen },
          { key: 'calendario', label: 'Calendário', icon: CalendarDays },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.key}
              className={activeView === item.key ? 'clean-tab clean-tab-active' : 'clean-tab'}
              onClick={() => {
                if (item.key === 'calendario') {
                  handleOpenCalendarView();
                  return;
                }
                setActiveView(item.key as ModuleView);
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="clean-stats-grid">
        <article className="clean-stat-card">
          <Target size={18} />
          <span>Matérias mapeadas</span>
          <strong>{dashboardStats.totalPlanItems}</strong>
        </article>
        <article className="clean-stat-card">
          <RotateCcw size={18} />
          <span>Revisar agora</span>
          <strong>{dashboardStats.reviewNow}</strong>
        </article>
        <article className="clean-stat-card">
          <XCircle size={18} />
          <span>Falhas realocadas</span>
          <strong>{dashboardStats.failedBlocks}</strong>
        </article>
      </div>

      {activeView === 'dia' ? (
        <div className="clean-day-grid">
          <section className="clean-panel clean-day-panel">
            <div className="clean-panel-head">
              <div>
                <span className="clean-kicker">Filtro por dia</span>
                <h2>{formatIsoDatePtBr(state.selectedDate)}</h2>
              </div>
              <input
                type="date"
                value={state.selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="clean-date-input"
                aria-label="Escolher data do plano"
              />
            </div>

            <div className="clean-day-shortcuts">
              {dayShortcuts.map((shortcut) => (
                <button
                  type="button"
                  key={shortcut.key}
                  className={state.selectedDate === shortcut.date ? 'clean-day-chip active' : 'clean-day-chip'}
                  onClick={() => setSelectedDate(shortcut.date)}
                >
                  <span>{shortcut.label}</span>
                  <strong>{formatIsoDateCompactPtBr(shortcut.date)}</strong>
                </button>
              ))}
            </div>

            {selectedPlan?.isRestDay ? (
              <div className="clean-empty-state">Esse dia está reservado para descanso fixo.</div>
            ) : (
              <div className="clean-task-list">
                {selectedBlocks.map((block) => {
                  const nextDate = findNextSubjectPlanDate(dayPlans, state.selectedDate, block);
                  return (
                    <article className="clean-task-card" key={block.id}>
                      <div>
                        <span className="clean-task-area">{getManualBlockSubjectLabel(block)}</span>
                        <h3>{block.title}</h3>
                        <p>{block.detail}</p>
                        {nextDate ? (
                          <small>Se falhar, volta no próximo ciclo compatível: {formatIsoDateCompactPtBr(nextDate)}</small>
                        ) : null}
                      </div>
                      <div className="clean-task-actions">
                        {block.contentTargets?.[0] ? (
                          <button
                            type="button"
                            className="clean-icon-link"
                            onClick={() => handleOpenTopicMap(block.contentTargets?.[0]?.topicId ?? '')}
                          >
                            <Play size={15} />
                            Estudar
                          </button>
                        ) : null}
                        <button type="button" className="clean-fail-button" onClick={() => handleBlockFailure(block)}>
                          <XCircle size={15} />
                          Falhei
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="clean-panel clean-review-panel">
            <div className="clean-panel-head compact">
              <div>
                <span className="clean-kicker">Revisão crítica</span>
                <h2>Fila automática</h2>
              </div>
              <RotateCcw size={20} />
            </div>
            <div className="clean-review-list">
              {pendingReviewQueue.slice(0, 7).map((item) => (
                <article className="clean-review-item" key={item.submatterId}>
                  <span>Nota {item.grade}</span>
                  <strong>{item.submatterTitle}</strong>
                  <p>{item.topicTitle}</p>
                  <button type="button" onClick={() => handleReviewTopic(item.topicId)}>
                    <CheckCircle2 size={14} />
                    Revisado hoje
                  </button>
                </article>
              ))}
              {pendingReviewQueue.length === 0 ? (
                <div className="clean-empty-state">Nenhuma revisão vencida para esta data.</div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      {activeView === 'conteudo' ? (
        <div className="clean-content-grid">
          <section className="clean-panel">
            <div className="clean-panel-head">
              <div>
                <span className="clean-kicker">Edital completo</span>
                <h2>Conteúdo Programático</h2>
              </div>
              <span className="clean-count">
                {filteredPlanItems.length} de {planContentItems.length} blocos
              </span>
            </div>

            <div className="clean-filter-bar">
              <label className="clean-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar matéria..."
                />
              </label>
              <label className="clean-select-label">
                <Filter size={16} />
                <select
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value as 'all' | SubjectKey)}
                >
                  <option value="all">Todas</option>
                  <option value="portugues">Português</option>
                  <option value="rlm">RLM</option>
                  <option value="legislacao">Legislação</option>
                  <option value="especificos">Específicos</option>
                </select>
              </label>
            </div>

            <div className="clean-grade-filters">
              {gradeFilters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={contentFilter === filter ? 'clean-grade-chip active' : 'clean-grade-chip'}
                  onClick={() => setContentFilter(filter)}
                >
                  {gradeLabel(filter)}
                </button>
              ))}
            </div>

            <div className="clean-topic-list">
              {filteredPlanItems.map((item) => {
                const grade = pickPlanItemGrade(item.topicIds, rollups);
                const firstTopicId = item.topicIds[0];
                return (
                  <article className="clean-topic-row" key={item.id}>
                    <div className={`clean-grade-dot grade-${grade.toLowerCase()}`} />
                    <div className="clean-topic-main">
                      <span>
                        {getManualBlockSubjectLabel(item.block)}
                        {item.weekNumber ? ` | Semana ${item.weekNumber}` : ''} | {formatIsoDateCompactPtBr(item.date)}
                      </span>
                      <h3>{item.block.title}</h3>
                      <p>
                        {item.block.detail}
                        {item.block.contentTargets?.length ? ` | ${item.block.contentTargets.length} tópico(s) oficial(is)` : ''}
                      </p>
                    </div>
                    <div className="clean-topic-actions">
                      {firstTopicId ? (
                        <button type="button" className="clean-icon-link" onClick={() => handleOpenTopicMap(firstTopicId)}>
                          <Play size={15} />
                          Estudar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={!firstTopicId}
                        onClick={() => firstTopicId && handleReviewTopic(firstTopicId)}
                      >
                        <RotateCcw size={15} />
                        Revisão
                      </button>
                      <button
                        type="button"
                        disabled={!firstTopicId}
                        onClick={() => firstTopicId && setMappedTopicId(firstTopicId)}
                      >
                        <MapIcon size={15} />
                        Mapa
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="clean-panel clean-map-panel">
            <div className="clean-panel-head compact">
              <div>
                <span className="clean-kicker">Mapa</span>
                <h2>{mappedTopic ? getTopicDisplayTitle(mappedTopic) : 'Selecione uma matéria'}</h2>
              </div>
              <BarChart3 size={20} />
            </div>
            {mappedTopic ? (
              <div className="clean-map-body">
                <p>{subjectLabel(mappedTopic.subject)}</p>
                {mappedSubmatters.map((submatter) => (
                  <article className="clean-map-card" key={submatter.id}>
                    <span>Nota {submatter.grade}</span>
                    <strong>{submatter.title}</strong>
                    <div>
                      {buildReviewSchedule(submatter, state.selectedDate).map((item) => (
                        <small key={`${submatter.id}-${item.date}`}>
                          {item.label}: {formatIsoDateCompactPtBr(item.date)}
                        </small>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {activeView === 'calendario' ? (
        <section className="clean-panel">
          <div className="clean-panel-head">
            <div>
              <span className="clean-kicker">Agenda completa</span>
              <h2>Calendário de estudos e revisões</h2>
            </div>
            <span className="clean-count">{dashboardStats.calendarEvents} eventos</span>
          </div>
          <div className="clean-calendar-list">
            {visibleCalendarEvents.map((event) => {
              const isExpanded = expandedCalendarEventId === event.id;
              const eventSubmatters = getCalendarEventSubmatters(event);
              const canFail = event.block !== null || event.kind === 'failed';

              return (
                <article
                  className={`clean-calendar-event tone-${event.tone} status-${event.status}`}
                  key={event.id}
                >
                  <time>{formatIsoDateCompactPtBr(event.date)}</time>
                  <div className="clean-calendar-event-body">
                    <div className="clean-calendar-event-top">
                      <span>{calendarToneLabel[event.tone]}</span>
                      <span className={`clean-status-pill status-${event.status}`}>
                        {calendarStatusLabel[event.status]}
                      </span>
                    </div>
                    <strong>{event.title}</strong>
                    <p>{event.subtitle}</p>
                    {failedBlocksByDate[event.date] && event.kind !== 'failed' ? (
                      <small>{failedBlocksByDate[event.date]} falha(s) realocada(s) deste dia.</small>
                    ) : null}
                    <div className="clean-calendar-actions">
                      <button
                        type="button"
                        className="clean-calendar-manage"
                        onClick={() => setExpandedCalendarEventId(isExpanded ? null : event.id)}
                        aria-expanded={isExpanded}
                      >
                        <ChevronDown size={15} />
                        Gerenciar
                      </button>
                      <button
                        type="button"
                        onClick={() => completeCalendarEvent(event.id, event.topicIds)}
                        disabled={event.status === 'done'}
                      >
                        <CheckCircle2 size={15} />
                        Feito
                      </button>
                      <button
                        type="button"
                        onClick={() => unsetCalendarEventDone(event.id)}
                        disabled={event.status !== 'done'}
                      >
                        <RotateCcw size={15} />
                        Desmarcar
                      </button>
                      {canFail ? (
                        <button
                          type="button"
                          className="clean-fail-button"
                          onClick={() => handleCalendarFailure(event)}
                        >
                          <XCircle size={15} />
                          {event.kind === 'failed' ? 'Desfazer falha' : 'Falhei'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCalendarEventStatus(event.id, 'failed')}
                          disabled={event.status === 'failed'}
                        >
                          <XCircle size={15} />
                          Falhei
                        </button>
                      )}
                    </div>
                    <div className={isExpanded ? 'clean-calendar-drawer open' : 'clean-calendar-drawer'}>
                      <div className="clean-calendar-drawer-grid">
                        <section>
                          <span className="clean-kicker">Opções</span>
                          <h3>{event.status === 'failed' ? 'Falha registrada' : 'Controle do evento'}</h3>
                          <p>
                            Use este painel para ver o que já foi feito, desfazer marcações ou mandar a
                            matéria de volta para o fluxo quando falhar.
                          </p>
                        </section>
                        <section>
                          <span className="clean-kicker">Calendário de revisão</span>
                          {eventSubmatters.length > 0 ? (
                            <div className="clean-review-calendar">
                              {eventSubmatters.map(({ topic, submatter }) => (
                                <article key={`${event.id}-${submatter.id}`}>
                                  <strong>{submatter.title}</strong>
                                  <p>{topic ? subjectLabel(topic.subject) : event.subtitle} | Nota {submatter.grade}</p>
                                  <div>
                                    {buildReviewSchedule(submatter, event.date).map((item) => (
                                      <small key={`${submatter.id}-${item.date}`}>
                                        {item.label}: {formatIsoDateCompactPtBr(item.date)}
                                      </small>
                                    ))}
                                  </div>
                                </article>
                              ))}
                            </div>
                          ) : (
                            <p>Este evento não tem matéria oficial vinculada para revisão automática.</p>
                          )}
                        </section>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {calendarVisibleCount < calendarEvents.length ? (
            <div className="clean-calendar-more">
              <span>
                Mostrando {visibleCalendarEvents.length} de {calendarEvents.length} eventos
              </span>
              <button
                type="button"
                onClick={() =>
                  setCalendarVisibleCount((current) =>
                    Math.min(current + CALENDAR_EVENT_BATCH_SIZE, calendarEvents.length),
                  )
                }
              >
                <ChevronDown size={16} />
                Carregar mais
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="clean-subject-strip" aria-label="Resumo por matéria">
        {(Object.keys(planItemsBySubject) as SubjectKey[]).map((subject) => (
          <article key={subject}>
            <span>{subjectLabel(subject)}</span>
            <strong>{planItemsBySubject[subject]}</strong>
          </article>
        ))}
      </section>
    </section>
  );
};
