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
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useAppActionsContext, useAppPlanContext, useAppStateContext } from '../app/AppContext';
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
  getManualBlockSubjectLabel,
} from '../app/cleanConcursoModule';
import { getLocalTodayIsoDate } from '../app/dateUtils';
import { buildReviewQueue, buildTopicRollups, resolveDailyStudy } from '../app/contentSubmatters';
import { formatIsoDateCompactPtBr, formatIsoDatePtBr, subjectLabel } from '../app/formatters';
import { getTopicDisplayTitle } from '../app/topics';
import type { SubjectKey, TopicGrade } from '../app/types';

type ModuleView = 'dia' | 'conteudo' | 'calendario' | 'configuracoes';
type ContentFilter = 'all' | 'review' | TopicGrade;
type StudySession = {
  id: string;
  eventId: string;
  title: string;
  detail: string;
  subject: string;
  subjectKey: SubjectKey | null;
  topicId: string;
  topicIds: string[];
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
const EMPTY_CALENDAR_EVENTS: ReturnType<typeof buildCleanCalendarEvents> = [];

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

const buildCalendarEventsByDate = <TEvent extends { date: string }>(
  calendarEvents: TEvent[],
): Map<string, TEvent[]> =>
  calendarEvents.reduce<Map<string, TEvent[]>>((accumulator, event) => {
    const dayEvents = accumulator.get(event.date);
    if (dayEvents) {
      dayEvents.push(event);
    } else {
      accumulator.set(event.date, [event]);
    }
    return accumulator;
  }, new Map());

const countCalendarStatuses = (events: Array<{ status: string }>) =>
  events.reduce(
    (accumulator, event) => {
      if (event.status === 'done') {
        accumulator.done += 1;
      } else if (event.status === 'failed') {
        accumulator.failed += 1;
      }
      return accumulator;
    },
    { done: 0, failed: 0 },
  );

const normalizePlanSearch = (query: string): string => query.trim().toLowerCase();

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
  topicsNeedingReviewSet: Set<string>,
): boolean => {
  return topicIds.some((id) => topicsNeedingReviewSet.has(id));
};

const createInitialStudyProgress = (questionGoal = 30): StudyProgressDraft => ({
  questionGoal,
  questionsDone: 0,
  hasCards: false,
  hasClasses: false,
  isComplete: false,
});

const createStudyProgressFromEventProgress = (
  progress: {
    questionGoal?: number;
    questionsDone?: number;
    hasCards?: boolean;
    hasClasses?: boolean;
    isComplete?: boolean;
    status?: string;
  } | undefined,
  questionGoal = 30,
): StudyProgressDraft => ({
  questionGoal: progress?.questionGoal ?? questionGoal,
  questionsDone: progress?.questionsDone ?? 0,
  hasCards: progress?.hasCards ?? false,
  hasClasses: progress?.hasClasses ?? false,
  isComplete: progress?.isComplete ?? progress?.status === 'done',
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

interface RestDayNoteAreaProps {
  date: string;
  initialNote: string;
  onSave: (date: string, value: string) => void;
}

const RestDayNoteArea = ({ date, initialNote, onSave }: RestDayNoteAreaProps) => {
  const [localNote, setLocalNote] = useState(initialNote);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalNote(initialNote);
  }, [date, initialNote]);

  return (
    <textarea
      value={localNote}
      onChange={(event) => setLocalNote(event.target.value)}
      onBlur={() => {
        if (localNote !== initialNote) {
          onSave(date, localNote);
        }
      }}
      placeholder="Ex.: revisar Português na próxima semana, separar questões de RLM..."
      rows={4}
    />
  );
};

export const CleanConcursoPage = () => {
  const { state } = useAppStateContext();
  const { topics, dayPlans, dayPlansByDate } = useAppPlanContext();
  const {
    setSelectedDate,
    completeCalendarEvent,
    failCalendarManualBlock,
    markTopicSubmatterReviewedToday,
    saveCalendarEventDraft,
    setCalendarEventStatus,
    setDailyNote,
    undoCalendarManualBlockFailure,
    unsetCalendarEventDone,
    setPlanStartDate,
    setRestWeekday,
    setDefaultQuestionGoal,
    rateSubmatter,
  } = useAppActionsContext();
  const [activeView, setActiveView] = useState<ModuleView>('dia');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
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
  const dailyStudy = useMemo(
    () => resolveDailyStudy(state, state.selectedDate, topics),
    [state, state.selectedDate, topics],
  );
  const reviewQueue = useMemo(
    () => buildReviewQueue(state.topicSubmattersByTopic, topics, state.selectedDate),
    [state.topicSubmattersByTopic, state.selectedDate, topics],
  );
  const topicsNeedingReview = useMemo(() => {
    const set = new Set<string>();
    for (const item of reviewQueue) {
      if (item.needsReview) {
        set.add(item.topicId);
      }
    }
    return set;
  }, [reviewQueue]);
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
    () =>
      leafTopics.find((topic) => topic.id === mappedTopicId)
      ?? leafTopics.find((topic) => subjectFilter === 'all' || topic.subject === subjectFilter)
      ?? null,
    [leafTopics, mappedTopicId, subjectFilter],
  );
  const mappedSubmatters = mappedTopic ? state.topicSubmattersByTopic[mappedTopic.id] ?? [] : [];
  const calendarEventsByDate = useMemo(
    () => buildCalendarEventsByDate(calendarEvents),
    [calendarEvents],
  );
  const calendarMonthDays = useMemo(
    () => buildCalendarMonthDays(calendarMonth, calendarEventsByDate),
    [calendarEventsByDate, calendarMonth],
  );
  const selectedCalendarEvents = useMemo(
    () => calendarEventsByDate.get(selectedCalendarDate) ?? EMPTY_CALENDAR_EVENTS,
    [calendarEventsByDate, selectedCalendarDate],
  );
  const selectedCalendarNote = state.dailyRecords[selectedCalendarDate]?.notes ?? '';
  const selectedCalendarStatusCounts = useMemo(
    () => countCalendarStatuses(selectedCalendarEvents),
    [selectedCalendarEvents],
  );
  const selectedDoneEvents = selectedCalendarStatusCounts.done;
  const selectedFailedEvents = selectedCalendarStatusCounts.failed;
  const defaultQuestionGoals = state.planSettings.defaultQuestionGoals;
  const activeStudyProgress = activeStudySession
    ? studyProgressBySession[activeStudySession.id]
      ?? createStudyProgressFromEventProgress(
        state.calendarEventProgress[activeStudySession.eventId],
        activeStudySession.subjectKey ? defaultQuestionGoals[activeStudySession.subjectKey] : 30,
      )
    : createInitialStudyProgress();
  const questionProgress =
    activeStudyProgress.questionGoal > 0
      ? Math.min(100, Math.round((activeStudyProgress.questionsDone / activeStudyProgress.questionGoal) * 100))
      : 0;
  const planStartDate = state.planSettings.startDate;
  const planEndDate = dayPlans.at(-1)?.date ?? END_DATE;
  const remainingPlanDays = dayPlans.filter((plan) => plan.date >= today).length;
  const activeDefaultQuestionGoal = activeStudySession?.subjectKey
    ? defaultQuestionGoals[activeStudySession.subjectKey]
    : 30;
  const pendingStudyDecisions = useMemo(
    () => buildPendingStudyDecisions(dayPlans, state.calendarEventProgress, today, defaultQuestionGoals),
    [dayPlans, defaultQuestionGoals, state.calendarEventProgress, today],
  );
  const normalizedDeferredSearch = useMemo(() => normalizePlanSearch(deferredSearch), [deferredSearch]);

  const filteredPlanItems = useMemo(() => {
    return planContentItems.filter((item) => {
      if (subjectFilter !== 'all' && item.subject !== subjectFilter) return false;

      const currentGrade = pickPlanItemGrade(item.topicIds, rollups);

      if (contentFilter !== 'all' && contentFilter !== 'review' && currentGrade !== contentFilter) {
        return false;
      }

      if (contentFilter === 'review' && !hasPlanItemReviewNow(item.topicIds, topicsNeedingReview)) {
        return false;
      }

      if (!normalizedDeferredSearch) return true;
      return [
        item.block.title,
        item.block.detail,
        item.block.area,
        getManualBlockSubjectLabel(item.block),
        ...(item.block.contentTargets ?? []).map((target) => `${target.title} ${target.sectionTitle}`),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedDeferredSearch);
    });
  }, [contentFilter, normalizedDeferredSearch, planContentItems, topicsNeedingReview, rollups, subjectFilter]);

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

  const handleCompleteCalendarEvent = (event: (typeof calendarEvents)[number]): void => {
    const progress = state.calendarEventProgress[event.id];
    const questionsDone = pendingQuestionsByEventId[event.id] ?? progress?.questionsDone ?? 0;
    completeCalendarEvent(event.id, event.topicIds, questionsDone);
  };

  const handleReviewTopic = (topicId: string): void => {
    const [firstSubmatter] = state.topicSubmattersByTopic[topicId] ?? [];
    if (firstSubmatter) {
      markTopicSubmatterReviewedToday(topicId, firstSubmatter.id);
    }
  };

  const updateActiveStudyProgress = (draft: Partial<StudyProgressDraft>): void => {
    if (!activeStudySession) return;
    const nextDraft = {
      ...activeStudyProgress,
      ...draft,
    };
    saveCalendarEventDraft(activeStudySession.eventId, nextDraft);
    if (nextDraft.isComplete) {
      completeCalendarEvent(activeStudySession.eventId, activeStudySession.topicIds, nextDraft.questionsDone);
    } else if (state.calendarEventProgress[activeStudySession.eventId]?.status === 'done') {
      unsetCalendarEventDone(activeStudySession.eventId, activeStudySession.topicIds);
    }
    setStudyProgressBySession((current) => ({
      ...current,
      [activeStudySession.id]: nextDraft,
    }));
  };

  const handleStartStudySession = (session: StudySession): void => {
    if (!session.topicId) return;
    setActiveStudySession(session);
    setStudyProgressBySession((current) => ({
      ...current,
      [session.id]: current[session.id] ?? createStudyProgressFromEventProgress(
        state.calendarEventProgress[session.eventId],
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
      <RestDayNoteArea
        date={date}
        initialNote={note}
        onSave={setDailyNote}
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
          <strong>{dashboardStats.totalTopics}</strong>
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
                {(() => {
                  const cards = [];

                  if (dailyStudy.newMatter) {
                    const item = dailyStudy.newMatter;
                    const isNew = !dailyStudy.isAllRepeated;
                    const submatter = item.submatter;

                    cards.push(
                      <article className="clean-task-card" key="slot-new-matter" data-testid="srs-slot-1">
                        <div>
                          <div className="clean-task-area-row">
                            <span className="clean-task-area">
                              {isNew ? "Estudo: Matéria Nova" : "Revisão SRS 1"}
                            </span>
                            <span className="clean-task-area" style={{ opacity: 0.7 }}>
                              {subjectLabel(item.topic.subject)}
                            </span>
                          </div>
                          <h3>{item.topic.title}</h3>
                          <p>{submatter.title}</p>
                          <small>
                            {isNew ? "Estudo inicial do tópico" : `Nota ${submatter.grade} | Repetições: ${submatter.srsRepetitions ?? 0}`}
                          </small>
                        </div>
                        <div className="clean-task-actions" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                          <button
                            type="button"
                            className="clean-icon-link"
                            style={{ alignSelf: 'flex-start', margin: 0 }}
                            onClick={() =>
                              handleStartStudySession({
                                id: `day-${state.selectedDate}-srs-new`,
                                eventId: 'new-matter-study',
                                title: submatter.title,
                                detail: item.topic.title,
                                subject: subjectLabel(item.topic.subject),
                                subjectKey: item.topic.subject,
                                topicId: item.topic.id,
                                topicIds: [item.topic.id],
                              })
                            }
                          >
                            <Play size={15} />
                            Estudar
                          </button>

                          <div className="clean-srs-rating-container">
                            <span className="clean-srs-rating-label">
                              Como foi seu desempenho?
                              {submatter.srsNextReview && (
                                <span className="clean-srs-feedback-badge">
                                  Intervalo atual: {submatter.srsInterval ?? 0}d
                                </span>
                              )}
                            </span>
                            <div className="clean-srs-buttons-row">
                              <button type="button" className="clean-btn-srs clean-btn-srs-bad" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'bad', state.selectedDate, isNew)}>Errei</button>
                              <button type="button" className="clean-btn-srs clean-btn-srs-hard" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'hard', state.selectedDate, isNew)}>Difícil</button>
                              <button type="button" className="clean-btn-srs clean-btn-srs-good" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'good', state.selectedDate, isNew)}>Bom</button>
                              <button type="button" className="clean-btn-srs clean-btn-srs-easy" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'easy', state.selectedDate, isNew)}>Fácil</button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  if (dailyStudy.reviewMatter) {
                    const item = dailyStudy.reviewMatter;
                    const isNew = false;
                    const submatter = item.submatter;

                    cards.push(
                      <article className="clean-task-card" key="slot-review-matter" data-testid="srs-slot-2">
                        <div>
                          <div className="clean-task-area-row">
                            <span className="clean-task-area">
                              {dailyStudy.isAllRepeated ? "Revisão SRS 2" : "Revisão SRS (Matéria Anterior)"}
                            </span>
                            <span className="clean-task-area" style={{ opacity: 0.7 }}>
                              {subjectLabel(item.topic.subject)}
                            </span>
                          </div>
                          <h3>{item.topic.title}</h3>
                          <p>{submatter.title}</p>
                          <small>
                            Nota {submatter.grade} | Repetições: {submatter.srsRepetitions ?? 0} | Intervalo: {submatter.srsInterval ?? 0}d
                          </small>
                        </div>
                        <div className="clean-task-actions" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                          <button
                            type="button"
                            className="clean-icon-link"
                            style={{ alignSelf: 'flex-start', margin: 0 }}
                            onClick={() =>
                              handleStartStudySession({
                                id: `day-${state.selectedDate}-srs-review`,
                                eventId: 'review-matter-study',
                                title: submatter.title,
                                detail: item.topic.title,
                                subject: subjectLabel(item.topic.subject),
                                subjectKey: item.topic.subject,
                                topicId: item.topic.id,
                                topicIds: [item.topic.id],
                              })
                            }
                          >
                            <Play size={15} />
                            Estudar
                          </button>

                          <div className="clean-srs-rating-container">
                            <span className="clean-srs-rating-label">
                              Como foi seu desempenho?
                              {submatter.srsNextReview && (
                                <span className="clean-srs-feedback-badge">
                                  {submatter.srsNextReview <= state.selectedDate ? "Venceu hoje" : `Próxima: ${formatIsoDateCompactPtBr(submatter.srsNextReview)}`}
                                </span>
                              )}
                            </span>
                            <div className="clean-srs-buttons-row">
                              <button type="button" className="clean-btn-srs clean-btn-srs-bad" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'bad', state.selectedDate, isNew)}>Errei</button>
                              <button type="button" className="clean-btn-srs clean-btn-srs-hard" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'hard', state.selectedDate, isNew)}>Difícil</button>
                              <button type="button" className="clean-btn-srs clean-btn-srs-good" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'good', state.selectedDate, isNew)}>Bom</button>
                              <button type="button" className="clean-btn-srs clean-btn-srs-easy" onClick={() => rateSubmatter(item.topic.id, submatter.id, 'easy', state.selectedDate, isNew)}>Fácil</button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  } else if (!dailyStudy.isAllRepeated) {
                    cards.push(
                      <article className="clean-task-card" key="slot-review-empty">
                        <div>
                          <div className="clean-task-area-row">
                            <span className="clean-task-area">Revisão SRS</span>
                          </div>
                          <h3>Sem revisões pendentes</h3>
                          <p>Você ainda não estudou nenhuma matéria para iniciar a curva de repetição. Continue completando novas matérias!</p>
                        </div>
                      </article>
                    );
                  }

                  return cards;
                })()}
              </div>
            )}
          </section>
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
                              eventId: `${item.date}-${item.block.id}`,
                              title: item.block.title,
                              detail: item.block.detail,
                              subject: getManualBlockSubjectLabel(item.block),
                              subjectKey: item.subject,
                              topicId: firstTopicId,
                              topicIds: item.topicIds,
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
                        <label className="clean-calendar-questions">
                          <span>Questões</span>
                          <input
                            type="number"
                            min="0"
                            value={
                              pendingQuestionsByEventId[event.id]
                              ?? state.calendarEventProgress[event.id]?.questionsDone
                              ?? 0
                            }
                            onChange={(inputEvent) =>
                              handlePendingQuestionsChange(event.id, inputEvent.target.valueAsNumber)
                            }
                            aria-label={`Questões feitas em ${event.title}`}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleCompleteCalendarEvent(event)}
                          disabled={event.status === 'done'}
                        >
                          <CheckCircle2 size={15} />
                          Feito
                        </button>
                        <button
                          type="button"
                          onClick={() => unsetCalendarEventDone(event.id, event.topicIds)}
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
