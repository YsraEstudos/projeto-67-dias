import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

vi.mock('../../../../hooks/useStreakTracking', () => ({
    useStreakTracking: () => ({ trackActivity: vi.fn() }),
}));

import { useHabitsStore } from '../../../../stores/habitsStore';
import { useTasksManager } from '../../../../components/views/habits/hooks/useTasksManager';

describe('useTasksManager', () => {
    beforeEach(() => {
        useHabitsStore.getState()._reset();
        useHabitsStore.getState()._hydrateFromFirestore({ habits: [], tasks: [] });
    });

    afterEach(() => vi.useRealTimers());

    it('AI-generated due dates use the local calendar day (no UTC shift late at night)', () => {
        // 23:30 local: toISOString() would already be the next UTC day in UTC- zones
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 6, 10, 23, 30));

        const { result } = renderHook(() => useTasksManager());
        act(() => {
            result.current.handleAIGeneratedTasks([
                { title: 'Amanhã', category: 'Casa', daysFromNow: 1 },
                { title: 'Sem data', category: 'Casa' },
            ]);
        });

        const tasks = useHabitsStore.getState().tasks;
        expect(tasks.find(t => t.title === 'Amanhã')?.dueDate).toBe('2026-07-11');
        expect(tasks.find(t => t.title === 'Sem data')?.dueDate).toBeUndefined();
    });
});
