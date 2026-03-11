import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { writeToFirestore } from '../../stores/firestoreSync';
import type { CompetitionDailyRecord } from '../../types';
import { useCompetitionStore } from '../../stores/competitionStore';

const createRecord = (date: string, score: number): CompetitionDailyRecord => ({
    date,
    projectDay: 1,
    score,
    maxScore: 500,
    theoreticalMaxScore: 1000,
    remainingScore: 500 - score,
    breakdown: [
        {
            id: 'questoes',
            label: 'Questoes',
            points: score,
            maxPoints: 500,
            remainingPoints: 500 - score,
            summary: 'Resumo',
            priority: 500 - score,
        },
    ],
    updatedAt: Date.now(),
});

describe('competitionStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useCompetitionStore.getState()._reset();
    });

    it('preserves previous daily snapshots when a new day is stored', () => {
        useCompetitionStore.getState()._hydrateFromFirestore(null);

        const dayOne = createRecord('2026-03-10', 220);
        const dayTwo = createRecord('2026-03-11', 340);

        useCompetitionStore.getState().upsertDailyRecord(dayOne);
        useCompetitionStore.getState().upsertDailyRecord(dayTwo);

        const records = useCompetitionStore.getState().competition.dailyRecords;

        expect(records[dayOne.date]?.score).toBe(220);
        expect(records[dayTwo.date]?.score).toBe(340);
        expect(useCompetitionStore.getState().competition.lastSyncedDate).toBe(dayTwo.date);
    });

    it('does not sync again when the daily hash is unchanged', () => {
        useCompetitionStore.getState()._hydrateFromFirestore(null);

        const original = createRecord('2026-03-10', 280);
        useCompetitionStore.getState().upsertDailyRecord(original);

        expect(writeToFirestore).toHaveBeenCalledTimes(1);

        vi.clearAllMocks();

        useCompetitionStore.getState().upsertDailyRecord({
            ...original,
            updatedAt: original.updatedAt + 9999,
        });

        expect(writeToFirestore).not.toHaveBeenCalled();
        expect(useCompetitionStore.getState().competition.dailyRecords[original.date]?.score).toBe(280);
    });
});
