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
    setCurrentCount: (count) => set(() => ({ currentCount: count })),
    setGoal: (goal) => set(() => ({ goal })),
    setPreBreakCount: (count) => set(() => ({ preBreakCount: count })),
    incrementCount: () => set((state) => ({ currentCount: state.currentCount + 1 })),
    decrementCount: () => set((state) => ({ currentCount: Math.max(0, state.currentCount - 1) })),

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
});

