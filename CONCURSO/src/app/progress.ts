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
  const requiredItems = items.filter((item) => item.required);
  if (requiredItems.length === 0) {
    return 100;
  }

  const progress =
    requiredItems.reduce((sum, item) => sum + getChecklistItemProgress(item), 0) / requiredItems.length;

  return Math.round(progress * 100);
};

export const countCompletedItemById = (
  records: Record<string, DailyRecord>,
  itemId: 'simulado' | 'redacao',
  monthKey?: string,
): number => {
  const entries = Object.entries(records);

  return entries.reduce((sum, [date, record]) => {
    if (monthKey && !date.startsWith(monthKey)) {
      return sum;
    }

    const item = record.checklist.find((check) => check.id === itemId);
    if (!item) {
      return sum;
    }

    return sum + (item.done >= item.target ? 1 : 0);
  }, 0);
};

export const buildExamProgressTotals = (
  records: Record<string, DailyRecord>,
  monthlyTargets: ExamWritingMonthlyTarget[],
): ExamProgressTotals => {
  const simuladosTarget = monthlyTargets.reduce((acc, row) => acc + row.simulados, 0);
  const redacoesTarget = monthlyTargets.reduce((acc, row) => acc + row.redacoes, 0);

  return {
    simuladosDone: countCompletedItemById(records, 'simulado'),
    simuladosTarget,
    redacoesDone: countCompletedItemById(records, 'redacao'),
    redacoesTarget,
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

