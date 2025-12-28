/**
 * Work Tracking Slice - Daily tracking, time config, and pace mode
 * 
 * Auto-reset: currentCount and preBreakCount reset automatically when day changes
 */
import { StateCreator } from 'zustand';

export type PaceMode = '10m' | '25m';

/**
 * Returns today's date as YYYY-MM-DD
 */
function getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

export interface TrackingSlice {
    // Daily work tracking
    currentCount: number;
    goal: number;
    preBreakCount: number;

    // Date tracking for auto-reset
    lastActiveDate: string | null; // YYYY-MM-DD

    // Time configuration
    startTime: string;
    endTime: string;
    breakTime: string;

    // Pace mode
    paceMode: PaceMode;

    // Loading state
    isLoading: boolean;

    // Work tracking actions
    setCurrentCount: (count: number) => void;
    setGoal: (goal: number) => void;
    setPreBreakCount: (count: number) => void;
    incrementCount: () => void;
    decrementCount: () => void;

    // Time configuration actions
    setStartTime: (time: string) => void;
    setEndTime: (time: string) => void;
    setBreakTime: (time: string) => void;

    // Pace mode action
    setPaceMode: (mode: PaceMode) => void;

    // Time config action (combined)
    setTimeConfig: (config: { startTime?: string; endTime?: string; breakTime?: string }) => void;

    // Loading action
    setLoading: (loading: boolean) => void;

    // Date check (internal)
    _checkAndResetForNewDay: () => void;
}

export const createTrackingSlice: StateCreator<
    TrackingSlice,
    [],
    [],
    TrackingSlice
> = (set, get) => ({
    currentCount: 0,
    goal: 300,
    preBreakCount: 0,
    lastActiveDate: null,
    startTime: '08:00',
    endTime: '18:00',
    breakTime: '12:00',
    paceMode: '10m',
    isLoading: true,

    // Work tracking (with date check)
    setCurrentCount: (count) => {
        get()._checkAndResetForNewDay();
        set(() => ({ currentCount: count, lastActiveDate: getTodayDate() }));
    },
    setGoal: (goal) => set(() => ({ goal })),
    setPreBreakCount: (count) => {
        get()._checkAndResetForNewDay();
        set(() => ({ preBreakCount: count, lastActiveDate: getTodayDate() }));
    },
    incrementCount: () => {
        get()._checkAndResetForNewDay();
        set((state) => ({ currentCount: state.currentCount + 1, lastActiveDate: getTodayDate() }));
    },
    decrementCount: () => {
        get()._checkAndResetForNewDay();
        set((state) => ({ currentCount: Math.max(0, state.currentCount - 1), lastActiveDate: getTodayDate() }));
    },

    // Time configuration
    setStartTime: (time) => set(() => ({ startTime: time })),
    setEndTime: (time) => set(() => ({ endTime: time })),
    setBreakTime: (time) => set(() => ({ breakTime: time })),

    // Pace mode
    setPaceMode: (mode) => set(() => ({ paceMode: mode })),

    // Time config (combined)
    setTimeConfig: (config) => set((state) => ({
        startTime: config.startTime !== undefined ? config.startTime : state.startTime,
        endTime: config.endTime !== undefined ? config.endTime : state.endTime,
        breakTime: config.breakTime !== undefined ? config.breakTime : state.breakTime,
    })),

    // Loading
    setLoading: (loading) => set(() => ({ isLoading: loading })),

    // Check if day changed and reset counters
    _checkAndResetForNewDay: () => {
        const { lastActiveDate } = get();
        const today = getTodayDate();

        if (lastActiveDate && lastActiveDate !== today) {
            // Day changed - reset daily counters
            set(() => ({
                currentCount: 0,
                preBreakCount: 0,
                lastActiveDate: today,
            }));
        }
    },
});


