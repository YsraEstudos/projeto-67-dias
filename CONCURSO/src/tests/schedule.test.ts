import { describe, expect, it } from 'vitest';
import { findNextFailurePlanDate } from '../app/cleanConcursoModule';
import { inferManualBlockSubject } from '../app/manualBlockSubjects';
import { applyManualBlockReschedules, buildDayPlans } from '../app/schedule';
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

  it('gera a janela completa entre 20/08 e 05/12', () => {
    expect(plans).toHaveLength(108);
    expect(plans[0]?.date).toBe('2026-08-20');
    expect(plans[plans.length - 1]?.date).toBe('2026-12-05');
  });

  it('mantem o primeiro dia visivel em 20/08 ja dentro da trilha manual', () => {
    const firstDay = byDate['2026-08-20'];
    expect(firstDay?.planMode).toBe('manual');
    expect(firstDay?.manualBlocks?.[0]?.title).toContain('ITIL 4: serviço, valor e quatro dimensões');
    expect((firstDay?.manualBlocks?.[0]?.contentRefs?.length ?? 0) > 0).toBe(true);
    expect(firstDay?.manualBlocks?.[0]?.contentTargets?.[0]?.path).toMatch(/^\/conteudo\/topico\/item-/);
    expect(firstDay?.weekNumber).toBe(1);
  });

  it('mantém domingos como descanso fixo dentro da janela manual', () => {
    const sundaysInWindow = plans.filter(
      (plan) => plan.date >= '2026-08-20' && plan.date <= '2026-12-05' && plan.isRestDay,
    );

    expect(sundaysInWindow.length).toBeGreaterThan(0);
    expect(sundaysInWindow.every((plan) => plan.planMode === 'auto')).toBe(true);
    expect(byDate['2026-08-23']?.isRestDay).toBe(true);
  });

  it('troca o dia de descanso quando a configuração muda', () => {
    const saturdayRestPlans = buildDayPlans('2026-08-20', [], 6);
    const saturdayRestByDate = Object.fromEntries(saturdayRestPlans.map((plan) => [plan.date, plan]));

    expect(saturdayRestByDate['2026-08-22']?.isRestDay).toBe(true);
    expect(saturdayRestByDate['2026-08-23']?.isRestDay).toBe(false);
  });

  it('mantém simulados nos sábados ao longo das 16 semanas', () => {
    const simuladoDays = plans.filter((plan) => plan.hasSimulado);
    expect(simuladoDays.length).toBe(16);
  });

  it('mantém plano manual até o fim da janela em 05/12/2026', () => {
    expect(byDate['2026-12-05']?.planMode).toBe('manual');
    expect(byDate['2026-12-05']?.weekNumber).toBe(16);
    expect(byDate['2026-12-06']).toBeUndefined();
  });

  it('garante referencias oficiais para todo bloco manual de estudo', () => {
    const studyBlocks = plans
      .filter((plan) => plan.planMode === 'manual')
      .flatMap((plan) => plan.manualBlocks ?? [])
      .filter((block) =>
        ['PT', 'Legis', 'TI', 'Revisão'].some((area) =>
          block.area.startsWith(area),
        ),
      );

    expect(studyBlocks.length).toBeGreaterThan(0);
    expect(studyBlocks.every((block) => (block.contentRefs?.length ?? 0) > 0)).toBe(true);
    expect(studyBlocks.every((block) => (block.contentTargets?.length ?? 0) > 0)).toBe(true);
  });

  it('realoca falha para o proximo dia manual sem a mesma materia quando existe nos proximos 5 dias', () => {
    const sourcePlan = plans.find((plan) =>
      (plan.manualBlocks ?? []).some((block) => block.id === 'w1-thu-pt-interpretacao'),
    );
    expect(sourcePlan).toBeDefined();

    const rescheduled = buildDayPlans('2026-08-20', [
      {
        id: 'failure-pt',
        failedAt: sourcePlan?.date ?? '2026-08-20',
        blockId: 'w1-thu-pt-interpretacao',
        createdAt: '2026-08-20T12:00:00.000Z',
      },
    ]);
    const destinationPlan = rescheduled.find((plan) =>
      (plan.manualBlocks ?? []).some((block) => block.id === 'w1-thu-pt-interpretacao'),
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
      createPlan('2026-08-24', ['especificos', 'portugues'], [tiBlock]),
      createPlan('2026-08-25', ['especificos', 'rlm'], [{ id: 'ti-next', area: 'TI', title: 'Web', detail: 'HTML' }]),
      createPlan('2026-08-26', ['portugues', 'rlm'], [{ id: 'pt-next', area: 'PT', title: 'Texto', detail: 'Leitura' }]),
    ];

    expect(findNextFailurePlanDate(plansWithBusyTomorrow, '2026-08-24', tiBlock)).toBe('2026-08-26');
  });

  it('retorna null quando os proximos 5 dias manuais ja contem a mesma materia', () => {
    const tiBlock: ManualBlock = {
      id: 'ti-fallback',
      area: 'TI',
      title: 'Java',
      detail: 'Questões de Java',
    };
    const plansWithFiveBusyDays = [
      createPlan('2026-08-24', ['especificos', 'portugues'], [tiBlock]),
      createPlan('2026-08-25', ['especificos', 'rlm'], [{ id: 'ti-1', area: 'TI', title: 'Web', detail: 'HTML' }]),
      createPlan('2026-08-26', ['especificos', 'rlm'], [{ id: 'ti-2', area: 'TI', title: 'Java', detail: 'API' }]),
      createPlan('2026-08-27', ['especificos', 'rlm'], [{ id: 'ti-3', area: 'TI', title: 'SQL', detail: 'Banco' }]),
      createPlan('2026-08-28', ['especificos', 'rlm'], [{ id: 'ti-4', area: 'TI', title: 'Redes', detail: 'TCP' }]),
      createPlan('2026-08-29', ['especificos', 'rlm'], [{ id: 'ti-5', area: 'TI', title: 'Docker', detail: 'Linux' }]),
      createPlan('2026-08-31', ['portugues', 'rlm'], [{ id: 'pt-1', area: 'PT', title: 'Texto', detail: 'Leitura' }]),
    ];

    expect(findNextFailurePlanDate(plansWithFiveBusyDays, '2026-08-24', tiBlock)).toBeNull();
  });

  it('nao move o bloco para dia com a mesma materia quando os proximos 5 dias ja a contem', () => {
    const tiBlock: ManualBlock = {
      id: 'ti-stay',
      area: 'TI',
      title: 'Java',
      detail: 'Questões de Java',
    };
    const plans = [
      createPlan('2026-08-24', ['especificos', 'portugues'], [tiBlock]),
      createPlan('2026-08-25', ['especificos', 'rlm'], [{ id: 'ti-1', area: 'TI', title: 'Web', detail: 'HTML' }]),
      createPlan('2026-08-26', ['especificos', 'rlm'], [{ id: 'ti-2', area: 'TI', title: 'SQL', detail: 'Banco' }]),
      createPlan('2026-08-27', ['especificos', 'rlm'], [{ id: 'ti-3', area: 'TI', title: 'Redes', detail: 'TCP' }]),
      createPlan('2026-08-28', ['especificos', 'rlm'], [{ id: 'ti-4', area: 'TI', title: 'Docker', detail: 'Linux' }]),
      createPlan('2026-08-29', ['especificos', 'rlm'], [{ id: 'ti-5', area: 'TI', title: 'Cloud', detail: 'AWS' }]),
      createPlan('2026-08-31', ['portugues', 'rlm'], [{ id: 'pt-1', area: 'PT', title: 'Texto', detail: 'Leitura' }]),
    ];

    const rescheduled = applyManualBlockReschedules(plans, [
      {
        id: 'failure-ti',
        failedAt: '2026-08-24',
        blockId: 'ti-stay',
        createdAt: '2026-08-24T12:00:00.000Z',
      },
    ]);

    expect(rescheduled.find((plan) => (plan.manualBlocks ?? []).some((block) => block.id === 'ti-stay'))?.date).toBe(
      '2026-08-24',
    );
  });

  it('mantem a capacidade original de blocos em todos os dias apos realocacoes em cadeia', () => {
    const plans = buildDayPlans();
    const failures = plans
      .filter((plan) => plan.date >= '2026-08-24' && plan.date <= '2026-08-29' && !plan.isRestDay)
      .flatMap((plan) =>
        (plan.manualBlocks ?? []).map((block) => ({
          id: `failure-${block.id}`,
          failedAt: plan.date,
          blockId: block.id,
          createdAt: `${plan.date}T12:00:00.000Z`,
          block,
        })),
      );

    const rescheduled = applyManualBlockReschedules(plans, failures);

    for (const plan of plans) {
      const originalCount = plan.manualBlocks?.length ?? 0;
      const newPlan = rescheduled.find((candidate) => candidate.date === plan.date);
      expect((newPlan?.manualBlocks?.length ?? 0)).toBeLessThanOrEqual(originalCount);
    }

    const allBlocks = rescheduled.flatMap((plan) => plan.manualBlocks ?? []);
    expect(allBlocks.length).toBe(plans.flatMap((plan) => plan.manualBlocks ?? []).length);
  });
});
