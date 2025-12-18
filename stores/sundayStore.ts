/**
 * Sunday Store - Sunday tasks with Firestore-first persistence
 */
import { create } from 'zustand';
import { SundayTask, SundaySubTask } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_sunday_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface SundayState {
    tasks: SundayTask[];
    isLoading: boolean;
    _initialized: boolean;

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

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { tasks: SundayTask[] } | null) => void;
    _reset: () => void;
}

export const useSundayStore = create<SundayState>()((set, get) => ({
    tasks: [],
    isLoading: true,
    _initialized: false,

    setTasks: (tasks) => {
        set({ tasks: deduplicateById(tasks) });
        get()._syncToFirestore();
    },

    addTask: (task) => {
        set((state) => ({ tasks: [...state.tasks, task] }));
        get()._syncToFirestore();
    },

    updateTask: (id, updates) => {
        set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        get()._syncToFirestore();
    },

    deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }));
        get()._syncToFirestore();
    },

    archiveTask: (id) => {
        set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, isArchived: true } : t)
        }));
        get()._syncToFirestore();
    },

    restoreTask: (id) => {
        set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, isArchived: false } : t)
        }));
        get()._syncToFirestore();
    },

    addSubTask: (taskId, subTask) => {
        set((state) => ({
            tasks: state.tasks.map(t => {
                if (t.id !== taskId) return t;
                return { ...t, subTasks: [...t.subTasks, subTask] };
            })
        }));
        get()._syncToFirestore();
    },

    updateSubTask: (taskId, subTaskId, updates) => {
        set((state) => ({
            tasks: state.tasks.map(t => {
                if (t.id !== taskId) return t;
                return {
                    ...t,
                    subTasks: t.subTasks.map(s => s.id === subTaskId ? { ...s, ...updates } : s)
                };
            })
        }));
        get()._syncToFirestore();
    },

    deleteSubTask: (taskId, subTaskId) => {
        set((state) => ({
            tasks: state.tasks.map(t => {
                if (t.id !== taskId) return t;
                return { ...t, subTasks: t.subTasks.filter(s => s.id !== subTaskId) };
            })
        }));
        get()._syncToFirestore();
    },

    toggleSubTaskComplete: (taskId, subTaskId) => {
        set((state) => ({
            tasks: state.tasks.map(t => {
                if (t.id !== taskId) return t;
                return {
                    ...t,
                    subTasks: t.subTasks.map(s =>
                        s.id === subTaskId ? { ...s, isCompleted: !s.isCompleted } : s
                    )
                };
            })
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { tasks, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { tasks });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                tasks: deduplicateById(data.tasks || []),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ tasks: [], isLoading: true, _initialized: false });
    }
}));
