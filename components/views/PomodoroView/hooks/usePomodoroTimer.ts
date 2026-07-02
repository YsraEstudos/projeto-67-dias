import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { playSound, playAlertFailSound } from '../lib/audio';
import { getLocalISODate, getTaskTodayPomodoros } from '../lib/pomodoroStats';
import { getSkillRoadmapIndex } from '../lib/skillRoadmapIndex';
import type { PomodoroTimerMode, AlertStep, PomodoroTimerState } from '../store/types';
import { useSkillsStore } from '../../../../stores/skillsStore';

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
      case 'alert':
        // Alert duration is set explicitly at call sites (60s countdown, 300s breathing)
        return 60;
      default:
        return 25 * 60;
    }
  }, [settings.pomodoroLength, settings.shortBreakLength, settings.longBreakLength]);

  const createTimerState = useCallback((
    mode: TimerMode,
    status: 'IDLE' | 'RUNNING' | 'PAUSED',
    sessionCount: number,
    timeLeft?: number,
    startedAt: number = Date.now(),
    overrides?: Partial<Pick<PomodoroTimerState, 'alertStep'>>,
  ): PomodoroTimerState => {
    const resolvedTimeLeft = timeLeft ?? getDuration(mode);
    return {
      mode,
      status,
      timeLeft: resolvedTimeLeft,
      endTime: status === 'RUNNING' ? startedAt + resolvedTimeLeft * 1000 : null,
      sessionCount,
      sessionStartTime: status === 'RUNNING' ? Date.now() : null,
      alertStep: overrides?.alertStep ?? (mode === 'alert' ? timerState.alertStep : null),
    };
  }, [getDuration, timerState.alertStep]);

  const getRemainingTime = useCallback(() => {
    if (timerState.status !== 'RUNNING' || !timerState.endTime) {
      return timerState.timeLeft;
    }

    return Math.max(0, Math.ceil((timerState.endTime - Date.now()) / 1000));
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
    // Alert mode duration is managed explicitly by alertStep, not by settings
    if (timerState.mode === 'alert') return;
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

  const handleComplete = useCallback((completedAtMs = Date.now()) => {
    const completedAt = new Date(completedAtMs);

    if (timerState.mode === 'alert') {
      const step = timerState.alertStep;
      if (step === 'countdown') {
        playAlertFailSound(settings.volume);
        const nextState: PomodoroTimerState = {
          mode: 'alert',
          status: 'PAUSED',
          timeLeft: 0,
          endTime: null,
          sessionCount: timerState.sessionCount,
          sessionStartTime: null,
          alertStep: 'pix',
        };
        setPersistedTimerState(nextState);
        setTimeLeft(0);
      } else if (step === 'breathing') {
        if (settings.desktopNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Pausa de Respiração concluída', {
            body: 'Hora de voltar ao foco.',
          });
        }
        if (settings.volume > 0) playSound('break-end', settings.volume);

        const nextState = createTimerState('pomodoro', 'IDLE', timerState.sessionCount);
        setPersistedTimerState(nextState);
        setTimeLeft(nextState.timeLeft);
      }
      return;
    }

    if (timerState.mode === 'pomodoro') {
      if (settings.desktopNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pomodoro concluido', {
          body: activeTaskId ? 'Sessao finalizada com sucesso.' : 'Sessao de foco livre finalizada.',
        });
      }

      if (settings.volume > 0) playSound('work-end', settings.volume);

      const sessionDuration = settings.pomodoroLength;
      // Use the tracked sessionStartTime when available for accurate start (handles pauses correctly)
      const actualStartTime = timerState.sessionStartTime
        ? new Date(timerState.sessionStartTime).toISOString()
        : new Date(completedAt.getTime() - sessionDuration * 60000).toISOString();
      addRecord({
        taskId: activeTaskId ?? undefined,
        duration: sessionDuration,
        startTime: actualStartTime,
        endTime: completedAt.toISOString(),
      });

      if (activeTaskId) {
        const task = tasks.find((entry) => entry.id === activeTaskId);
        if (task) {
          const today = getLocalISODate();
          updateTask(activeTaskId, {
            completedPomodoros: getTaskTodayPomodoros(task, today) + 1,
            lastCompletedDate: today,
          });

          if (task.skillId) {
            useSkillsStore.getState().addPomodoro(task.skillId);
          }
        } else {
          const activeSkills = useSkillsStore.getState().skills;
          const foundSkillId = activeTaskId.startsWith('skill-focus:')
            ? activeTaskId.replace('skill-focus:', '')
            : getSkillRoadmapIndex(activeSkills).get(activeTaskId)?.skillId ?? null;

          if (foundSkillId) {
            useSkillsStore.getState().addPomodoro(foundSkillId);
          }
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
      const nextState = createTimerState(nextMode, shouldAutoStartBreak ? 'RUNNING' : 'IDLE', newCount, undefined, completedAtMs);
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
    const nextState = createTimerState('pomodoro', shouldAutoStartPomodoro ? 'RUNNING' : 'IDLE', timerState.sessionCount, undefined, completedAtMs);
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
    timerState.alertStep,
    timerState.sessionStartTime,
    updateTask,
  ]);

  const reconcileRunningTimer = useCallback(() => {
    const currentTimerState = useStore.getState().timerState;
    if (currentTimerState.status !== 'RUNNING' || !currentTimerState.endTime) return;

    const remaining = Math.max(0, Math.ceil((currentTimerState.endTime - Date.now()) / 1000));
    if (remaining > 0) {
      setTimeLeft(remaining);
      return;
    }

    handleComplete(currentTimerState.endTime);
  }, [handleComplete]);

  useEffect(() => {
    if (timerState.status !== 'RUNNING') return;

    let timeout: ReturnType<typeof globalThis.setTimeout> | null = null;

    const syncRemaining = () => {
      const currentTimerState = useStore.getState().timerState;
      if (currentTimerState.status !== 'RUNNING') {
        return;
      }

      const remaining = getRemainingTime();
      if (remaining <= 0) {
        handleComplete(currentTimerState.endTime ?? Date.now());
        return;
      }

      setTimeLeft(remaining);

      if (!currentTimerState.endTime) {
        return;
      }

      const remainingMs = Math.max(0, currentTimerState.endTime - Date.now());
      const msUntilNextSecond = remainingMs % 1000 || 1000;
      timeout = globalThis.setTimeout(syncRemaining, msUntilNextSecond);
    };

    syncRemaining();
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [getRemainingTime, handleComplete, timerState.status]);

  useEffect(() => {
    const handleResume = () => reconcileRunningTimer();
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [reconcileRunningTimer]);

  const toggleTimer = useCallback(() => {
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
  }, [
    createTimerState,
    getDuration,
    getRemainingTime,
    setPersistedTimerState,
    timerState.mode,
    timerState.sessionCount,
    timerState.status,
    timerState.timeLeft,
  ]);

  const resetTimer = useCallback(() => {
    const nextState = createTimerState(timerState.mode, 'IDLE', timerState.sessionCount);
    setPersistedTimerState(nextState);
    setTimeLeft(nextState.timeLeft);
  }, [createTimerState, setPersistedTimerState, timerState.mode, timerState.sessionCount]);

  const setMode = useCallback((mode: TimerMode) => {
    if (mode === 'alert') {
      const duration = 60;
      const nextState: PomodoroTimerState = {
        mode,
        status: 'RUNNING',
        timeLeft: duration,
        endTime: Date.now() + duration * 1000,
        sessionCount: timerState.sessionCount,
        sessionStartTime: Date.now(),
        alertStep: 'countdown',
      };
      setPersistedTimerState(nextState);
      setTimeLeft(nextState.timeLeft);
      return;
    }
    const nextState = createTimerState(mode, 'IDLE', timerState.sessionCount);
    setPersistedTimerState(nextState);
    setTimeLeft(nextState.timeLeft);
  }, [createTimerState, setPersistedTimerState, timerState.sessionCount]);

  const skipPhase = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = Math.min(100, Math.max(0, ((getDuration(timerState.mode) - timeLeft) / getDuration(timerState.mode)) * 100));

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
