import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { playSound } from '../lib/audio';
import type { PomodoroTimerMode } from '../store/types';

export type TimerMode = PomodoroTimerMode;

export function usePomodoroTimer() {
  const settings = useStore((state) => state.settings);
  const activeTaskId = useStore((state) => state.activeTaskId);
  const updateTask = useStore((state) => state.updateTask);
  const addRecord = useStore((state) => state.addRecord);
  const tasks = useStore((state) => state.tasks);
  const timerState = useStore((state) => state.timerState);
  const setPersistedTimerState = useStore((state) => state.setTimerState);

  const getDuration = useCallback((mode: TimerMode) => {
    switch (mode) {
      case 'pomodoro':
        return settings.pomodoroLength * 60;
      case 'shortBreak':
        return settings.shortBreakLength * 60;
      case 'longBreak':
        return settings.longBreakLength * 60;
      default:
        return 25 * 60;
    }
  }, [settings.pomodoroLength, settings.shortBreakLength, settings.longBreakLength]);

  const createTimerState = useCallback((
    mode: TimerMode,
    status: 'IDLE' | 'RUNNING' | 'PAUSED',
    sessionCount: number,
    timeLeft?: number,
  ) => {
    const resolvedTimeLeft = timeLeft ?? getDuration(mode);
    return {
      mode,
      status,
      timeLeft: resolvedTimeLeft,
      endTime: status === 'RUNNING' ? Date.now() + resolvedTimeLeft * 1000 : null,
      sessionCount,
    };
  }, [getDuration]);

  const getRemainingTime = useCallback(() => {
    if (timerState.status !== 'RUNNING' || !timerState.endTime) {
      return timerState.timeLeft;
    }

    return Math.max(0, Math.round((timerState.endTime - Date.now()) / 1000));
  }, [timerState.endTime, timerState.status, timerState.timeLeft]);

  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime());
  const previousActiveTaskId = useRef(activeTaskId);

  const isFreshPomodoroTimer = useCallback(() => {
    return (
      timerState.mode === 'pomodoro' &&
      timerState.status === 'IDLE' &&
      timerState.endTime === null &&
      timerState.timeLeft === getDuration('pomodoro')
    );
  }, [getDuration, timerState.endTime, timerState.mode, timerState.status, timerState.timeLeft]);

  useEffect(() => {
    setTimeLeft(getRemainingTime());
  }, [getRemainingTime]);

  useEffect(() => {
    if (activeTaskId !== previousActiveTaskId.current) {
      if (activeTaskId) {
        if (!isFreshPomodoroTimer()) {
          previousActiveTaskId.current = activeTaskId;
          setTimeLeft(getRemainingTime());
          return;
        }

        const nextState = createTimerState('pomodoro', 'RUNNING', timerState.sessionCount);
        setPersistedTimerState(nextState);
        setTimeLeft(nextState.timeLeft);
      } else {
        const nextState = createTimerState('pomodoro', 'IDLE', timerState.sessionCount);
        setPersistedTimerState(nextState);
        setTimeLeft(nextState.timeLeft);
      }

      previousActiveTaskId.current = activeTaskId;
    }
  }, [
    activeTaskId,
    createTimerState,
    getRemainingTime,
    isFreshPomodoroTimer,
    setPersistedTimerState,
    timerState.sessionCount,
  ]);

  useEffect(() => {
    if (timerState.status === 'RUNNING') return;

    const refreshedTimeLeft = getDuration(timerState.mode);
    if (timerState.timeLeft === refreshedTimeLeft && timerState.status === 'IDLE') {
      setTimeLeft(refreshedTimeLeft);
      return;
    }

    const nextState = createTimerState(timerState.mode, timerState.status, timerState.sessionCount, refreshedTimeLeft);
    setPersistedTimerState(nextState);
    setTimeLeft(refreshedTimeLeft);
  }, [
    settings.pomodoroLength,
    settings.shortBreakLength,
    settings.longBreakLength,
  ]);

  const handleComplete = useCallback(() => {
    const completedAt = new Date();

    if (timerState.mode === 'pomodoro') {
      if (settings.desktopNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pomodoro concluido', {
          body: activeTaskId ? 'Sessao finalizada com sucesso.' : 'Sessao de foco livre finalizada.',
        });
      }

      if (settings.volume > 0) playSound('work-end', settings.volume);

      const sessionDuration = settings.pomodoroLength;
      addRecord({
        taskId: activeTaskId ?? undefined,
        duration: sessionDuration,
        startTime: new Date(completedAt.getTime() - sessionDuration * 60000).toISOString(),
        endTime: completedAt.toISOString(),
      });

      if (activeTaskId) {
        const task = tasks.find((entry) => entry.id === activeTaskId);
        if (task) {
          updateTask(activeTaskId, {
            completedPomodoros: task.completedPomodoros + 1,
            lastCompletedDate: new Date().toISOString().split('T')[0],
          });
        }
      }

      const newCount = timerState.sessionCount + 1;

      if (settings.disableBreak) {
        const shouldAutoStart = settings.autoStartPomodoro || !activeTaskId;
        const nextState = createTimerState('pomodoro', shouldAutoStart ? 'RUNNING' : 'IDLE', newCount);
        setPersistedTimerState(nextState);
        setTimeLeft(nextState.timeLeft);
        return;
      }

      const longBreakAfter = Math.max(1, Math.floor(settings.longBreakAfter) || 1);
      const nextMode = newCount % longBreakAfter === 0 ? 'longBreak' : 'shortBreak';
      const shouldAutoStartBreak = settings.autoStartBreak || !activeTaskId;
      const nextState = createTimerState(nextMode, shouldAutoStartBreak ? 'RUNNING' : 'IDLE', newCount);
      setPersistedTimerState(nextState);
      setTimeLeft(nextState.timeLeft);
      return;
    }

    if (settings.desktopNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Pausa concluida', {
        body: 'Hora de voltar ao foco.',
      });
    }

    if (settings.volume > 0) playSound('break-end', settings.volume);

    const shouldAutoStartPomodoro = settings.autoStartPomodoro || !activeTaskId;
    const nextState = createTimerState('pomodoro', shouldAutoStartPomodoro ? 'RUNNING' : 'IDLE', timerState.sessionCount);
    setPersistedTimerState(nextState);
    setTimeLeft(nextState.timeLeft);
  }, [
    activeTaskId,
    addRecord,
    createTimerState,
    settings,
    setPersistedTimerState,
    tasks,
    timerState.mode,
    timerState.sessionCount,
    updateTask,
  ]);

  useEffect(() => {
    if (timerState.status !== 'RUNNING') return;

    const syncRemaining = () => {
      const remaining = getRemainingTime();
      if (remaining <= 0) {
        handleComplete();
        return;
      }

      setTimeLeft(remaining);
    };

    syncRemaining();
    const interval = globalThis.setInterval(syncRemaining, 100);
    return () => clearInterval(interval);
  }, [getRemainingTime, handleComplete, timerState.status]);

  const toggleTimer = () => {
    if (timerState.status === 'RUNNING') {
      const remaining = getRemainingTime();
      const nextState = createTimerState(timerState.mode, 'PAUSED', timerState.sessionCount, remaining);
      setPersistedTimerState(nextState);
      setTimeLeft(remaining);
      return;
    }

    const nextState = createTimerState(
      timerState.mode,
      'RUNNING',
      timerState.sessionCount,
      timerState.timeLeft || getDuration(timerState.mode),
    );
    setPersistedTimerState(nextState);
    setTimeLeft(nextState.timeLeft);
  };

  const resetTimer = () => {
    const nextState = createTimerState(timerState.mode, 'IDLE', timerState.sessionCount);
    setPersistedTimerState(nextState);
    setTimeLeft(nextState.timeLeft);
  };

  const setMode = (mode: TimerMode) => {
    const nextState = createTimerState(mode, 'IDLE', timerState.sessionCount);
    setPersistedTimerState(nextState);
    setTimeLeft(nextState.timeLeft);
  };

  const skipPhase = () => {
    handleComplete();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((getDuration(timerState.mode) - timeLeft) / getDuration(timerState.mode)) * 100;

  return {
    isActive: timerState.status === 'RUNNING',
    timeLeft,
    mode: timerState.mode,
    minutes,
    seconds,
    progress,
    toggleTimer,
    resetTimer,
    setMode,
    skipPhase,
    sessionCount: timerState.sessionCount,
  };
}
