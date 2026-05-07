import { describe, expect, it } from 'vitest';
import { findNextFailurePlanDate } from '../app/cleanConcursoModule';
import { inferManualBlockSubject } from '../app/manualBlockSubjects';
import { buildDayPlans } from '../app/schedule';
import type { DayPlan, ManualBlock, SubjectKey } from '../app/types';

const hasSubject = (plan: DayPlan, subject: SubjectKey): boolean =>
  plan.subjects.includes(subject)
  || (plan.manualBlocks ?? []).some((block) => inferManualBlockSubject(block) === subject);

const createPlan = (
  date: string,
  subjects: [SubjectKey, SubjectKey],
  manualBlocks: ManualBlock[],
): DayPlan => ({
  date,
  planMode: 'manual',
  isRestDay: false,
  subjects,
  workActivity: 'programacao',
  hasSimulado: false,
  hasRedacao: false,
  targets: {
    mainStudyMinutes: 180,
    ankiMainMinutes: 60,
    workAnkiMinutes: 60,
    workActivityMinutes: 60,
    objectiveQuestions: 50,
  },
  monthKey: date.slice(0, 7),
  manualBlocks,
});

describe('buildDayPlans', () => {
  const plans = buildDayPlans();
  const byDate = Object.fromEntries(plans.map((plan) => [plan.date, plan]));

  it('gera a janela completa entre 14/03 e 19/11', () => {
    expect(plans).toHaveLength(251);
    expect(plans[0]?.date).toBe('2026-03-14');
    expect(plans[plans.length - 1]?.date).toBe('2026-11-19');
  });

  it('mantem o primeiro dia visivel em 14/03 ja dentro da trilha manual', () => {
    const firstDay = byDate['2026-03-14'];
    expect(firstDay?.planMode).toBe('manual');
    expect(firstDay?.manualBlocks?.[0]?.title).toContain('Web: HTML semântico + forms');
    expect((firstDay?.manualBlocks?.[0]?.contentRefs?.length ?? 0) > 0).toBe(true);
    expect(firstDay?.manualBlocks?.[0]?.contentTargets?.[0]?.path).toMatch(/^\/conteudo\/topico\/item-/);
    expect(firstDay?.weekNumber).toBe(1);
  });

  it('mantém domingos como descanso fixo dentro da janela manual', () => {
    const sundaysInWindow = plans.filter(
      (plan) => plan.date >= '2026-03-14' && plan.date <= '2026-11-19' && plan.isRestDay,
    );

    expect(sundaysInWindow.length).toBeGreaterThan(0);
    expect(sundaysInWindow.every((plan) => plan.planMode === 'auto')).toBe(true);
    expect(byDate['2026-03-15']?.isRestDay).toBe(true);
  });

  it('troca o dia de descanso quando a configuração muda', () => {
    const saturdayRestPlans = buildDayPlans('2026-03-14', [], 6);
    const saturdayRestByDate = Object.fromEntries(saturdayRestPlans.map((plan) => [plan.date, plan]));

    expect(saturdayRestByDate['2026-03-14']?.isRestDay).toBe(true);
    expect(saturdayRestByDate['2026-03-15']?.isRestDay).toBe(false);
  });

  it('realoca eventos de domingo para sábado com bloco marcado', () => {
    const movedDay = plans.find((plan) =>
      (plan.manualBlocks ?? []).some((block) => block.movedFromSunday),
    );

    expect(movedDay?.planMode).toBe('manual');
    expect(movedDay?.manualBlocks?.some((block) => block.movedFromSunday)).toBe(true);
  });

  it('usa 40 questões nos dias com redação extra', () => {
    const redacaoDay = plans.find(
      (plan) => plan.planMode === 'manual' && plan.hasRedacao && plan.targets.objectiveQuestions === 40,
    );

    expect(redacaoDay).toBeDefined();
  });

  it('mantém plano manual até o fim da janela em 19/11/2026', () => {
    expect(byDate['2026-11-19']?.planMode).toBe('manual');
    expect(byDate['2026-11-19']?.weekNumber).toBe(36);
    expect(byDate['2026-11-20']).toBeUndefined();
  });

  it('garante referencias oficiais para todo bloco manual de estudo', () => {
    const studyBlocks = plans
      .filter((plan) => plan.planMode === 'manual')
      .flatMap((plan) => plan.manualBlocks ?? [])
      .filter((block) =>
        ['PT', 'PT (FCC)', 'PT + Redação', 'RLM', 'Legis', 'TI'].some((area) =>
          block.area.startsWith(area),
        ),
      );

    expect(studyBlocks.length).toBeGreaterThan(0);
    expect(studyBlocks.every((block) => (block.contentRefs?.length ?? 0) > 0)).toBe(true);
    expect(studyBlocks.every((block) => (block.contentTargets?.length ?? 0) > 0)).toBe(true);
  });

  it('realoca falha para o proximo dia manual sem a mesma materia quando existe nos proximos 5 dias', () => {
    const sourcePlan = plans.find((plan) =>
      (plan.manualBlocks ?? []).some((block) => block.id === 'w1-mon-pt-interpretacao'),
    );
    expect(sourcePlan).toBeDefined();

    const rescheduled = buildDayPlans('2026-03-14', [
      {
        id: 'failure-pt',
        failedAt: sourcePlan?.date ?? '2026-03-14',
        blockId: 'w1-mon-pt-interpretacao',
        createdAt: '2026-03-14T12:00:00.000Z',
      },
    ]);
    const destinationPlan = rescheduled.find((plan) =>
      (plan.manualBlocks ?? []).some((block) => block.id === 'w1-mon-pt-interpretacao'),
    );

    expect(destinationPlan?.date).not.toBe(sourcePlan?.date);
    expect((destinationPlan?.date ?? '').localeCompare(sourcePlan?.date ?? '')).toBeGreaterThan(0);
    expect(sourcePlan ? hasSubject(destinationPlan as DayPlan, 'portugues') : false).toBe(true);
  });

  it('nao realoca TI para o dia seguinte quando o dia seguinte ja tem TI', () => {
    const tiBlock: ManualBlock = {
      id: 'ti-source',
      area: 'TI',
      title: 'Java',
      detail: 'Questões de Java',
    };
    const plansWithBusyTomorrow = [
      createPlan('2026-03-16', ['especificos', 'portugues'], [tiBlock]),
      createPlan('2026-03-17', ['especificos', 'rlm'], [{ id: 'ti-next', area: 'TI', title: 'Web', detail: 'HTML' }]),
      createPlan('2026-03-18', ['portugues', 'rlm'], [{ id: 'pt-next', area: 'PT', title: 'Texto', detail: 'Leitura' }]),
    ];

    expect(findNextFailurePlanDate(plansWithBusyTomorrow, '2026-03-16', tiBlock)).toBe('2026-03-18');
  });

  it('usa o proximo dia manual quando os proximos 5 dias ja contem a mesma materia', () => {
    const tiBlock: ManualBlock = {
      id: 'ti-fallback',
      area: 'TI',
      title: 'Java',
      detail: 'Questões de Java',
    };
    const plansWithFiveBusyDays = [
      createPlan('2026-03-16', ['especificos', 'portugues'], [tiBlock]),
      createPlan('2026-03-17', ['especificos', 'rlm'], [{ id: 'ti-1', area: 'TI', title: 'Web', detail: 'HTML' }]),
      createPlan('2026-03-18', ['especificos', 'rlm'], [{ id: 'ti-2', area: 'TI', title: 'Java', detail: 'API' }]),
      createPlan('2026-03-19', ['especificos', 'rlm'], [{ id: 'ti-3', area: 'TI', title: 'SQL', detail: 'Banco' }]),
      createPlan('2026-03-20', ['especificos', 'rlm'], [{ id: 'ti-4', area: 'TI', title: 'Redes', detail: 'TCP' }]),
      createPlan('2026-03-21', ['especificos', 'rlm'], [{ id: 'ti-5', area: 'TI', title: 'Docker', detail: 'Linux' }]),
      createPlan('2026-03-23', ['portugues', 'rlm'], [{ id: 'pt-1', area: 'PT', title: 'Texto', detail: 'Leitura' }]),
    ];

    expect(findNextFailurePlanDate(plansWithFiveBusyDays, '2026-03-16', tiBlock)).toBe('2026-03-17');
  });
});
