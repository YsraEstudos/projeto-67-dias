import { describe, expect, it } from 'vitest';
import { buildDayPlans } from '../app/schedule';

describe('buildDayPlans', () => {
  const plans = buildDayPlans();
  const byDate = Object.fromEntries(plans.map((plan) => [plan.date, plan]));

  it('gera a janela completa entre 10/03 e 19/11', () => {
    expect(plans).toHaveLength(255);
    expect(plans[0]?.date).toBe('2026-03-10');
    expect(plans[plans.length - 1]?.date).toBe('2026-11-19');
  });

  it('aplica plano manual no início com conteúdo deslocado de 23/02 para 10/03', () => {
    const firstDay = byDate['2026-03-10'];
    expect(firstDay?.planMode).toBe('manual');
    expect(firstDay?.manualBlocks?.[0]?.title).toContain('HTML semântico + forms');
    expect(firstDay?.weekNumber).toBe(1);
  });

  it('mantém domingos como descanso fixo dentro da janela manual', () => {
    const sundaysInWindow = plans.filter(
      (plan) => plan.date >= '2026-03-10' && plan.date <= '2026-11-19' && plan.isRestDay,
    );

    expect(sundaysInWindow.length).toBeGreaterThan(0);
    expect(sundaysInWindow.every((plan) => plan.planMode === 'auto')).toBe(true);
    expect(byDate['2026-03-15']?.isRestDay).toBe(true);
  });

  it('realoca eventos de domingo para sábado com bloco marcado', () => {
    const movedSaturday = byDate['2026-05-30'];
    expect(movedSaturday?.planMode).toBe('manual');
    expect(movedSaturday?.manualBlocks?.some((block) => block.movedFromSunday)).toBe(true);
  });

  it('usa 40 questões nos dias com redação extra', () => {
    expect(byDate['2026-03-20']?.targets.objectiveQuestions).toBe(40);
    expect(byDate['2026-03-20']?.hasRedacao).toBe(true);
  });

  it('mantém plano manual até o fim da janela em 19/11/2026', () => {
    expect(byDate['2026-11-19']?.planMode).toBe('manual');
    expect(byDate['2026-11-19']?.weekNumber).toBe(39);
    expect(byDate['2026-11-20']).toBeUndefined();
  });
});
