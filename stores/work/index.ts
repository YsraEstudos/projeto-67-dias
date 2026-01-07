/**
 * Work Store Slices - Re-exports for convenience
 */
export { createSessionsSlice, type SessionsSlice, type MetTargetSession } from './sessionsSlice';
export { createGoalsSlice, type GoalsSlice, type WorkGoals, DEFAULT_GOALS } from './goalsSlice';
export { createSchedulerSlice, type SchedulerSlice, type StudySubject, type ScheduledStudyItem, type DailyStudySchedule } from './schedulerSlice';
export { createTrackingSlice, type TrackingSlice, type PaceMode } from './trackingSlice';
export { createWeeklyGoalsSlice, type WeeklyGoalsSlice, type WeeklyGoalEntry, DEFAULT_WEEKLY_GOAL } from './weeklyGoalsSlice';
export { createIdleTasksSlice, type IdleTasksSlice, DEFAULT_IDLE_TASK_POINTS } from './idleTasksSlice';

