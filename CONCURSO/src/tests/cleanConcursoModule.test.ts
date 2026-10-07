import { describe, expect, it } from 'vitest';
import {
  buildCleanCalendarEvents,
  buildCleanPlanContentItems,
  buildPendingStudyDecisions,
  findNextFailurePlanDate,
  getOlderPendingCutoffDate,
  splitPendingStudyDecisions,
} from '../app/cleanConcursoModule';
import { buildDayPlans } from '../app/schedule';
import { TOPICS } from '../app/seed';

describe('clean concurso module', () => {
  it('lista os blocos reais do plano de 16 semanas, nao apenas os topicos-base', () => {
    const plans = buildDayPlans();
    const items = buildCleanPlanContentItems(plans);
    const officialLeafCount = TOPICS.filter((topic) => topic.isLeaf).length;

    expect(officialLeafCount).toBe(110);
    expect(items.length).toBeGreaterThan(officialLeafCount);
    expect(items.some((item) => item.date === '2026-12-05')).toBe(true);
  });

  it('monta calendario completo ate o fim do plano', () => {
    const plans = buildDayPlans();
    const events = buildCleanCalendarEvents(plans, {}, TOPICS, {}, plans[0]?.date);

    expect(events.length).toBeGreaterThan(110);
    expect(events.some((event) => event.date === '2026-12-05')).toBe(true);
  });

  it('nao cria revisoes em massa no dia seguinte ao inicio sem historico de revisao', () => {
    const plans = buildDayPlans('2026-08-20');
    const events = buildCleanCalendarEvents(plans, {}, TOPICS, {}, '2026-08-20');
    const aug21Events = events.filter((event) => event.date === '2026-08-21');

    expect(aug21Events).toHaveLength(2);
    expect(aug21Events.every((event) => event.kind === 'study')).toBe(true);
  });

  it('aplica status persistido ao evento do calendario', () => {
    const plans = buildDayPlans();
    const firstStudy = buildCleanPlanContentItems(plans)[0];
    const eventId = `${firstStudy.date}-${firstStudy.block.id}`;
    const events = buildCleanCalendarEvents(
      plans,
      {},
      TOPICS,
      {},
      plans[0]?.date,
      {
        [eventId]: {
          status: 'done',
          updatedAt: '2026-08-20T10:00:00.000Z',
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
      {},
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
          createdAt: '2026-08-20T10:00:00.000Z',
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
      {},
      '2026-08-25',
      {
        portugues: 80,
        rlm: 65,
        legislacao: 64,
        especificos: 50,
      },
    );

    expect(pending.length).toBeGreaterThan(1);
    expect(pending.every((item) => item.date < '2026-08-25')).toBe(true);
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
          updatedAt: '2026-08-21T10:00:00.000Z',
          questionsDone: 12,
        },
        '2026-08-23-rest': {
          status: 'pending',
          updatedAt: '2026-08-23T10:00:00.000Z',
        },
        '2026-08-22-simulado': {
          status: 'pending',
          updatedAt: '2026-08-22T10:00:00.000Z',
        },
      },
      {},
      '2026-08-25',
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

  it('resgata materias com status dismissed em calendarEventProgress mantendo-as como pendencias ativas', () => {
    const plans = buildDayPlans();
    const firstStudy = buildCleanPlanContentItems(plans)[0];
    const eventId = `${firstStudy.date}-${firstStudy.block.id}`;
    const pending = buildPendingStudyDecisions(
      plans,
      {
        [eventId]: {
          status: 'dismissed',
          updatedAt: '2026-08-21T10:00:00.000Z',
        },
      },
      {},
      '2026-08-25',
      {
        portugues: 80,
        rlm: 65,
        legislacao: 64,
        especificos: 50,
      },
    );

    expect(pending.some((item) => item.eventId === eventId)).toBe(true);
  });

  it('classifica pendencias entre recentes e semanas anteriores via splitPendingStudyDecisions', () => {
    const plans = buildDayPlans();
    const pending = buildPendingStudyDecisions(
      plans,
      {},
      {},
      '2026-09-13',
      {
        portugues: 80,
        rlm: 65,
        legislacao: 64,
        especificos: 50,
      },
    );

    const { recent, older } = splitPendingStudyDecisions(pending);
    expect(recent.length).toBeGreaterThan(0);
    expect(older.length).toBeGreaterThan(0);
    expect(recent.length + older.length).toBe(pending.length);
    expect(older.every((item) => item.date < '2026-09-06')).toBe(true);
    expect(recent.every((item) => item.date >= '2026-09-06')).toBe(true);
  });

  it('calcula data de retorno para o presente/futuro quando a pendencia e do passado', () => {
    const plans = buildDayPlans();
    const fridayPlan = plans.find((p) => p.date === '2026-08-21')!;
    const legisBlock = fridayPlan.manualBlocks!.find((b) => b.id === 'w1-fri-legis-lc133-provimento')!;
    const today = '2026-09-16';

    const failureDate = findNextFailurePlanDate(plans, '2026-08-21', legisBlock, today);
    expect(failureDate).not.toBeNull();
    expect(failureDate! >= today).toBe(true);
  });

  it('marca rescheduledFromDate nos eventos de estudo realocados', () => {
    const reschedules = [
      {
        id: 'reschedule-1',
        failedAt: '2026-09-15',
        blockId: 'w5-tue-legis-principios-administracao',
        createdAt: '2026-09-16T00:00:00.000Z',
      },
    ];
    const plans = buildDayPlans('2026-08-20', reschedules, 0, '2026-09-16');
    const events = buildCleanCalendarEvents(plans, {}, TOPICS, {}, '2026-08-20', {}, reschedules);

    const reallocatedEvent = events.find(
      (e) => e.date === '2026-09-16' && e.blockId === 'w5-tue-legis-principios-administracao',
    );

    expect(reallocatedEvent).toBeDefined();
    expect(reallocatedEvent?.rescheduledFromDate).toBe('2026-09-15');
  });

  it('realoca primeiro bloco de TI do plano que falhou no inicio para hoje com reposicao e sem questoes de seguranca', () => {
    const reschedules = [
      {
        id: 'fail-first-itil',
        failedAt: '2026-08-20',
        blockId: 'w1-thu-ti-itil-servico-valor',
        createdAt: '2026-09-16T10:00:00.000Z',
      },
    ];
    const today = '2026-09-16';
    const plans = buildDayPlans('2026-08-20', reschedules, 0, today);
    const events = buildCleanCalendarEvents(plans, {}, TOPICS, {}, '2026-08-20', {}, reschedules);

    const todayEvents = events.filter((e) => e.date === today && e.kind === 'study');
    const itilEvent = todayEvents.find((e) => e.blockId === 'w1-thu-ti-itil-servico-valor');
    const segQuestoesEvent = todayEvents.find((e) => e.blockId === 'w5-wed-ti-seg-questoes');

    expect(itilEvent).toBeDefined();
    expect(itilEvent?.rescheduledFromDate).toBe('2026-08-20');
    expect(segQuestoesEvent).toBeUndefined();
    expect(todayEvents.length).toBe(2);
  });

  it('mostra a falha mais recente no selo de reposicao quando o bloco falhou mais de uma vez', () => {
    const blockId = 'w1-thu-ti-itil-servico-valor';
    const reschedules = [
      { id: 'f-1', failedAt: '2026-08-20', blockId, createdAt: '2026-09-16T15:00:00.000Z' },
      { id: 'f-2', failedAt: '2026-09-16', blockId, createdAt: '2026-09-17T15:00:00.000Z' },
    ];
    const plans = buildDayPlans('2026-08-20', reschedules, 0, '2026-09-20');
    const events = buildCleanCalendarEvents(plans, {}, TOPICS, {}, '2026-08-20', {}, reschedules);
    const studyEvent = events.find((event) => event.kind === 'study' && event.blockId === blockId);

    expect(studyEvent).toBeDefined();
    expect(studyEvent?.rescheduledFromDate).toBe('2026-09-16');
  });

  it('limpar anteriores descarta apenas pendencias antigas e mantem as dos ultimos 7 dias', () => {
    const plans = buildDayPlans('2026-08-20');
    const today = '2026-09-16';
    const goals = { portugues: 30, rlm: 30, legislacao: 30, especificos: 30 };
    const before = buildPendingStudyDecisions(plans, {}, {}, today, goals);
    const { recent, older } = splitPendingStudyDecisions(before);
    expect(recent.length).toBeGreaterThan(0);
    expect(older.length).toBeGreaterThan(0);

    const after = buildPendingStudyDecisions(plans, {}, {}, today, goals, [], getOlderPendingCutoffDate(today));
    const split = splitPendingStudyDecisions(after);
    expect(split.older).toHaveLength(0);
    expect(split.recent.map((item) => item.id)).toEqual(recent.map((item) => item.id));
  });
});
