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

export default function App() {
  const { isReportOpen, isSettingsOpen, selectedTaskId, tasks, updateTask, settings } = useStore();

  useEffect(() => {
    // Reset infinite tasks if it's a new day
    const todayStr = new Date().toISOString().split('T')[0];
    tasks.forEach(task => {
      if (task.isInfinite && task.lastCompletedDate && task.lastCompletedDate !== todayStr) {
        updateTask(task.id, { completedPomodoros: 0, lastCompletedDate: null });
      }
    });
  }, [tasks, updateTask]);

  // Apply accent color to CSS variables
  useEffect(() => {
    const container = document.querySelector('.pomodoro-app-container') as HTMLElement;
    if (container) {
      container.style.setProperty('--color-primary', settings.accentColor);
    }
  }, [settings.accentColor]);

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
