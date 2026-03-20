import { describe, expect, it } from 'vitest';
import { buildFullPlanMarkdown } from '../app/planExport';
import { buildDayPlans } from '../app/schedule';

describe('buildFullPlanMarkdown', () => {
  it('inclui referencias oficiais do conteudo programatico nos blocos manuais', () => {
    const firstManualDay = buildDayPlans().find((plan) => plan.date === '2026-03-14');
    expect(firstManualDay).toBeDefined();

    const markdown = buildFullPlanMarkdown([firstManualDay!]);

    expect(markdown).toContain('Conteúdo programático:');
  });
});
