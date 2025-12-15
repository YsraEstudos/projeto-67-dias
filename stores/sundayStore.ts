/**
 * Sunday Store - Sunday tasks with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SundayTask, SundaySubTask } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface SundayState {
    tasks: SundayTask[];
    isLoading: boolean;

    // Task Actions
    setTasks: (tasks: SundayTask[]) => void;
    addTask: (task: SundayTask) => void;
    updateTask: (id: string, updates: Partial<SundayTask>) => void;
    deleteTask: (id: string) => void;
    archiveTask: (id: string) => void;
    restoreTask: (id: string) => void;

    // SubTask Actions
    addSubTask: (taskId: string, subTask: SundaySubTask) => void;
    updateSubTask: (taskId: string, subTaskId: string, updates: Partial<SundaySubTask>) => void;
    deleteSubTask: (taskId: string, subTaskId: string) => void;
    toggleSubTaskComplete: (taskId: string, subTaskId: string) => void;

    setLoading: (loading: boolean) => void;
}

export const useSundayStore = create<SundayState>()(
    persist(
        (set) => ({
            tasks: [],
            isLoading: true,

            // Task Actions
            setTasks: (tasks) => set({ tasks }),

            addTask: (task) => set((state) => ({
                tasks: [...state.tasks, task]
            })),

            updateTask: (id, updates) => set((state) => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            deleteTask: (id) => set((state) => ({
                tasks: state.tasks.filter(t => t.id !== id)
            })),

            archiveTask: (id) => set((state) => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, isArchived: true } : t)
            })),

            restoreTask: (id) => set((state) => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, isArchived: false } : t)
            })),

            // SubTask Actions
            addSubTask: (taskId, subTask) => set((state) => ({
                tasks: state.tasks.map(t => {
                    if (t.id !== taskId) return t;
                    return { ...t, subTasks: [...t.subTasks, subTask] };
                })
            })),

            updateSubTask: (taskId, subTaskId, updates) => set((state) => ({
                tasks: state.tasks.map(t => {
                    if (t.id !== taskId) return t;
                    return {
                        ...t,
                        subTasks: t.subTasks.map(s => s.id === subTaskId ? { ...s, ...updates } : s)
                    };
                })
            })),

            deleteSubTask: (taskId, subTaskId) => set((state) => ({
                tasks: state.tasks.map(t => {
                    if (t.id !== taskId) return t;
                    return {
                        ...t,
                        subTasks: t.subTasks.filter(s => s.id !== subTaskId)
                    };
                })
            })),

            toggleSubTaskComplete: (taskId, subTaskId) => set((state) => ({
                tasks: state.tasks.map(t => {
                    if (t.id !== taskId) return t;
                    return {
                        ...t,
                        subTasks: t.subTasks.map(s =>
                            s.id === subTaskId ? { ...s, isCompleted: !s.isCompleted } : s
                        )
                    };
                })
            })),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_sunday_store',
            storage: createFirebaseStorage('p67_sunday_store'),
            partialize: (state) => ({ tasks: state.tasks }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate tasks (same id)
                if (state?.tasks?.length) {
                    const seen = new Set<string>();
                    const uniqueTasks = state.tasks.filter(t => {
                        if (seen.has(t.id)) return false;
                        seen.add(t.id);
                        return true;
                    });
                    if (uniqueTasks.length !== state.tasks.length) {
                        state.setTasks(uniqueTasks);
                    }
                }
                state?.setLoading(false);
            },
        }
    )
);
