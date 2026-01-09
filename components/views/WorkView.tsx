import React, { useState, useCallback, lazy, Suspense, useMemo } from 'react';
import { useWorkStore, useUIStore } from '../../stores';
import { useShallow } from 'zustand/react/shallow';
import { ViewState } from '../../types';

// Components
import { ConfigurationHeader } from './work/components/ConfigurationHeader';
import { MainTracker } from './work/components/MainTracker';
import { AnalysisGrid } from './work/components/AnalysisGrid';

// Hooks
import { useWorkMetrics } from './work/hooks/useWorkMetrics';
import { useWeeklyGoal } from './work/hooks/useWeeklyGoal';

// Lazy load heavy modal
const MetTargetModal = lazy(() => import('./work/MetTargetModal'));

// Skeleton for modal loading
const ModalLoadingSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 p-8 animate-pulse">
      <div className="h-8 w-48 bg-slate-700 rounded mb-6"></div>
      <div className="space-y-4">
        <div className="h-32 bg-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-slate-800 rounded-2xl"></div>
          <div className="h-24 bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    </div>
  </div>
);

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
  const { currentGoal, weekLabel, updateCurrentWeekGoal } = useWeeklyGoal();

  // Atomic selectors for primitives (don't cause re-render on other changes)
  const currentCount = useWorkStore((s) => s.currentCount);
  const preBreakCount = useWorkStore((s) => s.preBreakCount);
  const isLoading = useWorkStore((s) => s.isLoading);

  // Grouped selectors for related time config
  const timeConfig = useWorkStore(useShallow((s) => ({
    startTime: s.startTime,
    endTime: s.endTime,
    breakTime: s.breakTime,
  })));

  const paceMode = useWorkStore((s) => s.paceMode);

  // Grouped selectors for modal data (only used when modal is open)
  const modalData = useWorkStore(useShallow((s) => ({
    history: s.history,
    goals: s.goals,
    studySubjects: s.studySubjects,
    studySchedules: s.studySchedules,
    selectedIdleTasks: s.selectedIdleTasks,
  })));

  // Actions are stable references - they don't cause re-renders
  const setCurrentCount = useWorkStore((s) => s.setCurrentCount);
  const setPreBreakCount = useWorkStore((s) => s.setPreBreakCount);
  const setStartTime = useWorkStore((s) => s.setStartTime);
  const setEndTime = useWorkStore((s) => s.setEndTime);
  const setBreakTime = useWorkStore((s) => s.setBreakTime);
  const setPaceMode = useWorkStore((s) => s.setPaceMode);
  const addSession = useWorkStore((s) => s.addSession);
  const deleteSession = useWorkStore((s) => s.deleteSession);
  const setGoals = useWorkStore((s) => s.setGoals);
  const setStudySubjects = useWorkStore((s) => s.setStudySubjects);
  const setSchedules = useWorkStore((s) => s.setSchedules);

  // Idle Tasks actions
  const addIdleTask = useWorkStore((s) => s.addIdleTask);
  const removeIdleTask = useWorkStore((s) => s.removeIdleTask);
  const updateIdleTaskPoints = useWorkStore((s) => s.updateIdleTaskPoints);

  // UI State only (not persisted)
  const [isMetTargetModalOpen, setIsMetTargetModalOpen] = useState(false);

  const stats = useWorkMetrics({
    goal: currentGoal,
    startTime: timeConfig.startTime,
    endTime: timeConfig.endTime,
    breakTime: timeConfig.breakTime,
    currentCount,
    preBreakCount,
    paceMode
  });

  // Memoized callbacks for modal
  const handleCloseModal = useCallback(() => {
    setIsMetTargetModalOpen(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsMetTargetModalOpen(true);
  }, []);

  // Navigation to Sunday view
  const setActiveView = useUIStore((s) => s.setActiveView);
  const handleNavigateToSunday = useCallback(() => {
    setIsMetTargetModalOpen(false);
    setActiveView(ViewState.SUNDAY);
  }, [setActiveView]);

  const handleUpdateGoals = useCallback((newGoals: { weekly: number; ultra: number; anki: number; ncm: number }) => {
    setGoals(newGoals);
  }, [setGoals]);

  // Memoized goals object for modal
  const goalsForModal = useMemo(() => ({
    weekly: modalData.goals.weekly,
    ultra: modalData.goals.ultra,
    anki: modalData.goals.anki,
    ncm: modalData.goals.ncm
  }), [modalData.goals.weekly, modalData.goals.ultra, modalData.goals.anki, modalData.goals.ncm]);

  // Don't render until store is hydrated
  if (isLoading) {
    return <WorkViewSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">

      <ConfigurationHeader
        goal={currentGoal} setGoal={updateCurrentWeekGoal}
        startTime={timeConfig.startTime} setStartTime={setStartTime}
        endTime={timeConfig.endTime} setEndTime={setEndTime}
        breakTime={timeConfig.breakTime} setBreakTime={setBreakTime}
        status={stats.status}
        weekLabel={weekLabel}
      />

      <MainTracker
        currentCount={currentCount}
        goal={currentGoal}
        progressPercent={stats.progressPercent}
        onUpdate={setCurrentCount}
        status={stats.status}
        minutesRemaining={stats.minutesRemaining}
        onMetTargetClick={handleOpenModal}
      />

      {/* Lazy loaded modal - only loads when opened */}
      {isMetTargetModalOpen && (
        <Suspense fallback={<ModalLoadingSkeleton />}>
          <MetTargetModal
            isOpen={isMetTargetModalOpen}
            onClose={handleCloseModal}
            history={modalData.history}
            onSaveSession={addSession}
            goals={goalsForModal}
            onUpdateGoals={handleUpdateGoals}
            onDeleteSession={deleteSession}
            studySubjects={modalData.studySubjects}
            onUpdateSubjects={setStudySubjects}
            studySchedules={modalData.studySchedules}
            onUpdateSchedules={setSchedules}
            // Idle Tasks props
            selectedIdleTasks={modalData.selectedIdleTasks}
            onAddIdleTask={addIdleTask}
            onRemoveIdleTask={removeIdleTask}
            onUpdateIdleTaskPoints={updateIdleTaskPoints}
            onNavigateToSunday={handleNavigateToSunday}
          />
        </Suspense>
      )}

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
      />

    </div>
  );
};

export default WorkView;