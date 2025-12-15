/**
 * Habits Store - Habits and Tasks with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Habit, OrganizeTask, HabitLog } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface HabitsState {
    habits: Habit[];
    tasks: OrganizeTask[];
    isLoading: boolean;

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
}

export const useHabitsStore = create<HabitsState>()(
    persist(
        (set, get) => ({
            habits: [],
            tasks: [],
            isLoading: true,

            // Habit Actions
            setHabits: (habits) => set({ habits }),

            addHabit: (habit) => set((state) => ({
                habits: [...state.habits, habit]
            })),

            updateHabit: (id, updates) => set((state) => ({
                habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
            })),

            deleteHabit: (id) => set((state) => ({
                habits: state.habits.filter(h => h.id !== id)
            })),

            archiveHabit: (id) => set((state) => ({
                habits: state.habits.map(h => h.id === id ? { ...h, archived: true } : h)
            })),

            toggleHabitCompletion: (habitId, date, subHabitId) => set((state) => ({
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
            })),

            logHabitValue: (habitId, date, value) => set((state) => ({
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
            })),

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

            toggleTaskComplete: (id) => set((state) => ({
                tasks: state.tasks.map(t =>
                    t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
                )
            })),

            archiveTask: (id) => set((state) => ({
                tasks: state.tasks.map(t =>
                    t.id === id ? { ...t, isArchived: true } : t
                )
            })),

            restoreTask: (id) => set((state) => ({
                tasks: state.tasks.map(t =>
                    t.id === id ? { ...t, isArchived: false } : t
                )
            })),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_habits_store',
            storage: createFirebaseStorage('p67_habits_store'),
            partialize: (state) => ({ habits: state.habits, tasks: state.tasks }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate habits (same id)
                if (state?.habits?.length) {
                    const seen = new Set<string>();
                    const uniqueHabits = state.habits.filter(h => {
                        if (seen.has(h.id)) return false;
                        seen.add(h.id);
                        return true;
                    });
                    if (uniqueHabits.length !== state.habits.length) {
                        state.setHabits(uniqueHabits);
                    }
                }
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
