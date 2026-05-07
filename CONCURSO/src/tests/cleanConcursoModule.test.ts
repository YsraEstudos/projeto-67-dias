import { describe, expect, it } from 'vitest';
import {
  buildCleanCalendarEvents,
  buildCleanPlanContentItems,
  buildPendingStudyDecisions,
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

  it('nao cria revisoes em massa no dia seguinte ao inicio sem historico de revisao', () => {
    const plans = buildDayPlans('2026-05-05');
    const events = buildCleanCalendarEvents(plans, {}, TOPICS, '2026-05-05');
    const maySixEvents = events.filter((event) => event.date === '2026-05-06');

    expect(maySixEvents).toHaveLength(2);
    expect(maySixEvents.every((event) => event.kind === 'study')).toBe(true);
  });

  it('aplica status persistido ao evento do calendario', () => {
    const plans = buildDayPlans();
    const firstStudy = buildCleanPlanContentItems(plans)[0];
    const eventId = `${firstStudy.date}-${firstStudy.block.id}`;
    const events = buildCleanCalendarEvents(
      plans,
      {},
      TOPICS,
      plans[0]?.date,
      {
        [eventId]: {
          status: 'done',
          updatedAt: '2026-04-27T10:00:00.000Z',
        },
      },
    );

    expect(events.find((event) => event.id === eventId)?.status).toBe('done');
  });

  it('mantem evento de falha no dia original com snapshot do bloco realocado', () => {
    const plans = buildDayPlans();
    const firstStudy = buildCleanPlanContentItems(plans)[0];
    const events = buildCleanCalendarEvents(
      plans,
      {},
      TOPICS,
      plans[0]?.date,
      {},
      [
        {
          id: 'reschedule-1',
          failedAt: firstStudy.date,
          blockId: firstStudy.block.id,
          title: firstStudy.block.title,
          subtitle: firstStudy.block.detail,
          subject: firstStudy.subject,
          createdAt: '2026-04-27T10:00:00.000Z',
        },
      ],
    );

    expect(events).toContainEqual(
      expect.objectContaining({
        id: `${firstStudy.date}-${firstStudy.block.id}-failed`,
        kind: 'failed',
        status: 'failed',
        title: firstStudy.block.title,
      }),
    );
  });

  it('detecta todas as materias atrasadas ainda pendentes antes de hoje', () => {
    const plans = buildDayPlans();
    const pending = buildPendingStudyDecisions(
      plans,
      {},
      '2026-03-19',
      {
        portugues: 80,
        rlm: 65,
        legislacao: 64,
        especificos: 50,
      },
    );

    expect(pending.length).toBeGreaterThan(1);
    expect(pending.every((item) => item.date < '2026-03-19')).toBe(true);
    expect([...pending].sort((left, right) => left.date.localeCompare(right.date))).toEqual(pending);
  });

  it('ignora materias feitas ou falhadas e nao inclui descanso, revisao, simulado ou redacao', () => {
    const plans = buildDayPlans();
    const firstStudy = buildCleanPlanContentItems(plans)[0];
    const eventId = `${firstStudy.date}-${firstStudy.block.id}`;
    const pending = buildPendingStudyDecisions(
      plans,
      {
        [eventId]: {
          status: 'done',
          updatedAt: '2026-03-16T10:00:00.000Z',
          questionsDone: 12,
        },
        '2026-03-15-rest': {
          status: 'pending',
          updatedAt: '2026-03-15T10:00:00.000Z',
        },
        '2026-03-17-simulado': {
          status: 'pending',
          updatedAt: '2026-03-17T10:00:00.000Z',
        },
      },
      '2026-03-19',
      {
        portugues: 80,
        rlm: 65,
        legislacao: 64,
        especificos: 50,
      },
    );

    expect(pending.some((item) => item.eventId === eventId)).toBe(false);
    expect(pending.every((item) => item.block !== null)).toBe(true);
    expect(pending.some((item) => item.eventId.endsWith('-rest'))).toBe(false);
    expect(pending.some((item) => item.eventId.endsWith('-simulado'))).toBe(false);
  });
});
