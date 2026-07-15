import React, { useMemo } from 'react';
import { useWorkStore } from '../../stores';
import { useShallow } from 'zustand/react/shallow';

// Components
import { ConfigurationHeader } from './work/components/ConfigurationHeader';
import { MainTracker } from './work/components/MainTracker';
import { AnalysisGrid } from './work/components/AnalysisGrid';

// Hooks
import { useWorkMetrics } from './work/hooks/useWorkMetrics';
import { useWeeklyGoal } from './work/hooks/useWeeklyGoal';

// --- SKELETON LOADING ---
const WorkViewSkeleton: React.FC = () => (
  <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
    {/* Config Header Skeleton */}
    <div className="grid grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-16 bg-slate-700 rounded"></div>
          <div className="h-6 w-24 bg-slate-700 rounded"></div>
        </div>
      ))}
    </div>

    {/* Main Tracker Skeleton */}
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 bg-slate-800 rounded-2xl p-8 h-48 border border-slate-700"></div>
      <div className="bg-slate-800 rounded-2xl p-6 h-48 border border-slate-700"></div>
    </div>

    {/* Analysis Grid Skeleton */}
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-slate-800 rounded-2xl p-6 h-40 border border-slate-700"></div>
      <div className="bg-slate-800 rounded-2xl p-6 h-40 border border-slate-700"></div>
    </div>
  </div>
);

// --- MAIN VIEW COMPONENT ---

const WorkView: React.FC = () => {
  // Weekly goal hook (replaces individual goal)
  const { currentGoal, currentWorkDays, weekLabel, updateCurrentWeekGoal, updateCurrentWeekWorkDays } = useWeeklyGoal();

  // Atomic selectors for primitives (don't cause re-render on other changes)
  const currentCount = useWorkStore((s) => s.currentCount);
  const dailyGoalOverride = useWorkStore((s) => s.dailyGoalOverride);
  const preBreakCount = useWorkStore((s) => s.preBreakCount);
  const isLoading = useWorkStore((s) => s.isLoading);

  // Grouped selectors for related time config
  const timeConfig = useWorkStore(useShallow((s) => ({
    startTime: s.startTime,
    endTime: s.endTime,
    breakTime: s.breakTime,
  })));

  const paceMode = useWorkStore((s) => s.paceMode);

  // Actions are stable references - they don't cause re-renders
  const setCurrentCount = useWorkStore((s) => s.setCurrentCount);
  const setDailyGoalOverride = useWorkStore((s) => s.setDailyGoalOverride);
  const setPreBreakCount = useWorkStore((s) => s.setPreBreakCount);
  const setStartTime = useWorkStore((s) => s.setStartTime);
  const setEndTime = useWorkStore((s) => s.setEndTime);
  const setBreakTime = useWorkStore((s) => s.setBreakTime);
  const setPaceMode = useWorkStore((s) => s.setPaceMode);

  // Calculate daily quota from weekly goal to fix pacing bugs and UI progress tracking
  const weeklyDailyGoal = useMemo(
    () => Math.max(1, Math.round(currentGoal / Math.max(1, currentWorkDays))),
    [currentGoal, currentWorkDays]
  );
  const dailyGoal = dailyGoalOverride ?? weeklyDailyGoal;

  const stats = useWorkMetrics({
    goal: dailyGoal,
    startTime: timeConfig.startTime,
    endTime: timeConfig.endTime,
    breakTime: timeConfig.breakTime,
    currentCount,
    preBreakCount,
    paceMode
  });

  // Don't render until store is hydrated
  if (isLoading) {
    return <WorkViewSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">

      <ConfigurationHeader
        goal={currentGoal} setGoal={updateCurrentWeekGoal}
        workDays={currentWorkDays} setWorkDays={updateCurrentWeekWorkDays}
        startTime={timeConfig.startTime} setStartTime={setStartTime}
        endTime={timeConfig.endTime} setEndTime={setEndTime}
        breakTime={timeConfig.breakTime} setBreakTime={setBreakTime}
        status={stats.status}
        weekLabel={weekLabel}
      />

      <MainTracker
        currentCount={currentCount}
        goal={dailyGoal}
        progressPercent={stats.progressPercent}
        onUpdate={setCurrentCount}
        onGoalUpdate={setDailyGoalOverride}
        status={stats.status}
        minutesRemaining={stats.minutesRemaining}
      />

      {/* ANALYSIS GRID */}
      <AnalysisGrid
        preBreakCount={preBreakCount}
        setPreBreakCount={setPreBreakCount}
        paceMode={paceMode}
        setPaceMode={setPaceMode}
        expectedPreBreakCount={stats.expectedPreBreakCount}
        breakDiff={stats.breakDiff}
        breakPerformance={stats.breakPerformance}
        itemsRemaining={stats.itemsRemaining}
        requiredPacePerHour={stats.requiredPacePerHour}
        intervalPace={stats.intervalPace}
        minutesRemaining={stats.minutesRemaining}
        hasBreak={stats.hasBreak}
      />

    </div>
  );
};

export default WorkView;
