import { describe, it, expect } from 'vitest';
import { mergeSnapshots } from '../app/snapshotMerge';
import { createInitialState } from '../app/seed';
import { buildSnapshot } from '../app/storage';
import { buildDayPlans } from '../app/schedule';
import { buildPendingStudyDecisions } from '../app/cleanConcursoModule';
import type { CalendarEventProgress, ManualBlockReschedule } from '../app/types';

describe('Cross-device Sync & Pending Decisions Integrity', () => {
  it('preserva configuracoes e progresso remoto quando dispositivo B conecta com estado inicial', () => {
    // Device A configures start date and completes Week 4 study blocks
    const deviceAState = createInitialState('2026-08-20');
    deviceAState.planSettings.startDateChangeCount = 1;
    deviceAState.meta.changeToken = 10;
    deviceAState.meta.lastChangedAt = '2026-09-10T18:00:00.000Z';

    // Device A marks 8 blocks (Week 4: Mon 07/09 to Thu 10/09)
    const plans = buildDayPlans('2026-08-20');
    const week4Blocks = plans
      .filter((p) => p.date >= '2026-09-07' && p.date <= '2026-09-10' && !p.isRestDay)
      .flatMap((p) => (p.manualBlocks ?? []).map((b) => ({ date: p.date, block: b })));

    expect(week4Blocks.length).toBe(8);

    for (const item of week4Blocks) {
      const eventId = `${item.date}-${item.block.id}`;
      deviceAState.calendarEventProgress[eventId] = {
        status: 'done',
        updatedAt: '2026-09-10T18:00:00.000Z',
        isComplete: true,
      };
    }

    const deviceASnapshot = buildSnapshot(deviceAState);
    deviceASnapshot.exportedAt = '2026-09-10T18:00:00.000Z';

    // Device B opens fresh with default initial state (no progress, changeToken 0)
    const deviceBState = createInitialState('2026-08-20');
    const deviceBSnapshot = buildSnapshot(deviceBState);
    deviceBSnapshot.exportedAt = '2026-09-10T12:00:00.000Z';

    // Merge on Device B (base === null)
    const { merged, conflicts } = mergeSnapshots(null, deviceBSnapshot, deviceASnapshot);

    // Assert that Device A's 8 completed marks are preserved
    expect(Object.keys(merged.appState.calendarEventProgress).length).toBe(8);
    for (const item of week4Blocks) {
      const eventId = `${item.date}-${item.block.id}`;
      expect(merged.appState.calendarEventProgress[eventId]?.status).toBe('done');
    }

    // Assert that lastChangedAt is NOT bumped to future current time
    expect(merged.appState.meta.lastChangedAt).toBe('2026-09-10T18:00:00.000Z');

    // Assert that planSettings is preserved from Device A
    expect(merged.appState.planSettings.startDateChangeCount).toBe(1);

    // Assert no spurious conflicts for clean initial device
    expect(conflicts.filter((c) => c.path.startsWith('appState.planSettings')).length).toBe(0);
  });

  it('nao exibe pendencias para blocos concluidos na semana 4 apos sincronizacao', () => {
    const plans = buildDayPlans('2026-08-20', [], 0, '2026-09-11');

    // Simulating Device A's progress for Weeks 1-3 AND Week 4
    const progress: Record<string, CalendarEventProgress> = {};
    const allPastBlocks = plans
      .filter((p) => p.date < '2026-09-11' && !p.isRestDay)
      .flatMap((p) => (p.manualBlocks ?? []).map((b) => ({ date: p.date, block: b })));

    for (const item of allPastBlocks) {
      progress[`${item.date}-${item.block.id}`] = {
        status: 'done',
        updatedAt: '2026-09-10T20:00:00.000Z',
      };
    }

    const goals = { portugues: 30, rlm: 30, legislacao: 30, especificos: 30 };
    const pending = buildPendingStudyDecisions(plans, progress, {}, '2026-09-11', goals);

    expect(pending.length).toBe(0);
  });

  it('ignora blocos ja marcados como failed em manualBlockReschedules no Pendencias para fechar', () => {
    const plans = buildDayPlans('2026-08-20', [], 0, '2026-09-11');
    const pastPlan = plans.find((p) => p.date === '2026-09-10')!;
    const failedBlock = pastPlan.manualBlocks![0];

    const failures: ManualBlockReschedule[] = [
      {
        id: 'reschedule-1',
        failedAt: '2026-09-10',
        blockId: failedBlock.id,
        createdAt: '2026-09-10T20:00:00.000Z',
        block: failedBlock,
      },
    ];

    const goals = { portugues: 30, rlm: 30, legislacao: 30, especificos: 30 };
    const pending = buildPendingStudyDecisions(plans, {}, {}, '2026-09-11', goals, failures);

    // The failed block should NOT be in pending decisions
    const hasFailedBlockInPending = pending.some(
      (p) => p.date === '2026-09-10' && p.block.id === failedBlock.id,
    );
    expect(hasFailedBlockInPending).toBe(false);
  });

  it('lida com seguranca quando defaultQuestionGoals esta vazio ou incompleto', () => {
    const plans = buildDayPlans('2026-08-20');
    const incompleteGoals = {} as unknown as Record<'portugues' | 'rlm' | 'legislacao' | 'especificos', number>;
    expect(() => {
      buildPendingStudyDecisions(plans, {}, {}, '2026-09-11', incompleteGoals);
    }).not.toThrow();
  });

  it('preserva dispensas em lote entre dispositivos e elimina pendencias antigas', () => {
    const deviceAState = createInitialState('2026-08-20');
    const plans = buildDayPlans('2026-08-20');
    const olderBlocks = plans
      .filter((p) => p.date < '2026-09-06' && !p.isRestDay)
      .flatMap((p) => (p.manualBlocks ?? []).map((b) => `${p.date}-${b.id}`));

    // Device A marks all older blocks as dismissed
    for (const eventId of olderBlocks) {
      deviceAState.calendarEventProgress[eventId] = {
        status: 'dismissed',
        updatedAt: '2026-09-12T12:00:00.000Z',
      };
    }
    deviceAState.meta.changeToken = 5;
    deviceAState.meta.lastChangedAt = '2026-09-12T12:00:00.000Z';

    const remoteSnapshot = buildSnapshot(deviceAState);

    // Device B connects with initial empty state
    const deviceBState = createInitialState('2026-08-20');
    const localSnapshot = buildSnapshot(deviceBState);

    const { merged } = mergeSnapshots(null, localSnapshot, remoteSnapshot);

    // Merged state on Device B should have all older blocks dismissed
    for (const eventId of olderBlocks) {
      expect(merged.appState.calendarEventProgress[eventId]?.status).toBe('dismissed');
    }

    const goals = { portugues: 30, rlm: 30, legislacao: 30, especificos: 30 };
    const pendingOnB = buildPendingStudyDecisions(
      plans,
      merged.appState.calendarEventProgress,
      merged.appState.topicProgress,
      '2026-09-13',
      goals,
    );

    // None of the dismissed older blocks should be pending
    const hasOlderPending = pendingOnB.some((p) => p.date < '2026-09-06');
    expect(hasOlderPending).toBe(false);
  });
});
