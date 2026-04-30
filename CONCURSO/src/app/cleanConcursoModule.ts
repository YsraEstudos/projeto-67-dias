import { END_DATE } from './constants';
import { enumerateDateRange, getLocalTodayIsoDate, parseIsoDate, toIsoDate } from './dateUtils';
import { subjectLabel } from './formatters';
import { getManualBlockSubjectLabel, inferManualBlockSubject } from './manualBlockSubjects';
import type { DayPlan, ManualBlock, SubjectKey, TopicGrade, TopicNode, TopicSubmatter } from './types';

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

export const buildCleanCalendarEvents = (
  plans: DayPlan[],
  topicSubmattersByTopic: Record<string, TopicSubmatter[]>,
  topics: TopicNode[],
  startDate: string = plans[0]?.date ?? getLocalTodayIsoDate(),
): CleanCalendarEvent[] => {
  const lastPlanDate = plans[plans.length - 1]?.date ?? END_DATE;
  const dateRange = enumerateDateRange(startDate, lastPlanDate).filter((date) => date <= END_DATE);
  const planByDate = new Map(plans.map((plan) => [plan.date, plan]));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));

  return dateRange.flatMap((date) => {
    const plan = planByDate.get(date);
    const events: CleanCalendarEvent[] = [];

    if (plan?.isRestDay) {
      events.push({
        id: `${date}-rest`,
        date,
        title: 'Descanso fixo',
        subtitle: 'Sem pendência obrigatória',
        tone: 'rest',
      });
      return events;
    }

    (plan?.manualBlocks ?? []).filter(isStudyPlanBlock).forEach((block) => {
      events.push({
        id: `${date}-${block.id}`,
        date,
        title: block.title,
        subtitle: getManualBlockSubjectLabel(block),
        tone: 'study',
      });
    });

    if (plan?.hasSimulado) {
      events.push({
        id: `${date}-simulado`,
        date,
        title: 'Simulado programado',
        subtitle: 'Evento do cronograma',
        tone: 'exam',
      });
    }

    if (plan?.hasRedacao) {
      events.push({
        id: `${date}-redacao`,
        date,
        title: 'Redação programada',
        subtitle: 'Evento do cronograma',
        tone: 'writing',
      });
    }

    const reviews = Object.entries(topicSubmattersByTopic).flatMap(([topicId, submatters]) => {
      const topic = topicById.get(topicId);
      if (!topic) return [];

      return submatters
        .filter((submatter) => buildReviewSchedule(submatter, startDate).some((item) => item.date === date))
        .map((submatter) => ({
          topic,
          submatter,
        }));
    });

    reviews.forEach(({ topic, submatter }) => {
      events.push({
        id: `${date}-${submatter.id}-review`,
        date,
        title: `Revisar: ${submatter.title}`,
        subtitle: `${subjectLabel(topic.subject)} | Nota ${submatter.grade}`,
        tone: 'review',
      });
    });

    return events;
  });
};
