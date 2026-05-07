import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CheckSquare2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Filter,
  ListChecks,
  Map as MapIcon,
  Play,
  RotateCcw,
  Search,
  Settings,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppContext } from '../app/AppContext';
import {
  END_DATE,
  START_DATE,
  SUBJECT_ORDER,
} from '../app/constants';
import {
  buildCleanCalendarEvents,
  buildCleanDayShortcuts,
  buildCleanPlanContentItems,
  buildPendingStudyDecisions,
  buildReviewSchedule,
  findNextFailurePlanDate,
  getManualBlockSubjectLabel,
} from '../app/cleanConcursoModule';
import { getLocalTodayIsoDate } from '../app/dateUtils';
import { buildReviewQueue, buildTopicRollups } from '../app/contentSubmatters';
import { formatIsoDateCompactPtBr, formatIsoDatePtBr, subjectLabel } from '../app/formatters';
import { inferManualBlockSubject } from '../app/manualBlockSubjects';
import { getTopicDisplayTitle } from '../app/topics';
import type { ManualBlock, SubjectKey, TopicGrade } from '../app/types';

type ModuleView = 'dia' | 'conteudo' | 'calendario' | 'configuracoes';
type ContentFilter = 'all' | 'review' | TopicGrade;
type StudySession = {
  id: string;
  title: string;
  detail: string;
  subject: string;
  subjectKey: SubjectKey | null;
  topicId: string;
};

type StudyProgressDraft = {
  questionGoal: number;
  questionsDone: number;
  hasCards: boolean;
  hasClasses: boolean;
  isComplete: boolean;
};
type CalendarMonthDay<TEvent> = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  events: TEvent[];
};

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

const createInitialStudyProgress = (questionGoal = 30): StudyProgressDraft => ({
  questionGoal,
  questionsDone: 0,
  hasCards: false,
  hasClasses: false,
  isComplete: false,
});

const clampStudyNumber = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const parseLocalIsoDate = (date: string): Date => new Date(`${date}T00:00:00`);

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthLabelPtBr = (monthIso: string): string =>
  parseLocalIsoDate(`${monthIso}-01`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

const shiftMonth = (monthIso: string, offset: number): string => {
  const date = parseLocalIsoDate(`${monthIso}-01`);
  date.setMonth(date.getMonth() + offset);
  return toIsoDate(date).slice(0, 7);
};

const buildCalendarMonthDays = <TEvent extends { date: string }>(
  monthIso: string,
  eventsByDate: Map<string, TEvent[]>,
): Array<CalendarMonthDay<TEvent>> => {
  const monthStart = parseLocalIsoDate(`${monthIso}-01`);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const isoDate = toIsoDate(date);

    return {
      date: isoDate,
      dayNumber: date.getDate(),
      isCurrentMonth: isoDate.startsWith(monthIso),
      events: eventsByDate.get(isoDate) ?? [],
    };
  });
};

const weekdayOptions = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
] as const;

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
    setDailyNote,
    undoCalendarManualBlockFailure,
    unsetCalendarEventDone,
    setPlanStartDate,
    setRestWeekday,
    setDefaultQuestionGoal,
  } = useAppContext();
  const [activeView, setActiveView] = useState<ModuleView>('dia');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [search, setSearch] = useState('');
  const [mappedTopicId, setMappedTopicId] = useState<string | null>(null);
  const [activeStudySession, setActiveStudySession] = useState<StudySession | null>(null);
  const [studyProgressBySession, setStudyProgressBySession] = useState<Record<string, StudyProgressDraft>>({});
  const [pendingQuestionsByEventId, setPendingQuestionsByEventId] = useState<Record<string, number>>({});
  const [expandedCalendarEventId, setExpandedCalendarEventId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(state.selectedDate.slice(0, 7));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(state.selectedDate);
  const [isCalendarEventListOpen, setIsCalendarEventListOpen] = useState(true);

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
  const calendarEventsByDate = useMemo(
    () =>
      calendarEvents.reduce<Map<string, typeof calendarEvents>>((accumulator, event) => {
        const dayEvents = accumulator.get(event.date) ?? [];
        dayEvents.push(event);
        accumulator.set(event.date, dayEvents);
        return accumulator;
      }, new Map()),
    [calendarEvents],
  );
  const calendarMonthDays = useMemo(
    () => buildCalendarMonthDays(calendarMonth, calendarEventsByDate),
    [calendarEventsByDate, calendarMonth],
  );
  const selectedCalendarEvents = calendarEventsByDate.get(selectedCalendarDate) ?? [];
  const selectedCalendarNote = state.dailyRecords[selectedCalendarDate]?.notes ?? '';
  const selectedDoneEvents = selectedCalendarEvents.filter((event) => event.status === 'done').length;
  const selectedFailedEvents = selectedCalendarEvents.filter((event) => event.status === 'failed').length;
  const activeStudyProgress = activeStudySession
    ? studyProgressBySession[activeStudySession.id] ?? createInitialStudyProgress()
    : createInitialStudyProgress();
  const questionProgress =
    activeStudyProgress.questionGoal > 0
      ? Math.min(100, Math.round((activeStudyProgress.questionsDone / activeStudyProgress.questionGoal) * 100))
      : 0;
  const planStartDate = state.planSettings.startDate;
  const planEndDate = dayPlans.at(-1)?.date ?? END_DATE;
  const remainingPlanDays = dayPlans.filter((plan) => plan.date >= today).length;
  const defaultQuestionGoals = state.planSettings.defaultQuestionGoals;
  const activeDefaultQuestionGoal = activeStudySession?.subjectKey
    ? defaultQuestionGoals[activeStudySession.subjectKey]
    : 30;
  const pendingStudyDecisions = useMemo(
    () => buildPendingStudyDecisions(dayPlans, state.calendarEventProgress, today, defaultQuestionGoals),
    [dayPlans, defaultQuestionGoals, state.calendarEventProgress, today],
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

  const handlePendingQuestionsChange = (eventId: string, questionsDone: number): void => {
    setPendingQuestionsByEventId((current) => ({
      ...current,
      [eventId]: clampStudyNumber(questionsDone),
    }));
  };

  const handleCompletePendingDecision = (decision: (typeof pendingStudyDecisions)[number]): void => {
    const questionsDone = pendingQuestionsByEventId[decision.eventId] ?? 0;
    completeCalendarEvent(decision.eventId, decision.topicIds, questionsDone);
  };

  const handleReviewTopic = (topicId: string): void => {
    const [firstSubmatter] = state.topicSubmattersByTopic[topicId] ?? [];
    if (firstSubmatter) {
      markTopicSubmatterReviewedToday(topicId, firstSubmatter.id);
    }
  };

  const updateActiveStudyProgress = (draft: Partial<StudyProgressDraft>): void => {
    if (!activeStudySession) return;
    setStudyProgressBySession((current) => ({
      ...current,
      [activeStudySession.id]: {
        ...(current[activeStudySession.id] ?? createInitialStudyProgress()),
        ...draft,
      },
    }));
  };

  const handleStartStudySession = (session: StudySession): void => {
    if (!session.topicId) return;
    setActiveStudySession(session);
    setStudyProgressBySession((current) => ({
      ...current,
      [session.id]: current[session.id] ?? createInitialStudyProgress(
        session.subjectKey ? defaultQuestionGoals[session.subjectKey] : activeDefaultQuestionGoal,
      ),
    }));
    setMappedTopicId(session.topicId);
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
    setCalendarMonth(state.selectedDate.slice(0, 7));
    setSelectedCalendarDate(state.selectedDate);
    setIsCalendarEventListOpen(true);
    setExpandedCalendarEventId(null);
  };

  const renderRestDayPlanner = (date: string, note: string) => (
    <label className="clean-rest-planner">
      <span>Matéria ou revisão futura</span>
      <textarea
        value={note}
        onChange={(event) => setDailyNote(date, event.target.value)}
        placeholder="Ex.: revisar Português na próxima semana, separar questões de RLM..."
        rows={4}
      />
      <small>Use este espaço para reservar uma matéria leve ou uma revisão futura sem tirar o dia do descanso fixo.</small>
    </label>
  );

  return (
    <section className="clean-module-page" data-testid="clean-concurso-module">
      <header className="clean-hero">
        <div className={activeStudySession ? 'clean-study-focus is-visible' : 'clean-study-focus'}>
          {activeStudySession ? (
            <>
              <div className="clean-study-focus-head">
                <span className="clean-kicker">
                  <Play size={16} />
                  Estudando agora
                </span>
                <span className="clean-study-subject">{activeStudySession.subject}</span>
              </div>
              <h1>{activeStudySession.title}</h1>
              <p>{activeStudySession.detail}</p>
              <div className="clean-study-controls">
                <label>
                  <span>Meta do dia</span>
                  <input
                    type="number"
                    min="0"
                    value={activeStudyProgress.questionGoal}
                    onChange={(event) =>
                      updateActiveStudyProgress({ questionGoal: clampStudyNumber(event.target.valueAsNumber) })
                    }
                  />
                </label>
                <label>
                  <span>Questões feitas</span>
                  <input
                    type="number"
                    min="0"
                    value={activeStudyProgress.questionsDone}
                    onChange={(event) =>
                      updateActiveStudyProgress({ questionsDone: clampStudyNumber(event.target.valueAsNumber) })
                    }
                  />
                </label>
                <button
                  type="button"
                  className={activeStudyProgress.hasCards ? 'clean-study-toggle active' : 'clean-study-toggle'}
                  onClick={() => updateActiveStudyProgress({ hasCards: !activeStudyProgress.hasCards })}
                >
                  <CheckSquare2 size={15} />
                  Cards
                </button>
                <button
                  type="button"
                  className={activeStudyProgress.hasClasses ? 'clean-study-toggle active' : 'clean-study-toggle'}
                  onClick={() => updateActiveStudyProgress({ hasClasses: !activeStudyProgress.hasClasses })}
                >
                  <BookOpen size={15} />
                  Aulas
                </button>
                <button
                  type="button"
                  className={activeStudyProgress.isComplete ? 'clean-study-complete active' : 'clean-study-complete'}
                  onClick={() => updateActiveStudyProgress({ isComplete: !activeStudyProgress.isComplete })}
                >
                  <CheckCircle2 size={15} />
                  Estudo completo
                </button>
              </div>
            </>
          ) : (
            <div className="clean-study-placeholder">
              <span className="clean-kicker">
                <Trophy size={16} />
                Escolha a matéria
              </span>
              <h1>Clique em Estudar para abrir o painel do bloco.</h1>
              <p>A matéria aparece aqui com meta, questões feitas, cards, aulas e conclusão do estudo.</p>
            </div>
          )}
        </div>
        <div className="clean-hero-panel">
          <span>Progresso do dia</span>
          <strong>{questionProgress}%</strong>
          <div className="clean-meter">
            <div style={{ width: `${questionProgress}%` }} />
          </div>
          <small>
            {activeStudyProgress.questionsDone}/{activeStudyProgress.questionGoal} questões
          </small>
        </div>
      </header>

      <nav className="clean-tabs" aria-label="Visões do novo módulo">
        {[
          { key: 'dia', label: 'Dia', icon: Play },
          { key: 'conteudo', label: 'Conteúdo', icon: BookOpen },
          { key: 'calendario', label: 'Calendário', icon: CalendarDays },
          { key: 'configuracoes', label: 'Configurações', icon: Settings },
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

            <section className="clean-pending-panel" aria-label="Pendências para fechar">
              <div className="clean-pending-head">
                <div>
                  <span className="clean-kicker">
                    <ClipboardCheck size={16} />
                    Pendências para fechar
                  </span>
                  <h3>{pendingStudyDecisions.length} matéria(s) aguardando decisão</h3>
                </div>
                <small>Marque o que foi feito ou realoque só quando realmente falhou.</small>
              </div>
              {pendingStudyDecisions.length > 0 ? (
                <div className="clean-pending-list">
                  {pendingStudyDecisions.map((decision) => (
                    <article className="clean-pending-card" key={decision.id}>
                      <div className="clean-pending-card-main">
                        <span>{formatIsoDateCompactPtBr(decision.date)} | {decision.subjectLabel}</span>
                        <strong>{decision.title}</strong>
                        <p>{decision.detail}</p>
                        {decision.failureDate ? (
                          <small>Se falhar, volta em {formatIsoDateCompactPtBr(decision.failureDate)}.</small>
                        ) : null}
                      </div>
                      <div className="clean-pending-actions">
                        <label>
                          <span>Questões feitas</span>
                          <input
                            type="number"
                            min="0"
                            value={pendingQuestionsByEventId[decision.eventId] ?? 0}
                            onChange={(event) =>
                              handlePendingQuestionsChange(decision.eventId, event.target.valueAsNumber)
                            }
                            aria-label={`Questões feitas em ${decision.title}`}
                          />
                          <small>Meta: {decision.questionGoal}</small>
                        </label>
                        <button
                          type="button"
                          className="clean-icon-link"
                          onClick={() => handleCompletePendingDecision(decision)}
                        >
                          <CheckCircle2 size={15} />
                          Marcar feito
                        </button>
                        <button
                          type="button"
                          className="clean-fail-button"
                          onClick={() => failCalendarManualBlock(decision.date, decision.block)}
                        >
                          <XCircle size={15} />
                          Falhei
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="clean-empty-state">Nenhuma matéria atrasada aguardando decisão.</div>
              )}
            </section>

            {selectedPlan?.isRestDay ? (
              <div className="clean-rest-day-box">
                <div className="clean-empty-state">Esse dia está reservado para descanso fixo.</div>
                {renderRestDayPlanner(state.selectedDate, state.dailyRecords[state.selectedDate]?.notes ?? '')}
              </div>
            ) : (
              <div className="clean-task-list">
                {selectedBlocks.map((block) => {
                  const nextDate = findNextFailurePlanDate(dayPlans, state.selectedDate, block);
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
                            onClick={() =>
                              handleStartStudySession({
                                id: `day-${state.selectedDate}-${block.id}`,
                                title: block.title,
                                detail: block.detail,
                                subject: getManualBlockSubjectLabel(block),
                                subjectKey: inferManualBlockSubject(block),
                                topicId: block.contentTargets?.[0]?.topicId ?? '',
                              })
                            }
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
                        <button
                          type="button"
                          className="clean-icon-link"
                          onClick={() =>
                            handleStartStudySession({
                              id: `content-${item.id}`,
                              title: item.block.title,
                              detail: item.block.detail,
                              subject: getManualBlockSubjectLabel(item.block),
                              subjectKey: item.subject,
                              topicId: firstTopicId,
                            })
                          }
                        >
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
        <section className="clean-panel clean-calendar-panel">
          <div className="clean-panel-head clean-calendar-head">
            <div>
              <span className="clean-kicker">Calendário real</span>
              <h2>{getMonthLabelPtBr(calendarMonth)}</h2>
            </div>
            <span className="clean-count">{dashboardStats.calendarEvents} eventos</span>
          </div>

          <div className="clean-calendar-toolbar">
            <button type="button" onClick={() => setCalendarMonth((current) => shiftMonth(current, -1))}>
              <ChevronLeft size={16} />
              Mês anterior
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(today.slice(0, 7));
                setSelectedCalendarDate(today);
                setSelectedDate(today);
                setExpandedCalendarEventId(null);
              }}
            >
              <CalendarDays size={16} />
              Hoje
            </button>
            <button type="button" onClick={() => setCalendarMonth((current) => shiftMonth(current, 1))}>
              Próximo mês
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="clean-month-grid" role="grid" aria-label="Calendário de estudos">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((weekday) => (
              <span className="clean-weekday" key={weekday}>
                {weekday}
              </span>
            ))}
            {calendarMonthDays.map((day) => {
              const studyCount = day.events.filter((event) => event.tone === 'study').length;
              const reviewCount = day.events.filter((event) => event.tone === 'review').length;
              const failedCount = day.events.filter((event) => event.status === 'failed').length;
              const isSelected = day.date === selectedCalendarDate;
              const isToday = day.date === today;

              return (
                <button
                  type="button"
                  key={day.date}
                  className={[
                    'clean-calendar-day',
                    day.isCurrentMonth ? '' : 'outside',
                    isSelected ? 'selected' : '',
                    isToday ? 'today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    setSelectedCalendarDate(day.date);
                    setSelectedDate(day.date);
                    setExpandedCalendarEventId(null);
                  }}
                >
                  <span className="clean-calendar-day-number">{day.dayNumber}</span>
                  {day.events.length > 0 ? (
                    <span className="clean-calendar-day-summary">
                      {day.events.length} evento{day.events.length === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="clean-calendar-day-summary muted">Livre</span>
                  )}
                  <span className="clean-calendar-dots" aria-hidden="true">
                    {studyCount > 0 ? <i className="tone-study" /> : null}
                    {reviewCount > 0 ? <i className="tone-review" /> : null}
                    {failedCount > 0 ? <i className="tone-failed" /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="clean-calendar-selected">
            <div>
              <span className="clean-kicker">Dia selecionado</span>
              <h3>{formatIsoDatePtBr(selectedCalendarDate)}</h3>
              <p>
                {selectedCalendarEvents.length} evento{selectedCalendarEvents.length === 1 ? '' : 's'} no dia
                {selectedDoneEvents ? ` | ${selectedDoneEvents} feito(s)` : ''}
                {selectedFailedEvents ? ` | ${selectedFailedEvents} falhou/falharam` : ''}
              </p>
            </div>
            <button
              type="button"
              className="clean-calendar-manage"
              onClick={() => setIsCalendarEventListOpen((current) => !current)}
              aria-expanded={isCalendarEventListOpen}
            >
              <ListChecks size={16} />
              Ver eventos
            </button>
          </div>

          {isCalendarEventListOpen ? (
            <div className="clean-calendar-list">
              {selectedCalendarEvents.map((event) => {
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
                            {event.kind === 'rest' ? renderRestDayPlanner(event.date, selectedCalendarNote) : null}
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
              {selectedCalendarEvents.length === 0 ? (
                <div className="clean-empty-state">Nenhum estudo ou revisão programado para este dia.</div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeView === 'configuracoes' ? (
        <section className="clean-panel clean-settings-panel">
          <div className="clean-panel-head">
            <div>
              <span className="clean-kicker">Configurações</span>
              <h2>Ajustes do plano</h2>
            </div>
            <Settings size={20} />
          </div>

          <div className="clean-settings-grid">
            <label className="clean-settings-field">
              <span>Início do plano de estudos</span>
              <input
                type="date"
                min={START_DATE}
                max={END_DATE}
                value={planStartDate}
                onChange={(event) => {
                  setPlanStartDate(event.target.value);
                  setSelectedDate(event.target.value);
                  setCalendarMonth(event.target.value.slice(0, 7));
                  setSelectedCalendarDate(event.target.value);
                }}
              />
              <small>Alterar esta data reorganiza o cronograma determinístico do módulo.</small>
            </label>

            <label className="clean-settings-field">
              <span>Dia de descanso</span>
              <select
                value={state.planSettings.restWeekday}
                onChange={(event) => setRestWeekday(Number(event.target.value))}
              >
                {weekdayOptions.map((weekday) => (
                  <option value={weekday.value} key={weekday.value}>
                    {weekday.label}
                  </option>
                ))}
              </select>
              <small>O calendário, a fila diária e os eventos de descanso passam a usar este dia.</small>
            </label>

            <div className="clean-settings-field clean-question-goals">
              <span>Meta padrão de questões por matéria</span>
              <div className="clean-question-goal-list">
                {SUBJECT_ORDER.map((subject) => (
                  <label key={subject}>
                    <strong>{subjectLabel(subject)}</strong>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={defaultQuestionGoals[subject]}
                      onChange={(event) =>
                        setDefaultQuestionGoal(subject, clampStudyNumber(event.target.valueAsNumber))
                      }
                    />
                  </label>
                ))}
              </div>
              <small>Ao clicar em Estudar, uma nova sessão já abre com a meta da matéria.</small>
            </div>

            <div className="clean-settings-summary" aria-label="Resumo das configurações do plano">
              <article>
                <span>Data final</span>
                <strong>{formatIsoDateCompactPtBr(planEndDate)}</strong>
              </article>
              <article>
                <span>Dias restantes</span>
                <strong>{remainingPlanDays}</strong>
              </article>
              <article>
                <span>Eventos no calendário</span>
                <strong>{dashboardStats.calendarEvents}</strong>
              </article>
              <article>
                <span>Alterações de início</span>
                <strong>{state.planSettings.startDateChangeCount}</strong>
              </article>
            </div>
          </div>
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
