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
                createdAt: Date.parse('2026-01-01'),
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
                createdAt: Date.parse('2026-01-01'),
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

    it('does not crash on legacy habits missing history/subHabits/subHabitsCompleted', () => {
        useHabitsStore.setState({
            habits: [
                // legacy: no history map, no subHabits array
                { id: 'legacy-1', title: 'Antigo', category: 'Saúde', archived: false, createdAt: 0 } as any,
                // partial log without subHabitsCompleted
                {
                    id: 'legacy-2', title: 'Parcial', category: 'Saúde', archived: false, createdAt: 0,
                    subHabits: [{ id: 's1', title: 'Passo' }],
                    history: { '2026-07-27': { completed: false } },
                } as any,
            ],
            _initialized: true,
        });

        expect(() => useHabitsStore.getState().toggleHabitCompletion('legacy-1', '2026-07-27')).not.toThrow();
        expect(useHabitsStore.getState().habits[0].history['2026-07-27'].completed).toBe(true);

        expect(() => useHabitsStore.getState().toggleHabitCompletion('legacy-2', '2026-07-27', 's1')).not.toThrow();
        const log = useHabitsStore.getState().habits[1].history['2026-07-27'];
        expect(log.subHabitsCompleted).toEqual(['s1']);
        expect(log.completed).toBe(true);

        expect(() => useHabitsStore.getState().logHabitValue('legacy-1', '2026-07-28', 10)).not.toThrow();
        expect(useHabitsStore.getState().habits[0].history['2026-07-28'].value).toBe(10);
    });
});
