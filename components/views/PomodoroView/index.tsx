/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import './pomodoro.css';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { TimerWidget } from './components/TimerWidget';
import { ReportDashboard } from './components/ReportDashboard';
import { TaskDetailsSidebar } from './components/TaskDetailsSidebar';
import { SettingsModal } from './components/SettingsModal';
import { useStore } from './store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, Copy, Check } from 'lucide-react';
import { getLocalISODate } from './lib/pomodoroStats';
import type { Task } from './store/types';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    isReportOpen,
    isSettingsOpen,
    selectedTaskId,
    tasks,
    updateTask,
    deleteTask,
    settings,
    activeTaskId,
    activeTaskSelectionDate,
    setActiveTaskId,
    setTimerState,
  } = useStore();
  const timerState = useStore((state) => state.timerState);
  const timerMode = timerState.mode;
  const isBreakMode = timerMode === 'shortBreak' || timerMode === 'longBreak';

  const alertStep = useMemo(() => {
    if (timerMode === 'alert') {
      return (typeof window !== 'undefined' ? localStorage.getItem('alert-timer-step') : 'countdown') || 'countdown';
    }
    return null;
  }, [timerState, timerMode]);

  const handleResetAlert = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('alert-timer-step', 'countdown');
    }
    const nextState = {
      mode: 'pomodoro' as const,
      status: 'IDLE' as const,
      timeLeft: settings.pomodoroLength * 60,
      endTime: null,
      sessionCount: timerState.sessionCount,
    };
    setTimerState(nextState);
  };

  useEffect(() => {
    const syncDailyState = () => {
      const todayStr = getLocalISODate();

      const expiredDailyTaskIds = tasks
        .filter((task) => task.isDailyQuickTask && task.createdAt?.split('T')[0] !== todayStr)
        .map((task) => task.id);

      if (expiredDailyTaskIds.length > 0) {
        expiredDailyTaskIds.forEach((id) => deleteTask(id));
        return;
      }

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
  }, [activeTaskId, activeTaskSelectionDate, setActiveTaskId, tasks, updateTask, deleteTask]);

  // Apply accent color to CSS variables.
  // During rest mode, we temporarily shift the primary color to purple so the timer feels distinct.
  useEffect(() => {
    const container = document.querySelector('.pomodoro-app-container') as HTMLElement;
    if (container) {
      let primaryColor = settings.accentColor;
      if (timerMode === 'alert') {
        if (alertStep === 'breathing') {
          primaryColor = '#10b981'; // peaceful green
        } else if (alertStep === 'pix') {
          primaryColor = '#ef4444'; // urgent red
        } else {
          primaryColor = '#f59e0b'; // warning amber
        }
      } else if (isBreakMode) {
        primaryColor = '#8b5cf6'; // break purple
      }
      container.style.setProperty('--color-primary', primaryColor);
    }
  }, [isBreakMode, timerMode, alertStep, settings.accentColor]);

  return (
    <div className="pomodoro-app-container flex h-[85vh] min-h-[500px] md:min-h-[600px] border border-slate-700 bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden font-sans selection:bg-[var(--color-primary)] selection:text-white relative shadow-2xl">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <MainContent onToggleSidebar={() => setIsSidebarOpen(true)} />
      <TimerWidget />
      
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTaskId && <TaskDetailsSidebar key="task-details" />}
      </AnimatePresence>

      <AnimatePresence>
        {isReportOpen && <ReportDashboard key="report" />}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && <SettingsModal key="settings" />}
      </AnimatePresence>

      <AnimatePresence>
        {timerMode === 'alert' && alertStep === 'pix' && (
          <PixPenaltyOverlay key="pix-penalty" onClose={handleResetAlert} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PixPenaltyOverlay({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const pixKey = 'projeto67dias@multa.com.br';

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(copied => !copied);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[300] flex items-center justify-center bg-black/95 p-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-950 p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.25)]"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <AlertOctagon className="h-8 w-8 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-wider text-red-400">Tempo Esgotado!</h2>
        <p className="mt-2 text-xl font-extrabold text-white uppercase tracking-widest">Faça o Pix Agora</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Você não se levantou da cadeira, não fez seus polichinelos nem desligou seu telefone no tempo estipulado.
        </p>

        {/* Mock QR Code */}
        <div className="relative mx-auto my-6 flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3 shadow-inner">
          <svg viewBox="0 0 100 100" className="h-full w-full text-slate-950">
            {/* Outline & Corner Anchors */}
            <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="12.5" y="12.5" width="10" height="10" fill="currentColor" />
            <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="77.5" y="12.5" width="10" height="10" fill="currentColor" />
            <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="12.5" y="77.5" width="10" height="10" fill="currentColor" />
            
            {/* Simulated QR Code patterns */}
            <rect x="40" y="10" width="10" height="15" fill="currentColor" />
            <rect x="55" y="5" width="8" height="8" fill="currentColor" />
            <rect x="45" y="30" width="15" height="10" fill="currentColor" />
            <rect x="10" y="45" width="25" height="15" fill="currentColor" />
            <rect x="75" y="40" width="15" height="15" fill="currentColor" />
            <rect x="40" y="55" width="20" height="5" fill="currentColor" />
            <rect x="5" y="60" width="10" height="5" fill="currentColor" />
            <rect x="65" y="65" width="10" height="20" fill="currentColor" />
            <rect x="40" y="70" width="15" height="15" fill="currentColor" />
            <rect x="80" y="75" width="12" height="15" fill="currentColor" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-2xl pointer-events-none" />
        </div>

        {/* Copy-paste Key */}
        <div className="mb-6 rounded-xl border border-slate-700/80 bg-slate-900 p-3.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Chave Pix (E-mail)</span>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-xs text-slate-300">{pixKey}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-400" />
                  <span className="text-green-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]"
        >
          Prometo Levantar da Próxima Vez
        </button>
      </motion.div>
    </motion.div>
  );
}
