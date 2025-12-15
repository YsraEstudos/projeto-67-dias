/**
 * Work Goals Slice - Goal management
 */
import { StateCreator } from 'zustand';

export interface WorkGoals {
    daily: number;
    weekly: number;
    ultra: number;
    anki: number;
    ncm: number;
}

export const DEFAULT_GOALS: WorkGoals = {
    daily: 300,
    weekly: 125,
    ultra: 250,
    anki: 15,
    ncm: 20
};

export interface GoalsSlice {
    goals: WorkGoals;
    setGoals: (goals: Partial<WorkGoals>) => void;
}

export const createGoalsSlice: StateCreator<
    GoalsSlice,
    [],
    [],
    GoalsSlice
> = (set) => ({
    goals: DEFAULT_GOALS,

    setGoals: (updates) => set((state) => ({
        goals: { ...state.goals, ...updates }
    })),
});
