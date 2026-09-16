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

  it('usa o proximo dia manual de fallback quando os proximos 5 dias ja contem a mesma materia', () => {
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

    expect(findNextFailurePlanDate(plansWithFiveBusyDays, '2026-08-24', tiBlock)).toBe('2026-08-25');
  });

  it('move o bloco para o proximo dia manual de fallback quando os proximos 5 dias ja a contem', () => {
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
      '2026-08-25',
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
      const maxAllowed = plan.isRestDay ? 0 : plan.hasSimulado ? (plan.manualBlocks?.length ?? 0) : 2;
      const newPlan = rescheduled.find((candidate) => candidate.date === plan.date);
      expect(newPlan?.manualBlocks?.length ?? 0).toBeLessThanOrEqual(maxAllowed);
    }

    const allBlocks = rescheduled.flatMap((plan) => plan.manualBlocks ?? []);
    expect(allBlocks.length).toBe(plans.flatMap((plan) => plan.manualBlocks ?? []).length);
  });

  it('nunca desloca blocos futuros para dias passados quando today e fornecido', () => {
    const plans = buildDayPlans('2026-08-20');
    const pastDate = '2026-08-25';
    const today = '2026-08-27';

    const pastPlan = plans.find((p) => p.date === pastDate)!;
    const blockToFail = pastPlan.manualBlocks![0];

    const failures = [
      {
        id: 'fail-past',
        failedAt: pastDate,
        blockId: blockToFail.id,
        createdAt: `${pastDate}T20:00:00.000Z`,
        block: blockToFail,
      },
    ];

    const rescheduled = applyManualBlockReschedules(plans, failures, today);
    const updatedPastPlan = rescheduled.find((p) => p.date === pastDate)!;

    // The past day must only have the remaining blocks, not any new block from the future
    for (const block of updatedPastPlan.manualBlocks ?? []) {
      const wasOriginallyInPastPlan = pastPlan.manualBlocks?.some((b) => b.id === block.id);
      expect(wasOriginallyInPastPlan).toBe(true);
    }
  });

  it('realoca bloco que falhou no passado para data presente ou futura quando today e fornecido', () => {
    const plans = buildDayPlans('2026-08-20');
    const fridayPlan = plans.find((p) => p.date === '2026-08-21')!;
    const legisBlock = fridayPlan.manualBlocks!.find((b) => b.id === 'w1-fri-legis-lc133-provimento')!;
    const today = '2026-09-16';

    const failures = [
      {
        id: 'fail-legis-past',
        failedAt: '2026-08-21',
        blockId: legisBlock.id,
        createdAt: '2026-09-16T10:00:00.000Z',
        block: legisBlock,
      },
    ];

    const rescheduled = applyManualBlockReschedules(plans, failures, today);
    const targetPlan = rescheduled.find((p) => (p.manualBlocks ?? []).some((b) => b.id === legisBlock.id));

    expect(targetPlan).toBeDefined();
    expect(targetPlan!.date >= today).toBe(true);
  });

  it('realoca primeiro bloco de TI do plano que falhou no passado diretamente para hoje', () => {
    const plans = buildDayPlans('2026-08-20');
    const firstPlan = plans.find((p) => p.date === '2026-08-20')!;
    const itilBlock = firstPlan.manualBlocks!.find((b) => b.id === 'w1-thu-ti-itil-servico-valor')!;
    const today = '2026-09-16';

    const failures = [
      {
        id: 'fail-itil-past',
        failedAt: '2026-08-20',
        blockId: itilBlock.id,
        createdAt: '2026-09-16T10:00:00.000Z',
        block: itilBlock,
      },
    ];

    const rescheduled = applyManualBlockReschedules(plans, failures, today);
    const todayPlan = rescheduled.find((p) => p.date === today)!;

    expect(todayPlan).toBeDefined();
    expect(todayPlan.manualBlocks?.some((b) => b.id === itilBlock.id)).toBe(true);
  });

  it('nunca coloca mais de duas materias no mesmo dia apos multiplas falhas no passado', () => {
    const plans = buildDayPlans('2026-08-20');
    const today = '2026-09-16';

    const failures = [
      { id: 'f-itil', failedAt: '2026-08-20', blockId: 'w1-thu-ti-itil-servico-valor', createdAt: '2026-09-16T10:00:00.000Z' },
      { id: 'f-pt1', failedAt: '2026-08-20', blockId: 'w1-thu-pt-interpretacao', createdAt: '2026-09-16T10:01:00.000Z' },
      { id: 'f-leg1', failedAt: '2026-08-21', blockId: 'w1-fri-legis-lc133-provimento', createdAt: '2026-09-16T10:02:00.000Z' },
      { id: 'f-leg2', failedAt: '2026-09-15', blockId: 'w5-tue-legis-principios-administracao', createdAt: '2026-09-16T10:03:00.000Z' },
    ];

    const rescheduled = applyManualBlockReschedules(plans, failures, today);

    // Verify that NO day has more than 2 blocks
    for (const plan of rescheduled) {
      expect(plan.manualBlocks?.length ?? 0).toBeLessThanOrEqual(2);
    }

    // Verify today has at most 2 blocks
    const todayPlan = rescheduled.find((p) => p.date === today)!;
    expect(todayPlan.manualBlocks?.length).toBeLessThanOrEqual(2);
  });

  it('nunca coloca duas materias da mesma categoria (matematica, portugues, legislacao) no mesmo dia', () => {
    const plans = buildDayPlans('2026-08-20');
    const today = '2026-09-16';

    const failures = [
      { id: 'f-itil', failedAt: '2026-08-20', blockId: 'w1-thu-ti-itil-servico-valor', createdAt: '2026-09-16T10:00:00.000Z' },
      { id: 'f-pt1', failedAt: '2026-08-20', blockId: 'w1-thu-pt-interpretacao', createdAt: '2026-09-16T10:01:00.000Z' },
      { id: 'f-pt2', failedAt: '2026-08-24', blockId: 'w2-mon-pt-sintaxe', createdAt: '2026-09-16T10:02:00.000Z' },
      { id: 'f-leg1', failedAt: '2026-08-21', blockId: 'w1-fri-legis-lc133-provimento', createdAt: '2026-09-16T10:03:00.000Z' },
      { id: 'f-leg2', failedAt: '2026-09-15', blockId: 'w5-tue-legis-principios-administracao', createdAt: '2026-09-16T10:04:00.000Z' },
    ];

    const rescheduled = applyManualBlockReschedules(plans, failures, today);

    for (const plan of rescheduled) {
      const subjects = (plan.manualBlocks ?? []).map(inferManualBlockSubject).filter(Boolean);
      const ptCount = subjects.filter((s) => s === 'portugues').length;
      const rlmCount = subjects.filter((s) => s === 'rlm').length;
      const legCount = subjects.filter((s) => s === 'legislacao').length;

      expect(ptCount).toBeLessThanOrEqual(1);
      expect(rlmCount).toBeLessThanOrEqual(1);
      expect(legCount).toBeLessThanOrEqual(1);
      expect(plan.manualBlocks?.length ?? 0).toBeLessThanOrEqual(2);
    }
  });
});

