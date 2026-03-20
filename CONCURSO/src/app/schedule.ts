import {
  END_DATE,
  MONTHLY_TARGETS,
  START_DATE,
  SUBJECT_ORDER,
  WORK_ACTIVITY_ROTATION,
} from './constants';
import { enumerateDateRange, getWeekday, isSunday, monthKeyOf } from './dateUtils';
import type { DayPlan, DayTargets, ExamWritingMonthlyTarget, SubjectKey } from './types';
import {
  buildManualDayOverrides,
  MANUAL_PLAN_START_DATE,
} from '../data/manualDailyPlan';

interface EventDistribution {
  simuladoDates: Set<string>;
  redacaoDates: Set<string>;
}

const selectEvenly = (dates: string[], count: number): string[] => {
  if (count <= 0 || dates.length === 0) {
    return [];
  }

  if (count >= dates.length) {
    return [...dates];
  }

  const picks = new Set<string>();
  const step = dates.length / count;

  for (let index = 0; index < count; index += 1) {
    const pickedIndex = Math.min(dates.length - 1, Math.floor(index * step + step / 2));
    picks.add(dates[pickedIndex]);
  }

  if (picks.size < count) {
    for (const date of dates) {
      picks.add(date);
      if (picks.size === count) {
        break;
      }
    }
  }

  return [...picks].sort();
};

const buildEventDistribution = (activeDates: string[]): EventDistribution => {
  const simuladoDates = new Set<string>();
  const redacaoDates = new Set<string>();

  for (const monthlyTarget of MONTHLY_TARGETS) {
    const monthDates = activeDates.filter((date) => date.startsWith(monthlyTarget.monthKey));

    const simuladoCandidates = [
      ...monthDates.filter((date) => getWeekday(date) === 6),
      ...monthDates.filter((date) => getWeekday(date) !== 6),
    ];

    for (const selectedDate of selectEvenly(simuladoCandidates, monthlyTarget.simulados)) {
      simuladoDates.add(selectedDate);
    }

    const redacaoPriorities = [2, 4, 1, 3, 5, 6];
    const redacaoCandidates: string[] = [];

    for (const weekday of redacaoPriorities) {
      const prioritized = monthDates.filter(
        (date) => getWeekday(date) === weekday && !simuladoDates.has(date),
      );
      redacaoCandidates.push(...prioritized);
    }

    for (const selectedDate of selectEvenly(redacaoCandidates, monthlyTarget.redacoes)) {
      redacaoDates.add(selectedDate);
    }
  }

  return { simuladoDates, redacaoDates };
};

const pickBalancedSubjects = (
  counters: Record<SubjectKey, number>,
  activeDayIndex: number,
): [SubjectKey, SubjectKey] => {
  const expectedPerSubject = ((activeDayIndex + 1) * 2) / SUBJECT_ORDER.length;
  const behindThreshold = expectedPerSubject * 0.9;

  const sortedByGap = [...SUBJECT_ORDER].sort((left, right) => {
    const diff = counters[left] - counters[right];
    return diff !== 0 ? diff : left.localeCompare(right);
  });

  const behindSubjects = sortedByGap.filter((subject) => counters[subject] < behindThreshold);

  if (behindSubjects.length >= 2) {
    return [behindSubjects[0], behindSubjects[1]];
  }

  return [sortedByGap[0], sortedByGap[1]];
};

const buildTargets = (isRestDay: boolean, hasSimulado: boolean, hasRedacao: boolean): DayTargets => {
  if (isRestDay) {
    return {
      mainStudyMinutes: 0,
      ankiMainMinutes: 0,
      workAnkiMinutes: 0,
      workActivityMinutes: 0,
      objectiveQuestions: 0,
    };
  }

  const objectiveQuestions = hasSimulado ? 0 : hasRedacao ? 20 : 50;

  return {
    mainStudyMinutes: 180,
    ankiMainMinutes: 60,
    workAnkiMinutes: 60,
    workActivityMinutes: 60,
    objectiveQuestions,
  };
};

const buildAutomaticDayPlans = (planStartDate: string = START_DATE): DayPlan[] => {
  const allDates = enumerateDateRange(planStartDate, END_DATE);
  const activeDates = allDates.filter((date) => !isSunday(date));
  const { simuladoDates, redacaoDates } = buildEventDistribution(activeDates);

  const subjectCounters: Record<SubjectKey, number> = {
    portugues: 0,
    rlm: 0,
    legislacao: 0,
    especificos: 0,
  };

  let activeDayIndex = 0;

  return allDates.map((date): DayPlan => {
    const rest = isSunday(date);
    const hasSimulado = simuladoDates.has(date);
    const hasRedacao = redacaoDates.has(date);

    let subjects: [SubjectKey, SubjectKey] = ['portugues', 'rlm'];
    let workActivity = WORK_ACTIVITY_ROTATION[0];

    if (!rest) {
      subjects = pickBalancedSubjects(subjectCounters, activeDayIndex);
      subjectCounters[subjects[0]] += 1;
      subjectCounters[subjects[1]] += 1;
      workActivity = WORK_ACTIVITY_ROTATION[activeDayIndex % WORK_ACTIVITY_ROTATION.length];
      activeDayIndex += 1;
    }

    return {
      date,
      planMode: 'auto',
      isRestDay: rest,
      subjects,
      workActivity,
      hasSimulado,
      hasRedacao,
      targets: buildTargets(rest, hasSimulado, hasRedacao),
      monthKey: monthKeyOf(date),
    };
  });
};

const buildManualTargets = (objectiveQuestions: number): DayTargets => ({
  mainStudyMinutes: 180,
  ankiMainMinutes: 60,
  workAnkiMinutes: 60,
  workActivityMinutes: 60,
  objectiveQuestions,
});

const applyManualOverrides = (
  automaticPlans: DayPlan[],
  planStartDate: string = START_DATE,
): DayPlan[] => {
  const manualOverrides = buildManualDayOverrides(planStartDate);

  return automaticPlans.map((plan) => {
    if (plan.date < planStartDate || plan.date < MANUAL_PLAN_START_DATE) {
      return plan;
    }

    if (plan.isRestDay) {
      return plan;
    }

    const override = manualOverrides[plan.date];
    if (!override) {
      return plan;
    }

    return {
      ...plan,
      planMode: 'manual',
      weekNumber: override.weekNumber,
      subjects: override.subjects,
      hasSimulado: override.hasSimulado,
      hasRedacao: override.hasRedacao,
      targets: buildManualTargets(override.objectiveQuestions),
      manualBlocks: override.manualBlocks,
      manualChecklistSpec: override.manualChecklistSpec,
    };
  });
};

export const buildDayPlans = (planStartDate: string = START_DATE): DayPlan[] => {
  const automaticPlans = buildAutomaticDayPlans(planStartDate);
  return applyManualOverrides(automaticPlans, planStartDate);
};

export const buildMonthlyTargetsFromDayPlans = (
  dayPlans: DayPlan[],
): ExamWritingMonthlyTarget[] => {
  const monthKeys = [...new Set(dayPlans.map((plan) => plan.monthKey))].sort();

  return monthKeys.map((monthKey) => {
    const monthPlans = dayPlans.filter((plan) => plan.monthKey === monthKey);

    return {
      monthKey,
      simulados: monthPlans.filter((plan) => plan.hasSimulado).length,
      redacoes: monthPlans.filter((plan) => plan.hasRedacao).length,
    };
  });
};

export const buildDayPlansByDate = (dayPlans: DayPlan[]): Record<string, DayPlan> =>
  dayPlans.reduce<Record<string, DayPlan>>((accumulator, dayPlan) => {
    accumulator[dayPlan.date] = dayPlan;
    return accumulator;
  }, {});

