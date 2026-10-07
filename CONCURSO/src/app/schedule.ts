import {
  END_DATE,
  MONTHLY_TARGETS,
  START_DATE,
  SUBJECT_ORDER,
  WORK_ACTIVITY_ROTATION,
} from './constants';
import { enumerateDateRange, getLocalTodayIsoDate, getWeekday, monthKeyOf } from './dateUtils';
import type {
  DayPlan,
  DayTargets,
  ExamWritingMonthlyTarget,
  ManualBlock,
  ManualBlockReschedule,
  PlanSettings,
  SubjectKey,
} from './types';
import {
  buildManualChecklistSpec,
  buildManualDayOverrides,
  MANUAL_PLAN_START_DATE,
} from '../data/manualDailyPlan';
import { canPlanAcceptBlockSubject, inferManualBlockSubject } from './manualBlockSubjects';

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

const buildAutomaticDayPlans = (
  planStartDate: string = START_DATE,
  restWeekday: PlanSettings['restWeekday'] = 0,
): DayPlan[] => {
  const allDates = enumerateDateRange(planStartDate, END_DATE);
  const activeDates = allDates.filter((date) => getWeekday(date) !== restWeekday);
  const { simuladoDates, redacaoDates } = buildEventDistribution(activeDates);

  const subjectCounters: Record<SubjectKey, number> = {
    portugues: 0,
    rlm: 0,
    legislacao: 0,
    especificos: 0,
  };

  let activeDayIndex = 0;

  return allDates.map((date): DayPlan => {
    const rest = getWeekday(date) === restWeekday;
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

const cloneManualPlan = (plan: DayPlan): DayPlan => ({
  ...plan,
  manualBlocks: plan.manualBlocks ? [...plan.manualBlocks] : plan.manualBlocks,
  manualChecklistSpec: plan.manualChecklistSpec ? [...plan.manualChecklistSpec] : plan.manualChecklistSpec,
});

const refreshManualChecklistSpec = (plan: DayPlan): DayPlan => {
  if (plan.planMode !== 'manual' || !plan.manualBlocks) {
    return plan;
  }

  const inferred: SubjectKey[] = [];
  for (const block of plan.manualBlocks) {
    const s = inferManualBlockSubject(block);
    if (s && !inferred.includes(s)) {
      inferred.push(s);
    }
  }
  const primary = inferred[0] ?? plan.subjects[0] ?? 'especificos';
  const secondary = inferred[1] ?? (primary === 'especificos' ? 'portugues' : 'especificos');

  return {
    ...plan,
    subjects: [primary, secondary],
    manualChecklistSpec: buildManualChecklistSpec(
      plan.manualBlocks,
      plan.targets.objectiveQuestions,
      plan.hasSimulado,
      plan.hasRedacao,
    ),
  };
};

const hasManualPlanSubject = (plan: DayPlan, subject: SubjectKey): boolean => {
  if (plan.manualBlocks && plan.manualBlocks.length > 0) {
    return plan.manualBlocks.some((candidate) => inferManualBlockSubject(candidate) === subject);
  }
  return plan.subjects.includes(subject);
};

const findNextCompatibleManualPlanIndex = (
  plans: DayPlan[],
  fromIndex: number,
  block: ManualBlock,
): number => {
  const subject = inferManualBlockSubject(block);

  // Stage 1: Try to find a day without this subject that has open space (< 2 blocks) within 5 days
  if (subject) {
    let checkedDays = 0;
    for (let index = fromIndex + 1; index < plans.length && checkedDays < 5; index += 1) {
      const plan = plans[index];
      if (plan.planMode !== 'manual' || plan.isRestDay || plan.hasSimulado) continue;
      checkedDays += 1;
      if ((plan.manualBlocks?.length ?? 0) < 2 && !hasManualPlanSubject(plan, subject)) {
        return index;
      }
    }
  }

  // Stage 2: Try to find a day without this subject (within 5 manual days)
  if (subject) {
    let checkedDays = 0;
    for (let index = fromIndex + 1; index < plans.length && checkedDays < 5; index += 1) {
      const plan = plans[index];
      if (plan.planMode !== 'manual' || plan.isRestDay || plan.hasSimulado) continue;
      checkedDays += 1;
      if (!hasManualPlanSubject(plan, subject)) {
        return index;
      }
    }
  }

  // Stage 3: For TI (especificos) where all days contain TI:
  // Find the earliest day with open space (< 2 blocks) that doesn't duplicate the block
  if (subject === 'especificos') {
    for (let index = fromIndex + 1; index < plans.length; index += 1) {
      const plan = plans[index];
      if (plan.planMode !== 'manual' || plan.isRestDay || plan.hasSimulado) continue;
      if ((plan.manualBlocks?.length ?? 0) < 2 && canPlanAcceptBlockSubject(plan, block)) {
        return index;
      }
    }
  }

  // Stage 4: Fallback to next compatible day
  for (let index = fromIndex + 1; index < plans.length; index += 1) {
    const plan = plans[index];
    if (plan.planMode !== 'manual' || plan.isRestDay || plan.hasSimulado) continue;
    if (canPlanAcceptBlockSubject(plan, block)) {
      return index;
    }
  }

  return -1;
};

const insertManualBlockWithDisplacement = (
  plans: DayPlan[],
  targetIndex: number,
  blockToInsert: ManualBlock,
  sourceIndex: number,
  todayIndex: number,
): void => {
  let pendingBlock: ManualBlock | null = blockToInsert;
  let currentIndex = targetIndex;

  while (pendingBlock && currentIndex < plans.length) {
    const plan = plans[currentIndex];
    if (plan.planMode !== 'manual' || plan.isRestDay || plan.hasSimulado) {
      currentIndex += 1;
      continue;
    }

    if (!canPlanAcceptBlockSubject(plan.manualBlocks ?? [], pendingBlock)) {
      currentIndex += 1;
      continue;
    }

    const currentPlan = cloneManualPlan(plan);
    const manualBlocks = currentPlan.manualBlocks ? [...currentPlan.manualBlocks] : [];

    // If day has room (< 2 blocks), simply insert and stop!
    if (manualBlocks.length < 2) {
      manualBlocks.unshift(pendingBlock);
      plans[currentIndex] = refreshManualChecklistSpec({
        ...currentPlan,
        manualBlocks,
      });
      pendingBlock = null;
      break;
    }

    // Day already has 2 blocks. Displace one block so day stays at max 2 blocks!
    const pendingSubject = inferManualBlockSubject(pendingBlock);
    let displaceIndex = manualBlocks.length - 1;

    if (pendingSubject && pendingSubject !== 'especificos') {
      const basicIndex = manualBlocks.findIndex((b) => {
        const s = inferManualBlockSubject(b);
        return s && s !== 'especificos';
      });
      if (basicIndex >= 0) {
        displaceIndex = basicIndex;
      }
    } else if (pendingSubject === 'especificos') {
      const tiIndex = manualBlocks.findIndex((b) => inferManualBlockSubject(b) === 'especificos');
      if (tiIndex >= 0) {
        displaceIndex = tiIndex;
      }
    }

    const [displacedBlock] = manualBlocks.splice(displaceIndex, 1);
    manualBlocks.unshift(pendingBlock);

    plans[currentIndex] = refreshManualChecklistSpec({
      ...currentPlan,
      manualBlocks,
    });

    // If sourcePlan is today or in the future, check if displacedBlock can swap back to sourcePlan
    let placed = false;
    if (sourceIndex >= 0 && sourceIndex >= todayIndex && sourceIndex < plans.length) {
      const sourcePlan = plans[sourceIndex];
      if (
        sourcePlan.planMode === 'manual'
        && !sourcePlan.isRestDay
        && (sourcePlan.manualBlocks?.length ?? 0) < 2
        && canPlanAcceptBlockSubject(sourcePlan.manualBlocks ?? [], displacedBlock)
      ) {
        const updatedSourceBlocks = [...(sourcePlan.manualBlocks ?? []), displacedBlock];
        plans[sourceIndex] = refreshManualChecklistSpec({
          ...sourcePlan,
          manualBlocks: updatedSourceBlocks,
        });
        pendingBlock = null;
        placed = true;
        break;
      }
    }

    // Check if any earlier day between todayIndex and currentIndex has an open slot (< 2 blocks)
    if (!placed) {
      for (let slotIndex = todayIndex; slotIndex < currentIndex; slotIndex += 1) {
        const slotPlan = plans[slotIndex];
        if (
          slotPlan.planMode === 'manual'
          && !slotPlan.isRestDay
          && !slotPlan.hasSimulado
          && (slotPlan.manualBlocks?.length ?? 0) < 2
          && canPlanAcceptBlockSubject(slotPlan.manualBlocks ?? [], displacedBlock)
        ) {
          const updatedBlocks = [...(slotPlan.manualBlocks ?? []), displacedBlock];
          plans[slotIndex] = refreshManualChecklistSpec({
            ...slotPlan,
            manualBlocks: updatedBlocks,
          });
          pendingBlock = null;
          placed = true;
          break;
        }
      }
    }

    if (placed) {
      break;
    }

    // Displaced block cascades forward to the next available day
    pendingBlock = displacedBlock;
    currentIndex += 1;
  }

  // Safety net: if forward displacement reached the end of the calendar without finding a slot,
  // search from todayIndex for any day that has room (< 2 blocks) and is subject-compatible.
  if (pendingBlock) {
    const startSearch = Math.max(0, todayIndex);
    for (let i = startSearch; i < plans.length; i += 1) {
      const p = plans[i];
      if (p.planMode !== 'manual' || p.isRestDay || p.hasSimulado) continue;
      if ((p.manualBlocks?.length ?? 0) < 2 && canPlanAcceptBlockSubject(p.manualBlocks ?? [], pendingBlock)) {
        const pManualBlocks = p.manualBlocks ? [...p.manualBlocks] : [];
        pManualBlocks.push(pendingBlock);
        plans[i] = refreshManualChecklistSpec({
          ...p,
          manualBlocks: pManualBlocks,
        });
        pendingBlock = null;
        break;
      }
    }
  }

  // Secondary safety net: search for any day with room (< 2 blocks)
  if (pendingBlock) {
    const startSearch = Math.max(0, todayIndex);
    for (let i = startSearch; i < plans.length; i += 1) {
      const p = plans[i];
      if (p.planMode !== 'manual' || p.isRestDay) continue;
      if ((p.manualBlocks?.length ?? 0) < 2) {
        const pManualBlocks = p.manualBlocks ? [...p.manualBlocks] : [];
        pManualBlocks.push(pendingBlock);
        plans[i] = refreshManualChecklistSpec({
          ...p,
          manualBlocks: pManualBlocks,
        });
        pendingBlock = null;
        break;
      }
    }
  }
};

const resolveRescheduleAnchorDate = (
  reschedule: ManualBlockReschedule,
  today?: string,
): string | undefined => {
  const createdAtTime = Date.parse(reschedule.createdAt);
  if (!Number.isFinite(createdAtTime)) {
    return today;
  }

  const createdDate = getLocalTodayIsoDate(new Date(createdAtTime));
  if (!today) {
    return createdDate;
  }
  return createdDate < today ? createdDate : today;
};

export const applyManualBlockReschedules = (
  dayPlans: DayPlan[],
  manualBlockReschedules: ManualBlockReschedule[] = [],
  today?: string,
): DayPlan[] => {
  if (manualBlockReschedules.length === 0) {
    return dayPlans;
  }

  const plans = dayPlans.map(cloneManualPlan);

  for (const reschedule of [...manualBlockReschedules].sort((left, right) => left.createdAt.localeCompare(right.createdAt))) {
    const sourceIndex = plans.findIndex((plan) => plan.date === reschedule.failedAt);
    if (sourceIndex < 0) {
      continue;
    }

    const sourcePlan = cloneManualPlan(plans[sourceIndex]);
    const sourceBlocks = sourcePlan.manualBlocks ?? [];
    const blockIndex = sourceBlocks.findIndex((block) => block.id === reschedule.blockId);

    if (blockIndex < 0) {
      continue;
    }

    const targetBlock = sourceBlocks[blockIndex];
    // Anchor each reschedule to the day it was recorded (capped by `today`), so a block that
    // was already moved to a past date does not keep sliding forward every day and lose its
    // completion record.
    const anchorDate = resolveRescheduleAnchorDate(reschedule, today);
    const todayIndex = anchorDate ? plans.findIndex((plan) => plan.date === anchorDate) : -1;
    const startIndex = anchorDate && todayIndex >= 0 && sourcePlan.date < anchorDate
      ? Math.max(sourceIndex, todayIndex - 1)
      : sourceIndex;
    const nextManualIndex = findNextCompatibleManualPlanIndex(plans, startIndex, targetBlock);
    if (nextManualIndex < 0) {
      continue;
    }

    const [failedBlock] = sourceBlocks.splice(blockIndex, 1);
    plans[sourceIndex] = refreshManualChecklistSpec({
      ...sourcePlan,
      manualBlocks: sourceBlocks,
    });

    insertManualBlockWithDisplacement(
      plans,
      nextManualIndex,
      failedBlock,
      sourceIndex,
      todayIndex >= 0 ? todayIndex : 0,
    );
  }

  return plans;
};

export const buildDayPlans = (
  planStartDate: string = START_DATE,
  manualBlockReschedules: ManualBlockReschedule[] = [],
  restWeekday: PlanSettings['restWeekday'] = 0,
  today?: string,
): DayPlan[] => {
  const automaticPlans = buildAutomaticDayPlans(planStartDate, restWeekday);
  const dayPlans = applyManualOverrides(automaticPlans, planStartDate);
  return applyManualBlockReschedules(dayPlans, manualBlockReschedules, today);
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

