import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { PomodoroTimerMode, PomodoroTimerState } from '../store/types';

const MODE_LABELS: Record<PomodoroTimerMode, string> = {
  pomodoro: 'Foco',
  shortBreak: 'Pausa Curta',
  longBreak: 'Pausa Longa',
  alert: 'Alerta',
};

export function formatTimerTitle(timerState: PomodoroTimerState, now = Date.now()): string | null {
  if (timerState.status === 'IDLE') return null;

  const remaining = timerState.status === 'RUNNING' && timerState.endTime
    ? Math.max(0, Math.ceil((timerState.endTime - now) / 1000))
    : Math.max(0, timerState.timeLeft);
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  const pausedSuffix = timerState.status === 'PAUSED' ? ' (pausado)' : '';

  return `${minutes}:${seconds} · ${MODE_LABELS[timerState.mode]}${pausedSuffix}`;
}

/**
 * Mirrors the running/paused timer in the browser tab title so the countdown is visible
 * from other tabs. Restores the original title when the timer goes idle or the view unmounts.
 */
export function useTimerDocumentTitle() {
  const timerState = useStore((state) => state.timerState);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const originalTitle = document.title;

    const applyTitle = () => {
      const label = formatTimerTitle(useStore.getState().timerState);
      document.title = label ? `${label} | ${originalTitle}` : originalTitle;
    };

    applyTitle();
    const interval = timerState.status === 'RUNNING'
      ? globalThis.setInterval(applyTitle, 1000)
      : null;

    return () => {
      if (interval) globalThis.clearInterval(interval);
      document.title = originalTitle;
    };
  }, [timerState]);
}
