/**
 * Work Store - Composed from modular slices
 * 
 * This store combines multiple slices for better organization:
 * - SessionsSlice: Work session history
 * - GoalsSlice: Work goals configuration
 * - SchedulerSlice: Study subjects and schedules
 * - TrackingSlice: Daily tracking, time config, pace mode
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFirebaseStorage } from './persistMiddleware';

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

// Combined state type
type WorkState = SessionsSlice & GoalsSlice & SchedulerSlice & TrackingSlice;

export const useWorkStore = create<WorkState>()(
    persist(
        (...a) => ({
            ...createSessionsSlice(...a),
            ...createGoalsSlice(...a),
            ...createSchedulerSlice(...a),
            ...createTrackingSlice(...a),
        }),
        {
            name: 'p67_work_store',
            storage: createFirebaseStorage('p67_work_store'),
            partialize: (state) => ({
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
                // Note: isLoading is NOT persisted
            }),
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false);
            },
        }
    )
);
