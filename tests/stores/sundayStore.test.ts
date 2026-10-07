import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useSundayStore } from '../../stores/sundayStore';
import { writeToFirestore } from '../../stores/firestoreSync';

describe('sundayStore - startNewWeek', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSundayStore.getState()._reset();
        useSundayStore.getState()._hydrateFromFirestore({
            tasks: [
                {
                    id: 't1', title: 'Casa', isArchived: true, createdAt: 1,
                    subTasks: [
                        { id: 's1', title: 'Lavar roupa', isCompleted: true },
                        { id: 's2', title: 'Varrer', isCompleted: false },
                    ],
                },
                { id: 't2', title: 'Agenda', isArchived: false, createdAt: 2, subTasks: [] },
            ],
        });
    });

    it('restores archived tasks and unchecks all subtasks, then syncs', () => {
        useSundayStore.getState().startNewWeek();

        const { tasks } = useSundayStore.getState();
        expect(tasks.every(t => !t.isArchived)).toBe(true);
        expect(tasks[0].subTasks.every(s => !s.isCompleted)).toBe(true);
        expect(tasks[0].subTasks.map(s => s.title)).toEqual(['Lavar roupa', 'Varrer']);
        expect(writeToFirestore).toHaveBeenCalledWith('p67_sunday_store', { tasks });
    });
});
