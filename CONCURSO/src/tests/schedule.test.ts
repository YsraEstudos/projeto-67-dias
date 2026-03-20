import { describe, expect, it } from 'vitest';
import { buildDayPlans } from '../app/schedule';

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
});
