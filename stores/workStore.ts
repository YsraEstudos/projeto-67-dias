/**
 * Work Store - Composed from modular slices with Firestore-first persistence
 * 
 * This store combines tracking and weekly goals slices.
 */
import { create, StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { writeToFirestore } from './firestoreSync';

// Import slices
import {
    createTrackingSlice,
    createWeeklyGoalsSlice,
    type TrackingSlice,
    type WeeklyGoalsSlice,
} from './work';

// Re-export types for external use
export type {
    PaceMode,
    WeeklyGoalEntry,
} from './work';

export { DEFAULT_WEEKLY_GOAL } from './work';

const STORE_KEY = 'p67_work_store';

// Internal sync methods type
interface SyncMethods {
    _initialized: boolean;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: Partial<WorkState> | null) => void;
    _reset: () => void;
}

// Combined state type
type WorkState = TrackingSlice & WeeklyGoalsSlice & SyncMethods;

// Create a wrapper that adds sync to each action
const createSyncedStore: StateCreator<WorkState> = (set, get, store) => {
    // Create base slices
    const trackingSlice = createTrackingSlice(set, get, store);
    const weeklyGoalsSlice = createWeeklyGoalsSlice(set, get, store);

    // Helper to wrap actions with sync
    const withSync = <T extends (...args: any[]) => void>(fn: T): T => {
        return ((...args: any[]) => {
            fn(...args);
            get()._syncToFirestore();
        }) as T;
    };

    const withSyncIfChanged = <T extends (...args: any[]) => boolean>(fn: T): T => {
        return ((...args: Parameters<T>) => {
            const changed = fn(...args);
            if (changed) {
                get()._syncToFirestore();
            }
            return changed;
        }) as T;
    };

    return {
        // Tracking slice - wrap mutating actions
        currentCount: trackingSlice.currentCount,
        goal: trackingSlice.goal,
        dailyGoalOverride: trackingSlice.dailyGoalOverride,
        preBreakCount: trackingSlice.preBreakCount,
        lastActiveDate: trackingSlice.lastActiveDate,
        startTime: trackingSlice.startTime,
        endTime: trackingSlice.endTime,
        breakTime: trackingSlice.breakTime,
        paceMode: trackingSlice.paceMode,
        isLoading: trackingSlice.isLoading,
        setCurrentCount: withSync(trackingSlice.setCurrentCount),
        setGoal: withSync(trackingSlice.setGoal),
        setDailyGoalOverride: withSync(trackingSlice.setDailyGoalOverride),
        setPreBreakCount: withSync(trackingSlice.setPreBreakCount),
        incrementCount: withSync(trackingSlice.incrementCount),
        decrementCount: withSync(trackingSlice.decrementCount),
        setStartTime: withSync(trackingSlice.setStartTime),
        setEndTime: withSync(trackingSlice.setEndTime),
        setBreakTime: withSync(trackingSlice.setBreakTime),
        setTimeConfig: withSync(trackingSlice.setTimeConfig),
        setPaceMode: withSync(trackingSlice.setPaceMode),
        setLoading: trackingSlice.setLoading, // Don't sync loading state
        _checkAndResetForNewDay: trackingSlice._checkAndResetForNewDay, // Internal, no sync needed
        ensureCurrentDay: withSyncIfChanged(trackingSlice.ensureCurrentDay),

        // Weekly Goals slice - wrap mutating actions
        weeklyGoals: weeklyGoalsSlice.weeklyGoals,
        setWeeklyGoal: withSync(weeklyGoalsSlice.setWeeklyGoal),
        setWeeklyWorkDays: withSync(weeklyGoalsSlice.setWeeklyWorkDays),
        getWeeklyGoal: weeklyGoalsSlice.getWeeklyGoal, // Read-only, no sync needed
        getWeeklyWorkDays: weeklyGoalsSlice.getWeeklyWorkDays, // Read-only, no sync needed
        getCurrentWeekGoal: weeklyGoalsSlice.getCurrentWeekGoal, // Read-only, no sync needed
        getCurrentWeekWorkDays: weeklyGoalsSlice.getCurrentWeekWorkDays, // Read-only, no sync needed

        // Sync methods
        _initialized: false,

        _syncToFirestore: () => {
            const state = get();
            if (!state._initialized) return;

            writeToFirestore(STORE_KEY, {
                // Tracking (persisted parts)
                currentCount: state.currentCount,
                goal: state.goal,
                dailyGoalOverride: state.dailyGoalOverride,
                preBreakCount: state.preBreakCount,
                startTime: state.startTime,
                endTime: state.endTime,
                breakTime: state.breakTime,
                paceMode: state.paceMode,
                lastActiveDate: state.lastActiveDate,
                // Weekly Goals
                weeklyGoals: state.weeklyGoals,
            });
        },

        _hydrateFromFirestore: (data) => {
            if (data) {
                // Check if day changed - reset counters if so
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const savedDate = data.lastActiveDate ?? null;
                const isNewDay = savedDate !== null && savedDate !== today;

                set(() => ({
                    // Reset counters if new day, otherwise use saved values
                    currentCount: isNewDay ? 0 : (data.currentCount !== undefined ? data.currentCount : 0),
                    goal: data.goal !== undefined ? data.goal : trackingSlice.goal,
                    dailyGoalOverride: isNewDay ? null : (data.dailyGoalOverride !== undefined ? data.dailyGoalOverride : null),
                    preBreakCount: isNewDay ? 0 : (data.preBreakCount !== undefined ? data.preBreakCount : 0),
                    lastActiveDate: today, // Always update to today
                    startTime: data.startTime !== undefined ? data.startTime : trackingSlice.startTime,
                    endTime: data.endTime !== undefined ? data.endTime : trackingSlice.endTime,
                    breakTime: data.breakTime !== undefined ? data.breakTime : trackingSlice.breakTime,
                    paceMode: data.paceMode !== undefined ? data.paceMode : trackingSlice.paceMode,
                    // Weekly Goals
                    weeklyGoals: data.weeklyGoals !== undefined ? data.weeklyGoals : {},
                    isLoading: false,
                    _initialized: true,
                }));
            } else {
                set(() => ({
                    isLoading: false,
                    _initialized: true,
                }));
            }
        },

        _reset: () => {
            set(() => ({
                currentCount: 0,
                goal: trackingSlice.goal,
                dailyGoalOverride: null,
                preBreakCount: 0,
                lastActiveDate: null,
                startTime: trackingSlice.startTime,
                endTime: trackingSlice.endTime,
                breakTime: trackingSlice.breakTime,
                paceMode: trackingSlice.paceMode,
                // Weekly Goals
                weeklyGoals: {},
                isLoading: true,
                _initialized: false,
            }));
        },
    } satisfies WorkState;
};

export const useWorkStore = create<WorkState>()(immer(createSyncedStore));
