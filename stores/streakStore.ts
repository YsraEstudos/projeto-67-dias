/**
 * Streak Store - Daily streak tracking with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StreakData } from '../types';
import { writeToFirestore } from './firestoreSync';
import { getTodayISO, daysDiff } from '../utils/dateUtils';

const STORE_KEY = 'p67_streak_store';

const getTodayDate = (): string => getTodayISO();

const daysBetween = (date1: string, date2: string): number => Math.abs(daysDiff(date1, date2));

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

export const useStreakStore = create<StreakState>()(immer((set, get) => ({
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

            s.currentStreak = newStreak;
            s.longestStreak = Math.max(s.longestStreak, newStreak);
            s.lastActiveDate = today;
            s.freezeDaysUsed = newFreezeUsed;
            s.freezeDaysAvailable = 3 - newFreezeUsed;
            s.totalActiveDays = s.totalActiveDays + 1;
            s.activeDates.push(today);
            s.streakStartDate = newStreakStart;
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
            set((s) => {
                s.currentStreak = 0;
                s.freezeDaysUsed = 0;
                s.freezeDaysAvailable = 3;
                s.streakStartDate = null;
                s.lastStreakLostDate = today;
            });
            get()._syncToFirestore();
        }
    },

    useFreeze: () => {
        const state = get();
        if (state.freezeDaysAvailable <= 0) return false;

        set((s) => {
            s.freezeDaysUsed = s.freezeDaysUsed + 1;
            s.freezeDaysAvailable = s.freezeDaysAvailable - 1;
            s.totalFreezeUsed = s.totalFreezeUsed + 1;
        });
        get()._syncToFirestore();
        return true;
    },

    resetStreak: () => {
        set((s) => {
            Object.assign(s, { ...DEFAULT_STREAK, createdAt: Date.now() });
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

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
            set((state) => {
                Object.assign(state, data);
                state.isLoading = false;
                state._initialized = true;
            });
            // Run streak check after hydration
            get().checkStreak();
        } else {
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
        }
    },

    _reset: () => {
        set((state) => {
            Object.assign(state, { ...DEFAULT_STREAK, isLoading: true, _initialized: false });
        });
    }
})));

