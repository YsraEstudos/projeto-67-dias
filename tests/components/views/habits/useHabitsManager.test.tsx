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
                createdAt: Date.parse('2026-01-01'),
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

    it('re-evaluates MIN_TIME completion when a negative correction drops below target', () => {
        useHabitsStore.setState({
            habits: [{
                id: 'h-min', title: 'Ler', category: 'Mente', frequency: 'DAILY', goalType: 'MIN_TIME',
                targetValue: 30, archived: false, createdAt: 0, history: {}, subHabits: [],
            }],
            _initialized: true,
        });

        const { result } = renderHook(() => useHabitsManager());
        act(() => { result.current.handleLogValue('h-min', 30); });
        let log = useHabitsStore.getState().habits[0].history[result.current.dateKey];
        expect(log.completed).toBe(true);

        act(() => { result.current.handleLogValue('h-min', -15); });
        log = useHabitsStore.getState().habits[0].history[result.current.dateKey];
        expect(log.value).toBe(15);
        expect(log.completed).toBe(false);

        // Totals never go negative
        act(() => { result.current.handleLogValue('h-min', -100); });
        log = useHabitsStore.getState().habits[0].history[result.current.dateKey];
        expect(log.value).toBe(0);
    });

    it('goToToday returns the date navigator to the current day', () => {
        const { result } = renderHook(() => useHabitsManager());
        const todayKey = result.current.dateKey;
        act(() => { result.current.changeDay(-3); });
        expect(result.current.dateKey).not.toBe(todayKey);
        act(() => { result.current.goToToday(); });
        expect(result.current.dateKey).toBe(todayKey);
    });
});
