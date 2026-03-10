import type { ChecklistItem, DayPlan } from './types';

const evaluateStatus = (done: number, target: number): 'pendente' | 'concluido' =>
  done >= target ? 'concluido' : 'pendente';

const buildChecklistFromManualSpec = (dayPlan: DayPlan): ChecklistItem[] => {
  return (dayPlan.manualChecklistSpec ?? []).map((item) => {
    const initialDone = 0;

    return {
      id: item.id,
      label: item.label,
      kind: item.kind,
      target: item.target,
      done: initialDone,
      unit: item.unit,
      required: item.required,
      status: evaluateStatus(initialDone, item.target),
    };
  });
};

export const createChecklistTemplate = (dayPlan: DayPlan): ChecklistItem[] => {
  if (dayPlan.isRestDay) {
    return [
      {
        id: 'rest-day',
        label: 'Dia de descanso (domingo)',
        kind: 'boolean',
        target: 1,
        done: 1,
        unit: 'ok',
        required: false,
        status: 'concluido',
      },
    ];
  }

  if (dayPlan.manualChecklistSpec && dayPlan.manualChecklistSpec.length > 0) {
    return buildChecklistFromManualSpec(dayPlan);
  }

  const checklist: ChecklistItem[] = [
    {
      id: 'main-study-minutes',
      label: 'Bloco principal (duas matérias) - 3h',
      kind: 'counter',
      target: dayPlan.targets.mainStudyMinutes,
      done: 0,
      unit: 'min',
      required: true,
      status: 'pendente',
    },
    {
      id: 'main-anki-minutes',
      label: 'Anki no bloco principal - 1h',
      kind: 'counter',
      target: dayPlan.targets.ankiMainMinutes,
      done: 0,
      unit: 'min',
      required: true,
      status: 'pendente',
    },
    {
      id: 'work-anki-minutes',
      label: 'Anki no horário de trabalho - 1h',
      kind: 'counter',
      target: dayPlan.targets.workAnkiMinutes,
      done: 0,
      unit: 'min',
      required: true,
      status: 'pendente',
    },
    {
      id: 'work-activity-minutes',
      label: 'Bloco rotativo no trabalho - 1h',
      kind: 'counter',
      target: dayPlan.targets.workActivityMinutes,
      done: 0,
      unit: 'min',
      required: true,
      status: 'pendente',
    },
    {
      id: 'objective-questions',
      label:
        dayPlan.targets.objectiveQuestions === 0
          ? 'Questões objetivas substituídas por simulado'
          : `Questões objetivas (${dayPlan.targets.objectiveQuestions}/dia)`,
      kind: 'counter',
      target: dayPlan.targets.objectiveQuestions,
      done: 0,
      unit: 'questões',
      required: true,
      status: dayPlan.targets.objectiveQuestions === 0 ? 'concluido' : 'pendente',
    },
  ];

  if (dayPlan.hasSimulado) {
    checklist.push({
      id: 'simulado',
      label: 'Simulado completo do dia',
      kind: 'boolean',
      target: 1,
      done: 0,
      unit: 'ok',
      required: true,
      status: 'pendente',
    });
  }

  if (dayPlan.hasRedacao) {
    checklist.push({
      id: 'redacao',
      label: 'Redação do dia',
      kind: 'boolean',
      target: 1,
      done: 0,
      unit: 'ok',
      required: true,
      status: 'pendente',
    });
  }

  return checklist;
};

export const updateChecklistValue = (
  checklist: ChecklistItem[],
  itemId: string,
  done: number,
): ChecklistItem[] =>
  checklist.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    const boundedDone = Math.max(0, Math.min(done, item.target === 0 ? done : item.target));

    return {
      ...item,
      done: item.kind === 'boolean' ? (boundedDone >= 1 ? 1 : 0) : boundedDone,
      status: evaluateStatus(item.kind === 'boolean' ? (boundedDone >= 1 ? 1 : 0) : boundedDone, item.target),
    };
  });

