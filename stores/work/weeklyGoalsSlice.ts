/**
 * Weekly Goals Slice - Gerenciamento de metas semanais
 * 
 * Armazena metas por semana (ISO week key) com herança automática:
 * - Se a semana atual não tem meta, herda da semana anterior
 * - Busca retroativamente até encontrar ou usar valor padrão
 */
import { StateCreator } from 'zustand';
import type { WeeklyGoalEntry } from '../../components/views/work/types';
import { getISOWeekKey, getPreviousWeekKey } from '../../components/views/work/utils/weekUtils';

export const DEFAULT_WEEKLY_GOAL = 300; // Meta padrão semanal
export const DEFAULT_WEEKLY_WORK_DAYS = 7;
const MAX_WEEKS_LOOKBACK = 52; // Máximo de semanas para buscar herança

export interface WeeklyGoalsSlice {
    weeklyGoals: Record<string, WeeklyGoalEntry>; // Chave: week key (ex: "2024-W52")

    // Actions
    setWeeklyGoal: (weekKey: string, goal: number) => void;
    setWeeklyWorkDays: (weekKey: string, workDays: number) => void;
    getWeeklyGoal: (weekKey?: string) => number;
    getWeeklyWorkDays: (weekKey?: string) => number;
    getCurrentWeekGoal: () => number;
    getCurrentWeekWorkDays: () => number;
}

export const createWeeklyGoalsSlice: StateCreator<
    WeeklyGoalsSlice,
    [],
    [],
    WeeklyGoalsSlice
> = (set, get) => ({
    weeklyGoals: {},

    setWeeklyGoal: (weekKey, goal) => {
        const now = Date.now();
        const currentEntry = get().weeklyGoals[weekKey];
        set((state) => ({
            weeklyGoals: {
                ...state.weeklyGoals,
                [weekKey]: {
                    weekKey,
                    goal,
                    workDays: currentEntry?.workDays,
                    createdAt: currentEntry?.createdAt || now,
                    updatedAt: now,
                },
            },
        }));
    },

    setWeeklyWorkDays: (weekKey, workDays) => {
        const now = Date.now();
        const currentEntry = get().weeklyGoals[weekKey];
        set((state) => ({
            weeklyGoals: {
                ...state.weeklyGoals,
                [weekKey]: {
                    weekKey,
                    goal: currentEntry?.goal ?? get().getWeeklyGoal(weekKey),
                    workDays: Math.max(1, Math.min(7, Math.round(workDays))),
                    createdAt: currentEntry?.createdAt || now,
                    updatedAt: now,
                },
            },
        }));
    },

    getWeeklyGoal: (weekKey?: string) => {
        const key = weekKey || getISOWeekKey();
        const { weeklyGoals } = get();

        // 1. Tentar meta da semana solicitada
        if (weeklyGoals[key]) {
            return weeklyGoals[key].goal;
        }

        // 2. Buscar semana anterior (herança)
        let prevKey = getPreviousWeekKey(key);
        let iterations = 0;

        while (iterations < MAX_WEEKS_LOOKBACK) {
            if (weeklyGoals[prevKey]) {
                return weeklyGoals[prevKey].goal;
            }
            prevKey = getPreviousWeekKey(prevKey);
            iterations++;
        }

        // 3. Fallback para padrão
        return DEFAULT_WEEKLY_GOAL;
    },

    getWeeklyWorkDays: (weekKey?: string) => {
        const key = weekKey || getISOWeekKey();
        const { weeklyGoals } = get();

        if (weeklyGoals[key]?.workDays) {
            return weeklyGoals[key].workDays;
        }

        let prevKey = getPreviousWeekKey(key);
        let iterations = 0;

        while (iterations < MAX_WEEKS_LOOKBACK) {
            if (weeklyGoals[prevKey]?.workDays) {
                return weeklyGoals[prevKey].workDays;
            }
            prevKey = getPreviousWeekKey(prevKey);
            iterations++;
        }

        return DEFAULT_WEEKLY_WORK_DAYS;
    },

    getCurrentWeekGoal: () => {
        return get().getWeeklyGoal(getISOWeekKey());
    },

    getCurrentWeekWorkDays: () => {
        return get().getWeeklyWorkDays(getISOWeekKey());
    },
});

// Re-export types
export type { WeeklyGoalEntry };
