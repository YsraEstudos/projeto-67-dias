import { beforeEach, describe, expect, it, vi } from 'vitest';

const { writeToFirestoreMock } = vi.hoisted(() => ({
    writeToFirestoreMock: vi.fn(),
}));

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: writeToFirestoreMock,
}));

import { useHabitsStore } from '../../stores/habitsStore';

describe('habitsStore atomic mutations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useHabitsStore.getState()._reset();
        useHabitsStore.getState()._hydrateFromFirestore({ habits: [], tasks: [] });
        vi.clearAllMocks();
    });

    it('toggles parent habit and all sub-habits atomically with exactly one sync call', () => {
        useHabitsStore.setState({
            habits: [{
                id: 'h-1',
                title: 'Exercício',
                category: 'Saúde',
                frequency: 'DAILY',
                goalType: 'BOOLEAN',
                archived: false,
                createdAt: '2026-01-01',
                history: {},
                subHabits: [
                    { id: 'sub-1', title: 'Flexões' },
                    { id: 'sub-2', title: 'Agachamentos' },
                ],
            }],
            _initialized: true,
        });

        // Toggle main habit
        useHabitsStore.getState().toggleHabitCompletion('h-1', '2026-07-27');

        const habit = useHabitsStore.getState().habits[0];
        const log = habit.history['2026-07-27'];

        expect(log).toBeDefined();
        expect(log.completed).toBe(true);
        expect(log.subHabitsCompleted).toEqual(['sub-1', 'sub-2']);

        // Assert exactly one write to Firestore
        expect(writeToFirestoreMock).toHaveBeenCalledTimes(1);
    });

    it('toggles sub-habit individually and auto-completes parent when all sub-habits are done', () => {
        useHabitsStore.setState({
            habits: [{
                id: 'h-1',
                title: 'Estudar',
                category: 'Estudo',
                frequency: 'DAILY',
                goalType: 'BOOLEAN',
                archived: false,
                createdAt: '2026-01-01',
                history: {},
                subHabits: [
                    { id: 'sub-1', title: 'Ler 10 pgs' },
                    { id: 'sub-2', title: 'Resumo' },
                ],
            }],
            _initialized: true,
        });

        // Toggle sub-1
        useHabitsStore.getState().toggleHabitCompletion('h-1', '2026-07-27', 'sub-1');
        let log = useHabitsStore.getState().habits[0].history['2026-07-27'];
        expect(log.completed).toBe(false);
        expect(log.subHabitsCompleted).toEqual(['sub-1']);

        // Toggle sub-2 -> all done -> parent completes
        useHabitsStore.getState().toggleHabitCompletion('h-1', '2026-07-27', 'sub-2');
        log = useHabitsStore.getState().habits[0].history['2026-07-27'];
        expect(log.completed).toBe(true);
        expect(log.subHabitsCompleted).toEqual(['sub-1', 'sub-2']);

        expect(writeToFirestoreMock).toHaveBeenCalledTimes(2);
    });
});
