/**
 * Streak Store - Daily streak tracking with Firestore-first persistence
 */
import { create } from 'zustand';
import { StreakData } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_streak_store';

const getTodayDate = (): string => new Date().toISOString().split('T')[0];

const daysBetween = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

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

interface StreakState extends StreakData {
    isLoading: boolean;
    _initialized: boolean;

    recordActivity: () => void;
    checkStreak: () => void;
    useFreeze: () => boolean;
    resetStreak: () => void;
    setLoading: (loading: boolean) => void;
    isActiveToday: () => boolean;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: StreakData | null) => void;
    _reset: () => void;
}

export const useStreakStore = create<StreakState>()((set, get) => ({
    ...DEFAULT_STREAK,
    isLoading: true,
    _initialized: false,

    recordActivity: () => {
        const today = getTodayDate();
        const state = get();

        if (state.lastActiveDate === today) return;
        if (state.activeDates.includes(today)) return;

        set((s) => {
            let newStreak = s.currentStreak;
            let newFreezeUsed = s.freezeDaysUsed;
            let newStreakStart = s.streakStartDate;

            if (s.lastActiveDate) {
                const daysSince = daysBetween(s.lastActiveDate, today);

                if (daysSince === 1) {
                    newStreak += 1;
                } else if (daysSince >= 2 && daysSince <= 3) {
                    const freezeNeeded = daysSince - 1;
                    if (s.freezeDaysUsed + freezeNeeded <= 3) {
                        newFreezeUsed += freezeNeeded;
                        newStreak += 1;
                    } else {
                        newStreak = 1;
                        newFreezeUsed = 0;
                        newStreakStart = today;
                    }
                } else {
                    newStreak = 1;
                    newFreezeUsed = 0;
                    newStreakStart = today;
                }
            } else {
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
        get()._syncToFirestore();
    },

    checkStreak: () => {
        const today = getTodayDate();
        const state = get();

        if (!state.lastActiveDate) return;
        if (state.lastActiveDate === today) return;

        const daysSince = daysBetween(state.lastActiveDate, today);

        if (daysSince > 3 || (daysSince > 1 && state.freezeDaysAvailable < daysSince - 1)) {
            set({
                currentStreak: 0,
                freezeDaysUsed: 0,
                freezeDaysAvailable: 3,
                streakStartDate: null,
                lastStreakLostDate: today,
            });
            get()._syncToFirestore();
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
        get()._syncToFirestore();
        return true;
    },

    resetStreak: () => {
        set({ ...DEFAULT_STREAK, createdAt: Date.now() });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    isActiveToday: () => get().lastActiveDate === getTodayDate(),

    _syncToFirestore: () => {
        const state = get();
        if (!state._initialized) return;

        writeToFirestore(STORE_KEY, {
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
        });
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                ...data,
                isLoading: false,
                _initialized: true
            });
            // Run streak check after hydration
            get().checkStreak();
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ ...DEFAULT_STREAK, isLoading: true, _initialized: false });
    }
}));
