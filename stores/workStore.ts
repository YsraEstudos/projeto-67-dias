/**
 * Work Store - Composed from modular slices with Firestore-first persistence
 * 
 * This store combines multiple slices for better organization:
 * - SessionsSlice: Work session history
 * - GoalsSlice: Work goals configuration
 * - SchedulerSlice: Study subjects and schedules
 * - TrackingSlice: Daily tracking, time config, pace mode
 * - WeeklyGoalsSlice: Weekly goal management with inheritance
 * - IdleTasksSlice: Tasks/Habits selected for idle time (Metas Extras)
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
    createWeeklyGoalsSlice,
    createIdleTasksSlice,
    type SessionsSlice,
    type GoalsSlice,
    type SchedulerSlice,
    type TrackingSlice,
    type WeeklyGoalsSlice,
    type IdleTasksSlice,
} from './work';

// Re-export types for external use
export type {
    MetTargetSession,
    WorkGoals,
    StudySubject,
    ScheduledStudyItem,
    DailyStudySchedule,
    PaceMode,
    WeeklyGoalEntry,
} from './work';

export { DEFAULT_WEEKLY_GOAL, DEFAULT_IDLE_TASK_POINTS } from './work';

const STORE_KEY = 'p67_work_store';

// Internal sync methods type
interface SyncMethods {
    _initialized: boolean;
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: Partial<WorkState> | null) => void;
    _reset: () => void;
}

// Combined state type
type WorkState = SessionsSlice & GoalsSlice & SchedulerSlice & TrackingSlice & WeeklyGoalsSlice & IdleTasksSlice & SyncMethods;

// Create a wrapper that adds sync to each action
const createSyncedStore: StateCreator<WorkState> = (set, get, store) => {
    // Create base slices
    const sessionsSlice = createSessionsSlice(set, get, store);
    const goalsSlice = createGoalsSlice(set, get, store);
    const schedulerSlice = createSchedulerSlice(set, get, store);
    const trackingSlice = createTrackingSlice(set, get, store);
    const weeklyGoalsSlice = createWeeklyGoalsSlice(set, get, store);
    const idleTasksSlice = createIdleTasksSlice(set, get, store);

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
        lastActiveDate: trackingSlice.lastActiveDate,
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
        _checkAndResetForNewDay: trackingSlice._checkAndResetForNewDay, // Internal, no sync needed

        // Weekly Goals slice - wrap mutating actions
        weeklyGoals: weeklyGoalsSlice.weeklyGoals,
        setWeeklyGoal: withSync(weeklyGoalsSlice.setWeeklyGoal),
        getWeeklyGoal: weeklyGoalsSlice.getWeeklyGoal, // Read-only, no sync needed
        getCurrentWeekGoal: weeklyGoalsSlice.getCurrentWeekGoal, // Read-only, no sync needed

        // Idle Tasks slice - wrap mutating actions (Metas Extras)
        selectedIdleTasks: idleTasksSlice.selectedIdleTasks,
        addIdleTask: withSync(idleTasksSlice.addIdleTask),
        removeIdleTask: withSync(idleTasksSlice.removeIdleTask),
        updateIdleTaskPoints: withSync(idleTasksSlice.updateIdleTaskPoints),
        clearIdleTasks: withSync(idleTasksSlice.clearIdleTasks),

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
                lastActiveDate: state.lastActiveDate,
                // Weekly Goals
                weeklyGoals: state.weeklyGoals,
                // Idle Tasks (Metas Extras)
                selectedIdleTasks: state.selectedIdleTasks,
            });
        },

        _hydrateFromFirestore: (data) => {
            if (data) {
                // Check if day changed - reset counters if so
                const today = new Date().toISOString().split('T')[0];
                const savedDate = data.lastActiveDate || null;
                const isNewDay = savedDate && savedDate !== today;

                set(() => ({
                    history: data.history !== undefined ? data.history : [],
                    goals: data.goals !== undefined ? data.goals : goalsSlice.goals,
                    studySubjects: data.studySubjects !== undefined ? data.studySubjects : [],
                    studySchedules: data.studySchedules !== undefined ? data.studySchedules : [],
                    // Reset counters if new day, otherwise use saved values
                    currentCount: isNewDay ? 0 : (data.currentCount !== undefined ? data.currentCount : 0),
                    goal: data.goal !== undefined ? data.goal : trackingSlice.goal,
                    preBreakCount: isNewDay ? 0 : (data.preBreakCount !== undefined ? data.preBreakCount : 0),
                    lastActiveDate: today, // Always update to today
                    startTime: data.startTime !== undefined ? data.startTime : trackingSlice.startTime,
                    endTime: data.endTime !== undefined ? data.endTime : trackingSlice.endTime,
                    breakTime: data.breakTime !== undefined ? data.breakTime : trackingSlice.breakTime,
                    paceMode: data.paceMode !== undefined ? data.paceMode : trackingSlice.paceMode,
                    // Weekly Goals
                    weeklyGoals: data.weeklyGoals !== undefined ? data.weeklyGoals : {},
                    // Idle Tasks - clear on new day
                    selectedIdleTasks: isNewDay ? [] : (data.selectedIdleTasks !== undefined ? data.selectedIdleTasks : []),
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
                history: [],
                goals: goalsSlice.goals,
                studySubjects: [],
                studySchedules: [],
                currentCount: 0,
                goal: trackingSlice.goal,
                preBreakCount: 0,
                lastActiveDate: null,
                startTime: trackingSlice.startTime,
                endTime: trackingSlice.endTime,
                breakTime: trackingSlice.breakTime,
                paceMode: trackingSlice.paceMode,
                // Weekly Goals
                weeklyGoals: {},
                // Idle Tasks
                selectedIdleTasks: [],
                isLoading: true,
                _initialized: false,
            }));
        },
    } satisfies WorkState;
};

export const useWorkStore = create<WorkState>()(immer(createSyncedStore));
