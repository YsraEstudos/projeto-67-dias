import { describe, expect, it } from 'vitest';
import { buildDayPlans, buildMonthlyTargetsFromDayPlans } from '../app/schedule';

describe('monthly goals', () => {
  const plans = buildDayPlans();
  const targets = buildMonthlyTargetsFromDayPlans(plans);

  it('deriva metas mensais diretamente do cronograma diário final', () => {
    const august = targets.find((target) => target.monthKey === '2026-08');
    const september = targets.find((target) => target.monthKey === '2026-09');
    const october = targets.find((target) => target.monthKey === '2026-10');

    expect(august).toEqual({
      monthKey: '2026-08',
      simulados: plans.filter((plan) => plan.monthKey === '2026-08' && plan.hasSimulado).length,
      redacoes: plans.filter((plan) => plan.monthKey === '2026-08' && plan.hasRedacao).length,
    });
    expect(september).toEqual({
      monthKey: '2026-09',
      simulados: plans.filter((plan) => plan.monthKey === '2026-09' && plan.hasSimulado).length,
      redacoes: plans.filter((plan) => plan.monthKey === '2026-09' && plan.hasRedacao).length,
    });
    expect(october).toEqual({
      monthKey: '2026-10',
      simulados: plans.filter((plan) => plan.monthKey === '2026-10' && plan.hasSimulado).length,
      redacoes: plans.filter((plan) => plan.monthKey === '2026-10' && plan.hasRedacao).length,
    });
  });

  it('mantém totais globais coerentes com o plano híbrido', () => {
    const totalSimulados = targets.reduce((sum, row) => sum + row.simulados, 0);
    const totalRedacoes = targets.reduce((sum, row) => sum + row.redacoes, 0);

    expect(totalSimulados).toBe(plans.filter((plan) => plan.hasSimulado).length);
    expect(totalRedacoes).toBe(plans.filter((plan) => plan.hasRedacao).length);
  });
});
