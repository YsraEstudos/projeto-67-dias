import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { writeToFirestoreMock, trackActivityMock } = vi.hoisted(() => ({
    writeToFirestoreMock: vi.fn(),
    trackActivityMock: vi.fn(),
}));

vi.mock('../../../../stores/firestoreSync', () => ({
    writeToFirestore: writeToFirestoreMock,
}));

vi.mock('../../../../hooks/useStreakTracking', () => ({
    useStreakTracking: () => ({ trackActivity: trackActivityMock }),
}));

import { useHabitsStore } from '../../../../stores/habitsStore';
import { useHabitsManager } from '../../../../components/views/habits/hooks/useHabitsManager';

describe('useHabitsManager hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useHabitsStore.getState()._reset();
        useHabitsStore.getState()._hydrateFromFirestore({ habits: [], tasks: [] });
        vi.clearAllMocks();
    });

    it('triggers a single atomic mutation when toggled via manager hook', () => {
        useHabitsStore.setState({
            habits: [{
                id: 'h-mgr-1',
                title: 'Meditar',
                category: 'Mente',
                frequency: 'DAILY',
                goalType: 'BOOLEAN',
                archived: false,
                createdAt: '2026-01-01',
                history: {},
                subHabits: [
                    { id: 'sub-a', title: 'Respiração' }
                ],
            }],
            _initialized: true,
        });

        const { result } = renderHook(() => useHabitsManager());

        act(() => {
            result.current.handleToggleHabitCompletion('h-mgr-1');
        });

        // Exactly 1 writeToFirestore call and 1 trackActivity call
        expect(writeToFirestoreMock).toHaveBeenCalledTimes(1);
        expect(trackActivityMock).toHaveBeenCalledTimes(1);

        const updatedHabit = useHabitsStore.getState().habits[0];
        const dateKey = result.current.dateKey;
        expect(updatedHabit.history[dateKey].completed).toBe(true);
        expect(updatedHabit.history[dateKey].subHabitsCompleted).toEqual(['sub-a']);
    });
});
