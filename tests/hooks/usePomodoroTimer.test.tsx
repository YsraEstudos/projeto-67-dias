import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePomodoroTimer } from '../../components/views/PomodoroView/hooks/usePomodoroTimer';
import { usePomodoroStore } from '../../stores/pomodoroStore';

describe('usePomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T12:00:00.000Z'));
    usePomodoroStore.getState()._reset();
    usePomodoroStore.getState()._hydrateFromFirestore(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('continues a running session after hydration and refresh', () => {
    const now = Date.now();
    usePomodoroStore.getState().setTimerState({
      mode: 'pomodoro',
      status: 'RUNNING',
      timeLeft: 1500,
      endTime: now + ((23 * 60) + 22) * 1000,
      sessionCount: 1,
      sessionStartTime: now,
      alertStep: null,
    });

    const { result } = renderHook(() => usePomodoroTimer());

    expect(result.current.isActive).toBe(true);
    expect(result.current.minutes).toBe(23);
    expect(result.current.seconds).toBe(22);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.minutes).toBe(23);
    expect(result.current.seconds).toBe(21);
  });

  it('does not poll the running timer every 100ms', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    const now = Date.now();
    usePomodoroStore.getState().setTimerState({
      mode: 'pomodoro',
      status: 'RUNNING',
      timeLeft: 1500,
      endTime: now + 25 * 60 * 1000,
      sessionCount: 0,
      sessionStartTime: now,
      alertStep: null,
    });

    const { result } = renderHook(() => usePomodoroTimer());

    expect(result.current.timeLeft).toBe(1500);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.timeLeft).toBe(1500);
    expect(setIntervalSpy).not.toHaveBeenCalledWith(expect.any(Function), 100);

    setIntervalSpy.mockRestore();
  });

  it('persists pause state with remaining time', () => {
    const now = Date.now();
    usePomodoroStore.getState().setTimerState({
      mode: 'pomodoro',
      status: 'RUNNING',
      timeLeft: 1500,
      endTime: now + 10 * 60 * 1000,
      sessionCount: 0,
      sessionStartTime: now,
      alertStep: null,
    });

    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.toggleTimer();
    });

    const persisted = usePomodoroStore.getState().timerState;
    expect(persisted.status).toBe('PAUSED');
    expect(persisted.endTime).toBeNull();
    expect(persisted.timeLeft).toBeGreaterThan(0);
  });

  it('keeps the synced timer when an active task arrives from another device', () => {
    const { result } = renderHook(() => usePomodoroTimer());
    const now = Date.now();
    const syncedEndTime = now + ((22 * 60) + 56) * 1000;

    act(() => {
      usePomodoroStore.getState()._hydrateFromFirestore({
        tasks: [
          {
            id: 'task-1',
            title: 'Manha',
            completed: false,
            estimatedPomodoros: 1,
            completedPomodoros: 0,
            createdAt: '2026-04-13T12:00:00.000Z',
          },
        ],
        activeTaskId: 'task-1',
        timerState: {
          mode: 'pomodoro',
          status: 'RUNNING',
          timeLeft: 1500,
          endTime: syncedEndTime,
          sessionCount: 0,
          sessionStartTime: now,
          alertStep: null,
        },
      });
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.minutes).toBe(22);
    expect(result.current.seconds).toBe(56);
    expect(usePomodoroStore.getState().timerState.endTime).toBe(syncedEndTime);
  });

  it('starts a fresh focus session when selecting a task locally from idle', () => {
    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [
        {
          id: 'task-2',
          title: 'Nova tarefa',
          completed: false,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          createdAt: '2026-04-13T12:00:00.000Z',
        },
      ],
    });

    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      usePomodoroStore.getState().setActiveTaskId('task-2');
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.minutes).toBe(25);
    expect(result.current.seconds).toBe(0);
    expect(usePomodoroStore.getState().timerState.status).toBe('RUNNING');
  });

  it('starts today pomodoro count from one when the stored task count is stale', () => {
    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [
        {
          id: 'task-3',
          title: 'Manha',
          completed: false,
          estimatedPomodoros: 4,
          completedPomodoros: 47,
          lastCompletedDate: '2026-04-12',
          createdAt: '2026-04-12T12:00:00.000Z',
        },
      ],
      activeTaskId: 'task-3',
      activeTaskSelectionDate: '2026-04-13',
    } as any);

    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.skipPhase();
    });

    const task = usePomodoroStore.getState().tasks.find((entry) => entry.id === 'task-3');
    expect(task?.completedPomodoros).toBe(1);
    expect(task?.lastCompletedDate).toBe('2026-04-13');
    expect(usePomodoroStore.getState().records).toHaveLength(1);
  });

  it('starts the next break from the completed pomodoro end time when resuming late', async () => {
    const now = Date.now();
    const completedAt = now - 2 * 60 * 1000;

    usePomodoroStore.getState().setTimerState({
      mode: 'pomodoro',
      status: 'RUNNING',
      timeLeft: 1,
      endTime: completedAt,
      sessionCount: 0,
    });

    renderHook(() => usePomodoroTimer());

    await act(async () => {
      await Promise.resolve();
    });

    const timerState = usePomodoroStore.getState().timerState;
    expect(timerState.mode).toBe('shortBreak');
    expect(timerState.status).toBe('RUNNING');
    expect(timerState.sessionCount).toBe(1);
    expect(timerState.endTime).toBe(completedAt + 5 * 60 * 1000);
  });

  describe('Alerta mode', () => {
    it('initializes alert mode in countdown step with 60 seconds', () => {
      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        result.current.setMode('alert');
      });

      expect(usePomodoroStore.getState().timerState.alertStep).toBe('countdown');
      expect(result.current.mode).toBe('alert');
      expect(result.current.timeLeft).toBe(60);
      expect(result.current.isActive).toBe(true);
    });

    it('transitions to pix step when countdown runs out', () => {
      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        result.current.setMode('alert');
      });

      // Advance time by 60 seconds
      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      expect(usePomodoroStore.getState().timerState.alertStep).toBe('pix');
      expect(result.current.timeLeft).toBe(0);
      expect(result.current.isActive).toBe(false);
      expect(usePomodoroStore.getState().timerState.status).toBe('PAUSED');
    });

    it('sets duration to 300 seconds when step is breathing', () => {
      usePomodoroStore.getState().setTimerState({
        mode: 'alert',
        status: 'IDLE',
        timeLeft: 300,
        endTime: null,
        sessionCount: 0,
        sessionStartTime: null,
        alertStep: 'breathing',
      });

      const { result } = renderHook(() => usePomodoroTimer());

      expect(result.current.timeLeft).toBe(300);
    });

    it('transitions back to pomodoro idle when breathing step runs out', () => {
      usePomodoroStore.getState().setTimerState({
        mode: 'alert',
        status: 'RUNNING',
        timeLeft: 300,
        endTime: Date.now() + 300 * 1000,
        sessionCount: 0,
        sessionStartTime: Date.now(),
        alertStep: 'breathing',
      });

      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        vi.advanceTimersByTime(300 * 1000);
      });

      expect(usePomodoroStore.getState().timerState.alertStep).toBeNull();
      expect(result.current.mode).toBe('pomodoro');
      expect(result.current.isActive).toBe(false);
    });
  });
});
