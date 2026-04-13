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

  it('persists pause state with remaining time', () => {
    const now = Date.now();
    usePomodoroStore.getState().setTimerState({
      mode: 'pomodoro',
      status: 'RUNNING',
      timeLeft: 1500,
      endTime: now + 10 * 60 * 1000,
      sessionCount: 0,
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
});
