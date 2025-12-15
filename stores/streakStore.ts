/**
 * Streak Store - Daily streak tracking with Firebase persistence
 * 
 * Features:
 * - Automatic activity detection
 * - Freeze days (skip up to 3 days)
 * - Historical records
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StreakData } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

// Helper: Get today's date as YYYY-MM-DD
const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

// Helper: Calculate days between two dates
const daysBetween = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

interface StreakState extends StreakData {
    isLoading: boolean;

    // Core Actions
    recordActivity: () => void;        // Registrar atividade do dia
    checkStreak: () => void;           // Verificar e atualizar streak
    useFreeze: () => boolean;          // Usar freeze day manualmente

    // Admin Actions
    resetStreak: () => void;           // Reset completo (para reset do projeto)
    setLoading: (loading: boolean) => void;

    // Computed
    isActiveToday: () => boolean;
}

const DEFAULT_STREAK: StreakData = {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    freezeDaysUsed: 0,
    freezeDaysAvailable: 3,
    totalActiveDays: 0,
    totalFreezeUsed: 0,
    activeDates: [],
    streakStartDate: null,
    lastStreakLostDate: null,
    createdAt: Date.now(),
};

export const useStreakStore = create<StreakState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_STREAK,
            isLoading: true,

            recordActivity: () => {
                const today = getTodayDate();
                const state = get();

                // Already recorded today
                if (state.lastActiveDate === today) return;

                const isAlreadyActive = state.activeDates.includes(today);
                if (isAlreadyActive) return;

                set((s) => {
                    let newStreak = s.currentStreak;
                    let newFreezeUsed = s.freezeDaysUsed;
                    let newStreakStart = s.streakStartDate;

                    if (s.lastActiveDate) {
                        const daysSince = daysBetween(s.lastActiveDate, today);

                        if (daysSince === 1) {
                            // Consecutive day
                            newStreak += 1;
                        } else if (daysSince >= 2 && daysSince <= 3) {
                            // Can use freeze days
                            const freezeNeeded = daysSince - 1;
                            if (s.freezeDaysUsed + freezeNeeded <= 3) {
                                newFreezeUsed += freezeNeeded;
                                newStreak += 1;
                            } else {
                                // Not enough freeze days, start new streak
                                newStreak = 1;
                                newFreezeUsed = 0;
                                newStreakStart = today;
                            }
                        } else {
                            // Too many days passed, reset
                            newStreak = 1;
                            newFreezeUsed = 0;
                            newStreakStart = today;
                        }
                    } else {
                        // First activity ever
                        newStreak = 1;
                        newStreakStart = today;
                    }

                    return {
                        currentStreak: newStreak,
                        longestStreak: Math.max(s.longestStreak, newStreak),
                        lastActiveDate: today,
                        freezeDaysUsed: newFreezeUsed,
                        freezeDaysAvailable: 3 - newFreezeUsed,
                        totalActiveDays: s.totalActiveDays + 1,
                        activeDates: [...s.activeDates, today],
                        streakStartDate: newStreakStart,
                    };
                });
            },

            checkStreak: () => {
                const today = getTodayDate();
                const state = get();

                if (!state.lastActiveDate) return;
                if (state.lastActiveDate === today) return;

                const daysSince = daysBetween(state.lastActiveDate, today);

                // If more than 3 days AND no freezes available, reset streak
                if (daysSince > 3 || (daysSince > 1 && state.freezeDaysAvailable < daysSince - 1)) {
                    set({
                        currentStreak: 0,
                        freezeDaysUsed: 0,
                        freezeDaysAvailable: 3,
                        streakStartDate: null,
                        lastStreakLostDate: today,
                    });
                }
            },

            useFreeze: () => {
                const state = get();
                if (state.freezeDaysAvailable <= 0) return false;

                set((s) => ({
                    freezeDaysUsed: s.freezeDaysUsed + 1,
                    freezeDaysAvailable: s.freezeDaysAvailable - 1,
                    totalFreezeUsed: s.totalFreezeUsed + 1,
                }));
                return true;
            },

            resetStreak: () => set({
                ...DEFAULT_STREAK,
                createdAt: Date.now(),
            }),

            setLoading: (loading) => set({ isLoading: loading }),

            isActiveToday: () => {
                return get().lastActiveDate === getTodayDate();
            },
        }),
        {
            name: 'p67_streak_store',
            storage: createFirebaseStorage('p67_streak_store'),
            partialize: (state) => ({
                currentStreak: state.currentStreak,
                longestStreak: state.longestStreak,
                lastActiveDate: state.lastActiveDate,
                freezeDaysUsed: state.freezeDaysUsed,
                freezeDaysAvailable: state.freezeDaysAvailable,
                totalActiveDays: state.totalActiveDays,
                totalFreezeUsed: state.totalFreezeUsed,
                activeDates: state.activeDates,
                streakStartDate: state.streakStartDate,
                lastStreakLostDate: state.lastStreakLostDate,
                createdAt: state.createdAt,
            }),
            onRehydrateStorage: () => (state) => {
                // Run streak check on rehydrate
                state?.checkStreak();
                state?.setLoading(false);
            },
        }
    )
);
