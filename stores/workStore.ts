/**
 * Work Store - Composed from modular slices with Firestore-first persistence
 * 
 * This store combines multiple slices for better organization:
 * - SessionsSlice: Work session history
 * - GoalsSlice: Work goals configuration
 * - SchedulerSlice: Study subjects and schedules
 * - TrackingSlice: Daily tracking, time config, pace mode
 */
import { create, StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { writeToFirestore } from './firestoreSync';

// Import slices
import {
    createSessionsSlice,
    createGoalsSlice,
    createSchedulerSlice,
    createTrackingSlice,
    type SessionsSlice,
    type GoalsSlice,
    type SchedulerSlice,
    type TrackingSlice,
} from './work';

// Re-export types for external use
export type {
    MetTargetSession,
    WorkGoals,
    StudySubject,
    ScheduledStudyItem,
    DailyStudySchedule,
    PaceMode,
} from './work';

const STORE_KEY = 'p67_work_store';

// Internal sync methods type
interface SyncMethods {
    _initialized: boolean;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: Partial<WorkState> | null) => void;
    _reset: () => void;
}

// Combined state type
type WorkState = SessionsSlice & GoalsSlice & SchedulerSlice & TrackingSlice & SyncMethods;

// Create a wrapper that adds sync to each action
const createSyncedStore: StateCreator<WorkState> = (set, get, store) => {
    // Create base slices
    const sessionsSlice = createSessionsSlice(set, get, store);
    const goalsSlice = createGoalsSlice(set, get, store);
    const schedulerSlice = createSchedulerSlice(set, get, store);
    const trackingSlice = createTrackingSlice(set, get, store);

    // Helper to wrap actions with sync
    const withSync = <T extends (...args: any[]) => void>(fn: T): T => {
        return ((...args: any[]) => {
            fn(...args);
            get()._syncToFirestore();
        }) as T;
    };

    return {
        // Sessions slice - wrap mutating actions
        history: sessionsSlice.history,
        addSession: withSync(sessionsSlice.addSession),
        updateSession: withSync(sessionsSlice.updateSession),
        deleteSession: withSync(sessionsSlice.deleteSession),
        clearHistory: withSync(sessionsSlice.clearHistory),

        // Goals slice - wrap mutating actions
        goals: goalsSlice.goals,
        setGoals: withSync(goalsSlice.setGoals),
        updateGoal: withSync(goalsSlice.updateGoal),
        resetGoals: withSync(goalsSlice.resetGoals),

        // Scheduler slice - wrap mutating actions
        studySubjects: schedulerSlice.studySubjects,
        studySchedules: schedulerSlice.studySchedules,
        setStudySubjects: withSync(schedulerSlice.setStudySubjects),
        addSubject: withSync(schedulerSlice.addSubject),
        updateSubject: withSync(schedulerSlice.updateSubject),
        deleteSubject: withSync(schedulerSlice.deleteSubject),
        setSchedules: withSync(schedulerSlice.setSchedules),
        updateSchedule: withSync(schedulerSlice.updateSchedule),
        toggleScheduleItem: withSync(schedulerSlice.toggleScheduleItem),
        // Aliases
        addStudySubject: withSync(schedulerSlice.addStudySubject),
        updateStudySubject: withSync(schedulerSlice.updateStudySubject),
        deleteStudySubject: withSync(schedulerSlice.deleteStudySubject),
        setStudySchedule: withSync(schedulerSlice.setStudySchedule),
        clearStudySchedule: withSync(schedulerSlice.clearStudySchedule),

        // Tracking slice - wrap mutating actions
        currentCount: trackingSlice.currentCount,
        goal: trackingSlice.goal,
        preBreakCount: trackingSlice.preBreakCount,
        startTime: trackingSlice.startTime,
        endTime: trackingSlice.endTime,
        breakTime: trackingSlice.breakTime,
        paceMode: trackingSlice.paceMode,
        isLoading: trackingSlice.isLoading,
        setCurrentCount: withSync(trackingSlice.setCurrentCount),
        setGoal: withSync(trackingSlice.setGoal),
        setPreBreakCount: withSync(trackingSlice.setPreBreakCount),
        incrementCount: withSync(trackingSlice.incrementCount),
        decrementCount: withSync(trackingSlice.decrementCount),
        setStartTime: withSync(trackingSlice.setStartTime),
        setEndTime: withSync(trackingSlice.setEndTime),
        setBreakTime: withSync(trackingSlice.setBreakTime),
        setTimeConfig: withSync(trackingSlice.setTimeConfig),
        setPaceMode: withSync(trackingSlice.setPaceMode),
        setLoading: trackingSlice.setLoading, // Don't sync loading state

        // Sync methods
        _initialized: false,

        _syncToFirestore: () => {
            const state = get();
            if (!state._initialized) return;

            writeToFirestore(STORE_KEY, {
                // Sessions
                history: state.history,
                // Goals
                goals: state.goals,
                // Scheduler
                studySubjects: state.studySubjects,
                studySchedules: state.studySchedules,
                // Tracking (persisted parts)
                currentCount: state.currentCount,
                goal: state.goal,
                preBreakCount: state.preBreakCount,
                startTime: state.startTime,
                endTime: state.endTime,
                breakTime: state.breakTime,
                paceMode: state.paceMode,
            });
        },

        _hydrateFromFirestore: (data) => {
            if (data) {
                set((state) => {
                    if (data.history !== undefined) state.history = data.history;
                    if (data.goals !== undefined) state.goals = data.goals;
                    if (data.studySubjects !== undefined) state.studySubjects = data.studySubjects;
                    if (data.studySchedules !== undefined) state.studySchedules = data.studySchedules;
                    if (data.currentCount !== undefined) state.currentCount = data.currentCount;
                    if (data.goal !== undefined) state.goal = data.goal;
                    if (data.preBreakCount !== undefined) state.preBreakCount = data.preBreakCount;
                    if (data.startTime !== undefined) state.startTime = data.startTime;
                    if (data.endTime !== undefined) state.endTime = data.endTime;
                    if (data.breakTime !== undefined) state.breakTime = data.breakTime;
                    if (data.paceMode !== undefined) state.paceMode = data.paceMode;
                    state.isLoading = false;
                    state._initialized = true;
                });
            } else {
                set((state) => {
                    state.isLoading = false;
                    state._initialized = true;
                });
            }
        },

        _reset: () => {
            set((state) => {
                state.history = [];
                state.goals = goalsSlice.goals;
                state.studySubjects = [];
                state.studySchedules = [];
                state.currentCount = 0;
                state.goal = trackingSlice.goal;
                state.preBreakCount = 0;
                state.startTime = trackingSlice.startTime;
                state.endTime = trackingSlice.endTime;
                state.breakTime = trackingSlice.breakTime;
                state.paceMode = trackingSlice.paceMode;
                state.isLoading = true;
                state._initialized = false;
            });
        },
    } satisfies WorkState;
};

export const useWorkStore = create<WorkState>()(immer(createSyncedStore));
