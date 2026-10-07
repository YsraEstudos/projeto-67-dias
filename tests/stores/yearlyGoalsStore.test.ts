import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useGoalsStore } from '../../stores/goalsStore';
import { YearlyGoal } from '../../types';

const makeGoal = (overrides: Partial<YearlyGoal> = {}): YearlyGoal => ({
    id: 'goal-1',
    title: 'Meta',
    year: 2026,
    status: 'ACTIVE',
    priority: 'MEDIUM',
    links: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
});

describe('goalsStore (metas anuais)', () => {
    beforeEach(() => {
        useGoalsStore.getState()._reset();
        useGoalsStore.getState()._hydrateFromFirestore(null);
    });

    it('addGoal does not create duplicates with the same id', () => {
        useGoalsStore.getState().addGoal(makeGoal());
        useGoalsStore.getState().addGoal(makeGoal());
        expect(useGoalsStore.getState().goals).toHaveLength(1);
    });

    it('keeps the original achievedAt when re-marking an achieved goal', () => {
        useGoalsStore.getState().addGoal(makeGoal());
        useGoalsStore.getState().setGoalStatus('goal-1', 'ACHIEVED');
        const firstAchievedAt = useGoalsStore.getState().goals[0].achievedAt;
        expect(firstAchievedAt).toBeTypeOf('number');

        useGoalsStore.setState((state) => ({
            goals: state.goals.map((g) => ({ ...g, achievedAt: 12345 })),
        }));
        useGoalsStore.getState().setGoalStatus('goal-1', 'ACHIEVED');
        expect(useGoalsStore.getState().goals[0].achievedAt).toBe(12345);

        useGoalsStore.getState().setGoalStatus('goal-1', 'ACTIVE');
        expect(useGoalsStore.getState().goals[0].achievedAt).toBeUndefined();
    });
});
