import type {
  ChecklistItem,
  DailyRecord,
  DayPlan,
  ExamProgressTotals,
  ExamWritingMonthlyTarget,
} from './types';

export const getChecklistItemProgress = (item: ChecklistItem): number => {
  if (item.target === 0) {
    return 1;
  }

  return Math.min(item.done / item.target, 1);
};

export const getChecklistProgressPercent = (items: ChecklistItem[]): number => {
  let requiredCount = 0;
  let progressSum = 0;

  for (const item of items) {
    if (!item.required) {
      continue;
    }

    requiredCount += 1;
    progressSum += getChecklistItemProgress(item);
  }

  if (requiredCount === 0) {
    return 100;
  }

  const progress = progressSum / requiredCount;

  return Math.round(progress * 100);
};

export const countCompletedItemById = (
  records: Record<string, DailyRecord>,
  itemId: 'simulado' | 'redacao',
  monthKey?: string,
): number => {
  let total = 0;

  for (const [date, record] of Object.entries(records)) {
    if (monthKey && !date.startsWith(monthKey)) {
      continue;
    }

    for (const check of record.checklist) {
      if (check.id !== itemId) {
        continue;
      }

      total += check.done >= check.target ? 1 : 0;
      break;
    }
  }

  return total;
};

export interface ExamProgressMonthSummary {
  simuladosDone: number;
  redacoesDone: number;
}

export interface ExamProgressSummary extends ExamProgressTotals {
  byMonth: Record<string, ExamProgressMonthSummary>;
}

const createEmptyExamProgressMonthSummary = (): ExamProgressMonthSummary => ({
  simuladosDone: 0,
  redacoesDone: 0,
});

export const buildExamProgressSummary = (
  records: Record<string, DailyRecord>,
  monthlyTargets: ExamWritingMonthlyTarget[],
): ExamProgressSummary => {
  const byMonth: Record<string, ExamProgressMonthSummary> = {};
  let simuladosDone = 0;
  let redacoesDone = 0;

  for (const [date, record] of Object.entries(records)) {
    const monthKey = date.slice(0, 7);
    const monthSummary = byMonth[monthKey] ??= createEmptyExamProgressMonthSummary();
    let simuladoDoneToday = false;
    let redacaoDoneToday = false;

    for (const check of record.checklist) {
      if (check.id === 'simulado') {
        simuladoDoneToday = check.done >= check.target;
      } else if (check.id === 'redacao') {
        redacaoDoneToday = check.done >= check.target;
      }
    }

    if (simuladoDoneToday) {
      simuladosDone += 1;
      monthSummary.simuladosDone += 1;
    }

    if (redacaoDoneToday) {
      redacoesDone += 1;
      monthSummary.redacoesDone += 1;
    }
  }

  return {
    simuladosDone,
    simuladosTarget: monthlyTargets.reduce((acc, row) => acc + row.simulados, 0),
    redacoesDone,
    redacoesTarget: monthlyTargets.reduce((acc, row) => acc + row.redacoes, 0),
    byMonth,
  };
};

export const buildExamProgressTotals = (
  records: Record<string, DailyRecord>,
  monthlyTargets: ExamWritingMonthlyTarget[],
): ExamProgressTotals => {
  const summary = buildExamProgressSummary(records, monthlyTargets);

  return {
    simuladosDone: summary.simuladosDone,
    simuladosTarget: summary.simuladosTarget,
    redacoesDone: summary.redacoesDone,
    redacoesTarget: summary.redacoesTarget,
  };
};

export const countOverdueDays = (
  dayPlansByDate: Record<string, DayPlan>,
  records: Record<string, DailyRecord>,
  selectedDate: string,
): number => {
  return Object.entries(records).reduce((sum, [date, record]) => {
    const plan = dayPlansByDate[date];
    if (!plan || plan.isRestDay || date >= selectedDate) {
      return sum;
    }

    return sum + (getChecklistProgressPercent(record.checklist) < 100 ? 1 : 0);
  }, 0);
};

