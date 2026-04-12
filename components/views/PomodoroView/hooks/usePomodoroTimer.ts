import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { playSound } from '../lib/audio';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export function usePomodoroTimer() {
  const settings = useStore(state => state.settings);
  const activeTaskId = useStore(state => state.activeTaskId);
  const updateTask = useStore(state => state.updateTask);
  const addRecord = useStore(state => state.addRecord);
  const tasks = useStore(state => state.tasks);
  
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [sessionCount, setSessionCount] = useState(0);
  
  // Total duration in seconds for the current mode
  const getDuration = useCallback((m: TimerMode) => {
    switch(m) {
      case 'pomodoro': return settings.pomodoroLength * 60;
      case 'shortBreak': return settings.shortBreakLength * 60;
      case 'longBreak': return settings.longBreakLength * 60;
      default: return 25 * 60;
    }
  }, [settings.pomodoroLength, settings.shortBreakLength, settings.longBreakLength]);

  const [timeLeft, setTimeLeft] = useState(getDuration('pomodoro'));
  const endTimeRef = useRef<number | null>(null);

  const previousActiveTaskId = useRef(activeTaskId);

  // Reset to pomodoro mode and auto-start when active task changes
  useEffect(() => {
    if (activeTaskId !== previousActiveTaskId.current) {
      if (activeTaskId) {
        setMode('pomodoro');
        setIsActive(true);
        endTimeRef.current = null;
        setTimeLeft(getDuration('pomodoro'));
      } else {
        // If activeTaskId becomes null (task completed or deleted), stop the timer
        setIsActive(false);
        setMode('pomodoro');
        endTimeRef.current = null;
        setTimeLeft(getDuration('pomodoro'));
      }
      previousActiveTaskId.current = activeTaskId;
    }
  }, [activeTaskId, getDuration]); // getDuration is included but the ref prevents unwanted resets

  // Update timeLeft when settings change and timer is not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(getDuration(mode));
    }
  }, [settings.pomodoroLength, settings.shortBreakLength, settings.longBreakLength, mode]);

  const handleComplete = useCallback(() => {
    const completedAt = new Date();
    setIsActive(false);
    endTimeRef.current = null;

    if (mode === 'pomodoro') {
      if (settings.desktopNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pomodoro concluido', {
          body: activeTaskId ? 'Sessao finalizada com sucesso.' : 'Sessao de foco livre finalizada.'
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
      
      // Update task if active
      if (activeTaskId) {
        const task = tasks.find(t => t.id === activeTaskId);
        if (task) {
          updateTask(activeTaskId, { 
            completedPomodoros: task.completedPomodoros + 1,
            lastCompletedDate: new Date().toISOString().split('T')[0]
          });
        }
      }

      const newCount = sessionCount + 1;
      setSessionCount(newCount);

      if (settings.disableBreak) {
        setMode('pomodoro');
        setTimeLeft(getDuration('pomodoro'));
        if (settings.autoStartPomodoro || !activeTaskId) {
          setTimeout(() => setIsActive(true), 1000);
        }
        return;
      }
      
      const nextMode = newCount % settings.longBreakAfter === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(getDuration(nextMode));
      
      // Auto start break if setting is true OR if no active task
      if (settings.autoStartBreak || !activeTaskId) {
        setTimeout(() => setIsActive(true), 1000);
      }
    } else {
      if (settings.desktopNotifications && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pausa concluida', {
          body: 'Hora de voltar ao foco.'
        });
      }

      if (settings.volume > 0) playSound('break-end', settings.volume);
      setMode('pomodoro');
      setTimeLeft(getDuration('pomodoro'));
      
      // Auto start pomodoro if setting is true OR if no active task
      if (settings.autoStartPomodoro || !activeTaskId) {
        setTimeout(() => setIsActive(true), 1000);
      }
    }
  }, [
    mode,
    sessionCount,
    settings,
    activeTaskId,
    tasks,
    updateTask,
    addRecord,
    getDuration,
  ]);

  useEffect(() => {
    let interval: number;

    if (isActive) {
      // Calculate the exact end time when starting/resuming
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = globalThis.setInterval(() => {
        const now = Date.now();
        const endTime = endTimeRef.current;
        if (!endTime) return;
        const remaining = Math.round((endTime - now) / 1000);

        if (remaining <= 0) {
          handleComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 100); // Check frequently (100ms) to keep UI smooth and accurate
    } else {
      // If paused, clear the end time so it recalculates on resume
      endTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, handleComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    endTimeRef.current = null;
    setTimeLeft(getDuration(mode));
  };

  const skipPhase = () => {
    handleComplete();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((getDuration(mode) - timeLeft) / getDuration(mode)) * 100;

  return {
    isActive,
    timeLeft,
    mode,
    minutes,
    seconds,
    progress,
    toggleTimer,
    resetTimer,
    setMode,
    skipPhase,
    sessionCount
  };
}
