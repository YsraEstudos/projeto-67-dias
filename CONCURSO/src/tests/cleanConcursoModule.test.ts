import { describe, expect, it } from 'vitest';
import {
  buildCleanCalendarEvents,
  buildCleanPlanContentItems,
} from '../app/cleanConcursoModule';
import { buildDayPlans } from '../app/schedule';
import { TOPICS } from '../app/seed';

describe('clean concurso module', () => {
  it('lista os blocos reais do plano de nove meses, nao apenas os topicos-base', () => {
    const plans = buildDayPlans();
    const items = buildCleanPlanContentItems(plans);
    const officialLeafCount = TOPICS.filter((topic) => topic.isLeaf).length;

    expect(officialLeafCount).toBe(110);
    expect(items.length).toBeGreaterThan(officialLeafCount);
    expect(items.some((item) => item.date === '2026-11-19')).toBe(true);
  });

  it('monta calendario completo ate o fim do plano', () => {
    const plans = buildDayPlans();
    const events = buildCleanCalendarEvents(plans, {}, TOPICS, plans[0]?.date);

    expect(events.length).toBeGreaterThan(110);
    expect(events.some((event) => event.date === '2026-11-19')).toBe(true);
  });
});
