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
import { immer } from 'zustand/middleware/immer';
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

export const useHabitsStore = create<HabitsState>()(immer((set, get) => ({
    habits: [],
    tasks: [],
    isLoading: true,
    _initialized: false,

    // Habit Actions
    setHabits: (habits) => {
        set((state) => { state.habits = deduplicateById(habits); });
        get()._syncToFirestore();
    },

    addHabit: (habit) => {
        set((state) => { state.habits.push(habit); });
        get()._syncToFirestore();
    },

    updateHabit: (id, updates) => {
        set((state) => {
            const habit = state.habits.find(h => h.id === id);
            if (habit) Object.assign(habit, updates);
        });
        get()._syncToFirestore();
    },

    deleteHabit: (id) => {
        set((state) => {
            const idx = state.habits.findIndex(h => h.id === id);
            if (idx !== -1) state.habits.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    archiveHabit: (id) => {
        set((state) => {
            const habit = state.habits.find(h => h.id === id);
            if (habit) habit.archived = true;
        });
        get()._syncToFirestore();
    },

    toggleHabitCompletion: (habitId, date, subHabitId) => {
        set((state) => {
            const habit = state.habits.find(h => h.id === habitId);
            if (!habit) return;

            if (!habit.history[date]) {
                habit.history[date] = { completed: false, subHabitsCompleted: [] };
            }
            const log = habit.history[date];

            if (subHabitId) {
                // Toggle sub-habit
                const idx = log.subHabitsCompleted.indexOf(subHabitId);
                if (idx >= 0) {
                    log.subHabitsCompleted.splice(idx, 1);
                } else {
                    log.subHabitsCompleted.push(subHabitId);
                }
                // Check if all sub-habits are completed
                log.completed = habit.subHabits.length > 0 &&
                    habit.subHabits.every(s => log.subHabitsCompleted.includes(s.id));
            } else {
                // Toggle main habit
                log.completed = !log.completed;
            }
        });
        get()._syncToFirestore();
    },

    logHabitValue: (habitId, date, value) => {
        set((state) => {
            const habit = state.habits.find(h => h.id === habitId);
            if (!habit) return;

            if (!habit.history[date]) {
                habit.history[date] = { completed: false, subHabitsCompleted: [] };
            }
            const log = habit.history[date];
            log.value = value;

            // Determine if completed based on goal type
            if (habit.goalType === 'MAX_TIME' && habit.targetValue) {
                log.completed = value <= habit.targetValue;
            } else if (habit.goalType === 'MIN_TIME' && habit.targetValue) {
                log.completed = value >= habit.targetValue;
            }
        });
        get()._syncToFirestore();
    },

    // Task Actions
    setTasks: (tasks) => {
        set((state) => { state.tasks = deduplicateById(tasks); });
        get()._syncToFirestore();
    },

    addTask: (task) => {
        set((state) => { state.tasks.push(task); });
        get()._syncToFirestore();
    },

    updateTask: (id, updates) => {
        set((state) => {
            const task = state.tasks.find(t => t.id === id);
            if (task) Object.assign(task, updates);
        });
        get()._syncToFirestore();
    },

    deleteTask: (id) => {
        set((state) => {
            const idx = state.tasks.findIndex(t => t.id === id);
            if (idx !== -1) state.tasks.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    toggleTaskComplete: (id) => {
        set((state) => {
            const task = state.tasks.find(t => t.id === id);
            if (task) task.isCompleted = !task.isCompleted;
        });
        get()._syncToFirestore();
    },

    archiveTask: (id) => {
        set((state) => {
            const task = state.tasks.find(t => t.id === id);
            if (task) task.isArchived = true;
        });
        get()._syncToFirestore();
    },

    restoreTask: (id) => {
        set((state) => {
            const task = state.tasks.find(t => t.id === id);
            if (task) task.isArchived = false;
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

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
            set((state) => {
                state.habits = deduplicateById(data.habits || []);
                state.tasks = deduplicateById(data.tasks || []);
                state.isLoading = false;
                state._initialized = true;
            });
        } else {
            // No cloud data - first time user or empty
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
        }
    },

    // Internal: Reset store (for user switch)
    _reset: () => {
        set((state) => {
            state.habits = [];
            state.tasks = [];
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));
