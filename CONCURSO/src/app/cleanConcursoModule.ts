import { END_DATE } from './constants';
import { enumerateDateRange, getLocalTodayIsoDate, parseIsoDate, toIsoDate } from './dateUtils';
import { subjectLabel } from './formatters';
import { getManualBlockSubjectLabel, inferManualBlockSubject } from './manualBlockSubjects';
import type {
  AppState,
  CalendarEventStatus,
  DayPlan,
  ManualBlock,
  ManualBlockReschedule,
  SubjectKey,
  TopicGrade,
  TopicNode,
  TopicSubmatter,
} from './types';

export { getManualBlockSubjectLabel, inferManualBlockSubject };

export type CleanDayShortcutKey = 'today' | 'tomorrow' | 'afterTomorrow';

export interface CleanDayShortcut {
  key: CleanDayShortcutKey;
  label: string;
  date: string;
}

export interface CleanCalendarEvent {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  tone: 'study' | 'review' | 'exam' | 'writing' | 'rest' | 'failed';
  kind: 'study' | 'review' | 'exam' | 'writing' | 'rest' | 'failed';
  status: CalendarEventStatus;
  blockId: string | null;
  block: ManualBlock | null;
  topicIds: string[];
  submatterId: string | null;
}

export interface CleanReviewScheduleItem {
  date: string;
  label: string;
}

export interface CleanPlanContentItem {
  id: string;
  date: string;
  weekNumber: number | null;
  block: ManualBlock;
  subject: SubjectKey | null;
  topicIds: string[];
}

export interface CleanPendingStudyDecision {
  id: string;
  eventId: string;
  date: string;
  title: string;
  detail: string;
  subject: SubjectKey | null;
  subjectLabel: string;
  questionGoal: number;
  failureDate: string | null;
  block: ManualBlock;
  topicIds: string[];
}

const REVIEW_INTERVALS_BY_GRADE: Record<TopicGrade, number[]> = {
  A: [30, 60, 90],
  B: [15, 30, 60],
  C: [7, 15, 30],
  D: [3, 7, 15],
  E: [1, 3, 7],
};

const addDays = (isoDate: string, days: number): string => {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
};

export const buildCleanDayShortcuts = (
  today: string = getLocalTodayIsoDate(),
): CleanDayShortcut[] => [
  { key: 'today', label: 'Hoje', date: today },
  { key: 'tomorrow', label: 'Amanhã', date: addDays(today, 1) },
  { key: 'afterTomorrow', label: 'Depois de amanhã', date: addDays(today, 2) },
];

const hasOfficialContentTarget = (block: ManualBlock): boolean =>
  (block.contentTargets?.length ?? 0) > 0;

const isStudyPlanBlock = (block: ManualBlock): boolean =>
  hasOfficialContentTarget(block) || inferManualBlockSubject(block) !== null;

const getBlockTopicIds = (block: ManualBlock): string[] =>
  Array.from(new Set((block.contentTargets ?? []).map((target) => target.topicId)));

const getProgressStatus = (
  eventProgress: AppState['calendarEventProgress'],
  topicProgress: Record<string, TopicProgress>,
  eventId: string,
  topicIds: string[],
  fallback: CalendarEventStatus = 'pending',
): CalendarEventStatus => {
  const event = eventProgress[eventId];
  if (event) {
    return event.status;
  }
  
  if (topicIds.length > 0) {
    const allStudied = topicIds.every((tid) => {
      const p = topicProgress[tid];
      return p && p.status !== 'nao_iniciado' && p.status !== 'pendente';
    });
    if (allStudied) {
      return 'done';
    }
  }

  return fallback;
};

const groupReviewsByDate = (
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>,
  topics: TopicNode[],
  referenceDate: string,
): Map<string, Array<{ topic: TopicNode; submatter: TopicSubmatter }>> => {
  const reviewsByDate = new Map<string, Array<{ topic: TopicNode; submatter: TopicSubmatter }>>();
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  Object.entries(topicSubmattersByTopic).forEach(([topicId, submatters]) => {
    const topic = topicById.get(topicId);
    if (!topic) return;

    submatters.forEach((submatter) => {
      if (!submatter.lastReviewedAt) return;

      buildReviewSchedule(submatter, referenceDate).forEach((item) => {
        const current = reviewsByDate.get(item.date) ?? [];
        current.push({ topic, submatter });
        reviewsByDate.set(item.date, current);
      });
    });
  });

  return reviewsByDate;
};

export const buildCleanPlanContentItems = (plans: DayPlan[]): CleanPlanContentItem[] =>
  plans.flatMap((plan) =>
    (plan.manualBlocks ?? [])
      .filter(isStudyPlanBlock)
      .map((block, index) => ({
        id: `${plan.date}-${block.id}-${index}`,
        date: plan.date,
        weekNumber: plan.weekNumber ?? null,
        block,
        subject: inferManualBlockSubject(block),
        topicIds: Array.from(new Set((block.contentTargets ?? []).map((target) => target.topicId))),
      })),
  );

export const buildReviewSchedule = (
  submatter: Pick<TopicSubmatter, 'grade' | 'lastReviewedAt'>,
  referenceDate: string,
): CleanReviewScheduleItem[] => {
  const baseDate = submatter.lastReviewedAt ?? referenceDate;
  return REVIEW_INTERVALS_BY_GRADE[submatter.grade].map((days) => ({
    date: addDays(baseDate, days),
    label: `D+${days}`,
  }));
};

export const findNextSubjectPlanDate = (
  plans: DayPlan[],
  currentDate: string,
  block: ManualBlock,
): string | null => {
  const subject = inferManualBlockSubject(block);
  const currentIndex = plans.findIndex((plan) => plan.date === currentDate);
  if (currentIndex < 0) return null;

  const nextPlan = plans.find((plan, index) => {
    if (index <= currentIndex || plan.isRestDay || plan.planMode !== 'manual') return false;
    if (!subject) return (plan.manualBlocks?.length ?? 0) > 0;
    if (plan.subjects.includes(subject)) return true;
    return (plan.manualBlocks ?? []).some((candidate) => inferManualBlockSubject(candidate) === subject);
  });

  return nextPlan?.date ?? null;
};

const hasManualPlanSubject = (plan: DayPlan, subject: SubjectKey): boolean =>
  plan.subjects.includes(subject)
  || (plan.manualBlocks ?? []).some((candidate) => inferManualBlockSubject(candidate) === subject);

export const findNextFailurePlanDate = (
  plans: DayPlan[],
  currentDate: string,
  block: ManualBlock,
): string | null => {
  const currentIndex = plans.findIndex((plan) => plan.date === currentDate);
  if (currentIndex < 0) return null;

  const subject = inferManualBlockSubject(block);
  if (subject) {
    let checkedManualDays = 0;
    for (let index = currentIndex + 1; index < plans.length && checkedManualDays < 5; index += 1) {
      const plan = plans[index];
      if (plan.planMode !== 'manual' || plan.isRestDay || (plan.manualBlocks?.length ?? 0) === 0) {
        continue;
      }

      checkedManualDays += 1;
      if (!hasManualPlanSubject(plan, subject)) {
        return plan.date;
      }
    }
  }

  const nextPlan = plans.find(
    (plan, index) =>
      index > currentIndex
      && plan.planMode === 'manual'
      && !plan.isRestDay
      && (plan.manualBlocks?.length ?? 0) > 0,
  );
  return nextPlan?.date ?? null;
};

export const buildPendingStudyDecisions = (
  plans: DayPlan[],
  calendarEventProgress: AppState['calendarEventProgress'],
  topicProgress: Record<string, TopicProgress>,
  today: string,
  defaultQuestionGoals: Record<SubjectKey, number>,
): CleanPendingStudyDecision[] =>
  plans
    .filter((plan) => plan.date < today && plan.planMode === 'manual' && !plan.isRestDay)
    .flatMap((plan) =>
      (plan.manualBlocks ?? []).filter(isStudyPlanBlock).flatMap((block) => {
        const eventId = `${plan.date}-${block.id}`;
        const topicIds = getBlockTopicIds(block);
        const status = getProgressStatus(calendarEventProgress, topicProgress, eventId, topicIds);
        
        if (status !== 'pending') {
          return [];
        }

        const subject = inferManualBlockSubject(block);
        return [{
          id: eventId,
          eventId,
          date: plan.date,
          title: block.title,
          detail: block.detail,
          subject,
          subjectLabel: getManualBlockSubjectLabel(block),
          questionGoal: subject ? defaultQuestionGoals[subject] : plan.targets.objectiveQuestions,
          failureDate: findNextFailurePlanDate(plans, plan.date, block),
          block,
          topicIds: getBlockTopicIds(block),
        }];
      }),
    );

export const buildCleanCalendarEvents = (
  plans: DayPlan[],
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>,
  topics: TopicNode[],
  topicProgress: Record<string, TopicProgress>,
  startDate: string = plans[0]?.date ?? getLocalTodayIsoDate(),
  calendarEventProgress: AppState['calendarEventProgress'] = {},
  manualBlockReschedules: ManualBlockReschedule[] = [],
): CleanCalendarEvent[] => {
  const lastPlanDate = plans[plans.length - 1]?.date ?? END_DATE;
  const dateRange = enumerateDateRange(startDate, lastPlanDate).filter((date) => date <= END_DATE);
  const planByDate = new Map(plans.map((plan) => [plan.date, plan]));
  const reviewsByDate = groupReviewsByDate(topicSubmattersByTopic, topics, startDate);
  const failuresByDate = manualBlockReschedules.reduce<Map<string, ManualBlockReschedule[]>>((accumulator, item) => {
    const current = accumulator.get(item.failedAt) ?? [];
    current.push(item);
    accumulator.set(item.failedAt, current);
    return accumulator;
  }, new Map());

  return dateRange.flatMap((date) => {
    const plan = planByDate.get(date);
    const events: CleanCalendarEvent[] = [];

    if (plan?.isRestDay) {
      const eventId = `${date}-rest`;
      events.push({
        id: eventId,
        date,
        title: 'Descanso fixo',
        subtitle: 'Sem pendência obrigatória',
        tone: 'rest',
        kind: 'rest',
        status: getProgressStatus(calendarEventProgress, topicProgress, eventId, []),
        blockId: null,
        block: null,
        topicIds: [],
        submatterId: null,
      });
    } else {
      (plan?.manualBlocks ?? []).filter(isStudyPlanBlock).forEach((block) => {
        const eventId = `${date}-${block.id}`;
        const topicIds = getBlockTopicIds(block);
        events.push({
          id: eventId,
          date,
          title: block.title,
          subtitle: getManualBlockSubjectLabel(block),
          tone: 'study',
          kind: 'study',
          status: getProgressStatus(calendarEventProgress, topicProgress, eventId, topicIds),
          blockId: block.id,
          block,
          topicIds,
          submatterId: null,
        });
      });
    }

    if (plan?.hasSimulado) {
      const eventId = `${date}-simulado`;
      events.push({
        id: eventId,
        date,
        title: 'Simulado programado',
        subtitle: 'Evento do cronograma',
        tone: 'exam',
        kind: 'exam',
        status: getProgressStatus(calendarEventProgress, topicProgress, eventId, []),
        blockId: null,
        block: null,
        topicIds: [],
        submatterId: null,
      });
    }

    if (plan?.hasRedacao) {
      const eventId = `${date}-redacao`;
      events.push({
        id: eventId,
        date,
        title: 'Redação programada',
        subtitle: 'Evento do cronograma',
        tone: 'writing',
        kind: 'writing',
        status: getProgressStatus(calendarEventProgress, topicProgress, eventId, []),
        blockId: null,
        block: null,
        topicIds: [],
        submatterId: null,
      });
    }

    (failuresByDate.get(date) ?? []).forEach((reschedule) => {
      const eventId = `${date}-${reschedule.blockId}`;
      const block = reschedule.block ?? null;
      const topicIds = block ? getBlockTopicIds(block) : [];
      events.push({
        id: `${eventId}-failed`,
        date,
        title: reschedule.title ?? (block?.title ? `${block.area}: ${block.title}` : 'Bloco falhou e foi realocado'),
        subtitle: reschedule.subtitle ?? (block ? getManualBlockSubjectLabel(block) : 'Falha registrada no calendário'),
        tone: 'failed',
        kind: 'failed',
        status: 'failed',
        blockId: reschedule.blockId,
        block,
        topicIds,
        submatterId: null,
      });
    });

    (reviewsByDate.get(date) ?? []).forEach(({ topic, submatter }) => {
      const eventId = `${date}-${submatter.id}-review`;
      events.push({
        id: eventId,
        date,
        title: `Revisar: ${submatter.title}`,
        subtitle: `${subjectLabel(topic.subject)} | Nota ${submatter.grade}`,
        tone: 'review',
        kind: 'review',
        status: getProgressStatus(calendarEventProgress, topicProgress, eventId, []),
        blockId: null,
        block: null,
        topicIds: [topic.id],
        submatterId: submatter.id,
      });
    });

    return events;
  });
};
