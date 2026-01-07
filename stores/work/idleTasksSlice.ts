/**
 * Idle Tasks Slice - Tasks/Habits selected for idle time at work
 * 
 * Allows selecting tasks and habits from HabitsStore to complete
 * during idle moments at work. Completing them marks them done
 * in the original store and awards configurable points.
 */
import { StateCreator } from 'zustand';
import { IdleTask } from '../../types';

export const DEFAULT_IDLE_TASK_POINTS = 5;

export interface IdleTasksSlice {
    // Selected tasks for today
    selectedIdleTasks: IdleTask[];

    // Actions
    addIdleTask: (task: Omit<IdleTask, 'id' | 'addedAt'>) => void;
    removeIdleTask: (id: string) => void;
    updateIdleTaskPoints: (id: string, points: number) => void;
    clearIdleTasks: () => void;
}

export const createIdleTasksSlice: StateCreator<
    IdleTasksSlice,
    [],
    [],
    IdleTasksSlice
> = (set) => ({
    selectedIdleTasks: [],

    addIdleTask: (task) => set((state) => {
        // Check if already added (prevent duplicates)
        const exists = state.selectedIdleTasks.some(
            t => t.sourceType === task.sourceType && t.sourceId === task.sourceId
        );
        if (exists) return state;

        const newTask: IdleTask = {
            ...task,
            id: `idle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            addedAt: Date.now(),
        };
        return { selectedIdleTasks: [...state.selectedIdleTasks, newTask] };
    }),

    removeIdleTask: (id) => set((state) => ({
        selectedIdleTasks: state.selectedIdleTasks.filter(t => t.id !== id)
    })),

    updateIdleTaskPoints: (id, points) => set((state) => ({
        selectedIdleTasks: state.selectedIdleTasks.map(t =>
            t.id === id ? { ...t, points: Math.max(0, points) } : t
        )
    })),

    clearIdleTasks: () => set(() => ({
        selectedIdleTasks: []
    })),
});
