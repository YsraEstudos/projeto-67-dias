/**
 * Work Tracking Slice - Daily tracking, time config, and pace mode
 */
import { StateCreator } from 'zustand';

export type PaceMode = '10m' | '25m';

export interface TrackingSlice {
    // Daily work tracking
    currentCount: number;
    goal: number;
    preBreakCount: number;

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
}

export const createTrackingSlice: StateCreator<
    TrackingSlice,
    [],
    [],
    TrackingSlice
> = (set) => ({
    currentCount: 0,
    goal: 300,
    preBreakCount: 0,
    startTime: '08:00',
    endTime: '18:00',
    breakTime: '12:00',
    paceMode: '10m',
    isLoading: true,

    // Work tracking
    setCurrentCount: (count) => set((state) => { state.currentCount = count; }),
    setGoal: (goal) => set((state) => { state.goal = goal; }),
    setPreBreakCount: (count) => set((state) => { state.preBreakCount = count; }),
    incrementCount: () => set((state) => { state.currentCount += 1; }),
    decrementCount: () => set((state) => { state.currentCount = Math.max(0, state.currentCount - 1); }),

    // Time configuration
    setStartTime: (time) => set((state) => { state.startTime = time; }),
    setEndTime: (time) => set((state) => { state.endTime = time; }),
    setBreakTime: (time) => set((state) => { state.breakTime = time; }),

    // Pace mode
    setPaceMode: (mode) => set((state) => { state.paceMode = mode; }),

    // Time config (combined)
    setTimeConfig: (config) => set((state) => {
        if (config.startTime !== undefined) state.startTime = config.startTime;
        if (config.endTime !== undefined) state.endTime = config.endTime;
        if (config.breakTime !== undefined) state.breakTime = config.breakTime;
    }),

    // Loading
    setLoading: (loading) => set((state) => { state.isLoading = loading; }),
});

