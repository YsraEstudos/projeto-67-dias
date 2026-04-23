/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import './pomodoro.css';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { TimerWidget } from './components/TimerWidget';
import { ReportDashboard } from './components/ReportDashboard';
import { TaskDetailsSidebar } from './components/TaskDetailsSidebar';
import { SettingsModal } from './components/SettingsModal';
import { useStore } from './store/useStore';
import { AnimatePresence } from 'motion/react';
import type { Task } from './store/types';

export default function App() {
  const {
    isReportOpen,
    isSettingsOpen,
    selectedTaskId,
    tasks,
    updateTask,
    settings,
    activeTaskId,
    activeTaskSelectionDate,
    setActiveTaskId,
  } = useStore();
  const timerMode = useStore((state) => state.timerState.mode);
  const isBreakMode = timerMode === 'shortBreak' || timerMode === 'longBreak';

  useEffect(() => {
    const syncDailyState = () => {
      const todayStr = new Date().toISOString().split('T')[0];

      if (activeTaskId && activeTaskSelectionDate !== todayStr) {
        setActiveTaskId(null);
      }

      tasks.forEach((task) => {
        const updates: Partial<Task> = {};

        if (task.completedPomodoros > 0 && task.lastCompletedDate !== todayStr) {
          updates.completedPomodoros = 0;
          updates.lastCompletedDate = null;
        }

        if (task.subtasks?.some((subtask) => subtask.completed && subtask.lastCompletedDate !== todayStr)) {
          updates.subtasks = task.subtasks.map((subtask) => {
            if (!subtask.completed || subtask.lastCompletedDate === todayStr) {
              return subtask;
            }

            return {
              ...subtask,
              completed: false,
              lastCompletedDate: null,
            };
          });
        }

        if (Object.keys(updates).length > 0) {
          updateTask(task.id, updates);
        }
      });
    };

    syncDailyState();
    const interval = globalThis.setInterval(syncDailyState, 60_000);
    return () => globalThis.clearInterval(interval);
  }, [activeTaskId, activeTaskSelectionDate, setActiveTaskId, tasks, updateTask]);

  // Apply accent color to CSS variables.
  // During rest mode, we temporarily shift the primary color to purple so the timer feels distinct.
  useEffect(() => {
    const container = document.querySelector('.pomodoro-app-container') as HTMLElement;
    if (container) {
      container.style.setProperty('--color-primary', isBreakMode ? '#8b5cf6' : settings.accentColor);
    }
  }, [isBreakMode, settings.accentColor]);

  return (
    <div className="pomodoro-app-container flex h-[85vh] min-h-[600px] border border-slate-700 bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden font-sans selection:bg-[var(--color-primary)] selection:text-white relative shadow-2xl">
      <Sidebar />
      <MainContent />
      <TimerWidget />
      
      <AnimatePresence>
        {selectedTaskId && <TaskDetailsSidebar key="task-details" />}
      </AnimatePresence>

      <AnimatePresence>
        {isReportOpen && <ReportDashboard key="report" />}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && <SettingsModal key="settings" />}
      </AnimatePresence>
    </div>
  );
}
