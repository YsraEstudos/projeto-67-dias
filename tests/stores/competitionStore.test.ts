import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { writeToFirestore } from '../../stores/firestoreSync';
import type { CompetitionDailyRecord } from '../../types';
import { useCompetitionStore } from '../../stores/competitionStore';
import { calculateAdaptiveCompetitionMetrics } from '../../utils/competitionEngine';

const createRecord = (date: string, activityScore: number): CompetitionDailyRecord => {
    const metrics = calculateAdaptiveCompetitionMetrics(activityScore, 500);

    return ({
    date,
    projectDay: 1,
    score: metrics.score,
    activityScore: metrics.activityScore,
    maxScore: 500,
    theoreticalMaxScore: 1000,
    completionRate: metrics.completionRate,
    availabilityRate: metrics.availabilityRate,
    difficultyMultiplier: metrics.difficultyMultiplier,
    remainingScore: metrics.remainingScore,
    breakdown: [
        {
            id: 'questoes',
            label: 'Questoes',
            points: activityScore,
            maxPoints: 500,
            remainingPoints: 500 - activityScore,
            summary: 'Resumo',
            priority: 500 - activityScore,
        },
    ],
    updatedAt: Date.now(),
    });
};

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

        expect(records[dayOne.date]?.activityScore).toBe(220);
        expect(records[dayTwo.date]?.activityScore).toBe(340);
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
        expect(useCompetitionStore.getState().competition.dailyRecords[original.date]?.activityScore).toBe(280);
    });

    it('migrates legacy records to adaptive championship fields during hydration', () => {
        useCompetitionStore.getState()._hydrateFromFirestore({
            competition: {
                competitionStartedAt: Date.now(),
                engineVersion: 'legacy-version',
                dailyRecords: {
                    '2026-03-10': {
                        date: '2026-03-10',
                        projectDay: 1,
                        score: 280,
                        maxScore: 500,
                        theoreticalMaxScore: 1000,
                        remainingScore: 220,
                        breakdown: [
                            {
                                id: 'questoes',
                                label: 'Questoes',
                                points: 280,
                                maxPoints: 500,
                                remainingPoints: 220,
                                summary: 'Resumo',
                                priority: 220,
                            },
                        ],
                        updatedAt: Date.now(),
                    } as CompetitionDailyRecord,
                },
                lastSyncedDate: '2026-03-10',
            },
        });

        const hydrated = useCompetitionStore.getState().competition.dailyRecords['2026-03-10'];
        const metrics = calculateAdaptiveCompetitionMetrics(280, 500);

        expect(hydrated.activityScore).toBe(280);
        expect(hydrated.score).toBe(metrics.score);
        expect(hydrated.completionRate).toBe(metrics.completionRate);
        expect(hydrated.availabilityRate).toBe(metrics.availabilityRate);
        expect(hydrated.difficultyMultiplier).toBe(metrics.difficultyMultiplier);
    });
});
