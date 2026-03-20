import { describe, expect, it } from 'vitest';
import { buildDayPlans, buildMonthlyTargetsFromDayPlans } from '../app/schedule';

describe('monthly goals', () => {
  const plans = buildDayPlans();
  const targets = buildMonthlyTargetsFromDayPlans(plans);

  it('deriva metas mensais diretamente do cronograma diário final', () => {
    const march = targets.find((target) => target.monthKey === '2026-03');
    const april = targets.find((target) => target.monthKey === '2026-04');
    const may = targets.find((target) => target.monthKey === '2026-05');

    expect(march).toEqual({
      monthKey: '2026-03',
      simulados: plans.filter((plan) => plan.monthKey === '2026-03' && plan.hasSimulado).length,
      redacoes: plans.filter((plan) => plan.monthKey === '2026-03' && plan.hasRedacao).length,
    });
    expect(april).toEqual({
      monthKey: '2026-04',
      simulados: plans.filter((plan) => plan.monthKey === '2026-04' && plan.hasSimulado).length,
      redacoes: plans.filter((plan) => plan.monthKey === '2026-04' && plan.hasRedacao).length,
    });
    expect(may).toEqual({
      monthKey: '2026-05',
      simulados: plans.filter((plan) => plan.monthKey === '2026-05' && plan.hasSimulado).length,
      redacoes: plans.filter((plan) => plan.monthKey === '2026-05' && plan.hasRedacao).length,
    });
  });

  it('mantém totais globais coerentes com o plano híbrido', () => {
    const totalSimulados = targets.reduce((sum, row) => sum + row.simulados, 0);
    const totalRedacoes = targets.reduce((sum, row) => sum + row.redacoes, 0);

    expect(totalSimulados).toBe(plans.filter((plan) => plan.hasSimulado).length);
    expect(totalRedacoes).toBe(plans.filter((plan) => plan.hasRedacao).length);
  });
});
