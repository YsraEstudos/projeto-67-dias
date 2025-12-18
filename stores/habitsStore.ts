/**
 * Habits Store - Habits and Tasks with Firestore-first persistence
 * 
 * Architecture:
 * - Zustand manages in-memory state for UI reactivity
 * - Every mutation triggers a Firestore write (debounced)
 * - Initial data comes from Firestore subscription in App.tsx
 * - No more LocalStorage cache - Firestore SDK handles offline via IndexedDB
 */
import { create } from 'zustand';
import { Habit, OrganizeTask, HabitLog } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_habits_store';

interface HabitsState {
    habits: Habit[];
    tasks: OrganizeTask[];
    isLoading: boolean;
    _initialized: boolean;

    // Habit Actions
    setHabits: (habits: Habit[]) => void;
    addHabit: (habit: Habit) => void;
    updateHabit: (id: string, updates: Partial<Habit>) => void;
    deleteHabit: (id: string) => void;
    archiveHabit: (id: string) => void;
    toggleHabitCompletion: (habitId: string, date: string, subHabitId?: string) => void;
    logHabitValue: (habitId: string, date: string, value: number) => void;

    // Task Actions
    setTasks: (tasks: OrganizeTask[]) => void;
    addTask: (task: OrganizeTask) => void;
    updateTask: (id: string, updates: Partial<OrganizeTask>) => void;
    deleteTask: (id: string) => void;
    toggleTaskComplete: (id: string) => void;
    archiveTask: (id: string) => void;
    restoreTask: (id: string) => void;

    setLoading: (loading: boolean) => void;

    // Internal sync methods
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { habits: Habit[]; tasks: OrganizeTask[] } | null) => void;
    _reset: () => void;
}

/**
 * Deduplicate items by ID (fixes any data corruption from legacy sync)
 */
const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

export const useHabitsStore = create<HabitsState>()((set, get) => ({
    habits: [],
    tasks: [],
    isLoading: true,
    _initialized: false,

    // Habit Actions
    setHabits: (habits) => {
        set({ habits: deduplicateById(habits) });
        get()._syncToFirestore();
    },

    addHabit: (habit) => {
        set((state) => ({
            habits: [...state.habits, habit]
        }));
        get()._syncToFirestore();
    },

    updateHabit: (id, updates) => {
        set((state) => ({
            habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
        }));
        get()._syncToFirestore();
    },

    deleteHabit: (id) => {
        set((state) => ({
            habits: state.habits.filter(h => h.id !== id)
        }));
        get()._syncToFirestore();
    },

    archiveHabit: (id) => {
        set((state) => ({
            habits: state.habits.map(h => h.id === id ? { ...h, archived: true } : h)
        }));
        get()._syncToFirestore();
    },

    toggleHabitCompletion: (habitId, date, subHabitId) => {
        set((state) => ({
            habits: state.habits.map(habit => {
                if (habit.id !== habitId) return habit;

                const currentLog: HabitLog = habit.history[date] || {
                    completed: false,
                    subHabitsCompleted: []
                };

                if (subHabitId) {
                    // Toggle sub-habit
                    const subCompleted = currentLog.subHabitsCompleted.includes(subHabitId)
                        ? currentLog.subHabitsCompleted.filter(id => id !== subHabitId)
                        : [...currentLog.subHabitsCompleted, subHabitId];

                    // Check if all sub-habits are completed
                    const allSubsCompleted = habit.subHabits.length > 0 &&
                        habit.subHabits.every(s => subCompleted.includes(s.id));

                    return {
                        ...habit,
                        history: {
                            ...habit.history,
                            [date]: {
                                ...currentLog,
                                subHabitsCompleted: subCompleted,
                                completed: allSubsCompleted
                            }
                        }
                    };
                } else {
                    // Toggle main habit
                    return {
                        ...habit,
                        history: {
                            ...habit.history,
                            [date]: {
                                ...currentLog,
                                completed: !currentLog.completed
                            }
                        }
                    };
                }
            })
        }));
        get()._syncToFirestore();
    },

    logHabitValue: (habitId, date, value) => {
        set((state) => ({
            habits: state.habits.map(habit => {
                if (habit.id !== habitId) return habit;

                const currentLog: HabitLog = habit.history[date] || {
                    completed: false,
                    subHabitsCompleted: []
                };

                // Determine if completed based on goal type
                let completed = false;
                if (habit.goalType === 'MAX_TIME' && habit.targetValue) {
                    completed = value <= habit.targetValue;
                } else if (habit.goalType === 'MIN_TIME' && habit.targetValue) {
                    completed = value >= habit.targetValue;
                }

                return {
                    ...habit,
                    history: {
                        ...habit.history,
                        [date]: {
                            ...currentLog,
                            value,
                            completed
                        }
                    }
                };
            })
        }));
        get()._syncToFirestore();
    },

    // Task Actions
    setTasks: (tasks) => {
        set({ tasks: deduplicateById(tasks) });
        get()._syncToFirestore();
    },

    addTask: (task) => {
        set((state) => ({
            tasks: [...state.tasks, task]
        }));
        get()._syncToFirestore();
    },

    updateTask: (id, updates) => {
        set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        get()._syncToFirestore();
    },

    deleteTask: (id) => {
        set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));
        get()._syncToFirestore();
    },

    toggleTaskComplete: (id) => {
        set((state) => ({
            tasks: state.tasks.map(t =>
                t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
            )
        }));
        get()._syncToFirestore();
    },

    archiveTask: (id) => {
        set((state) => ({
            tasks: state.tasks.map(t =>
                t.id === id ? { ...t, isArchived: true } : t
            )
        }));
        get()._syncToFirestore();
    },

    restoreTask: (id) => {
        set((state) => ({
            tasks: state.tasks.map(t =>
                t.id === id ? { ...t, isArchived: false } : t
            )
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    // Internal: Sync current state to Firestore
    _syncToFirestore: () => {
        const { habits, tasks, _initialized } = get();
        // Only sync if we've been initialized (prevents overwriting cloud data on startup)
        if (_initialized) {
            writeToFirestore(STORE_KEY, { habits, tasks });
        }
    },

    // Internal: Hydrate from Firestore data (called by App.tsx subscription)
    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                habits: deduplicateById(data.habits || []),
                tasks: deduplicateById(data.tasks || []),
                isLoading: false,
                _initialized: true
            });
        } else {
            // No cloud data - first time user or empty
            set({
                isLoading: false,
                _initialized: true
            });
        }
    },

    // Internal: Reset store (for user switch)
    _reset: () => {
        set({
            habits: [],
            tasks: [],
            isLoading: true,
            _initialized: false
        });
    }
}));
