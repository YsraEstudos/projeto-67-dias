import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoroStore } from '../../stores/pomodoroStore';
import { REALTIME_DEBOUNCE_MS, writeToFirestore } from '../../stores/firestoreSync';

vi.mock('../../stores/firestoreSync', async () => {
  const actual = await vi.importActual('../../stores/firestoreSync');
  return {
    ...actual,
    writeToFirestore: vi.fn(),
  };
});

describe('pomodoroStore', () => {
  beforeEach(() => {
    usePomodoroStore.getState()._reset();
    vi.clearAllMocks();
  });

  it('clears stale active task from a previous day during hydration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T09:00:00.000Z'));

    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [
        {
          id: 'task-1',
          title: 'Manha',
          completed: false,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          createdAt: '2026-04-16T10:00:00.000Z',
        },
      ],
      activeTaskId: 'task-1',
      activeTaskSelectionDate: '2026-04-16',
    } as any);

    expect(usePomodoroStore.getState().activeTaskId).toBeNull();

    vi.useRealTimers();
  });

  it('keeps active task when hydration date matches today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T09:00:00.000Z'));

    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [
        {
          id: 'task-1',
          title: 'Manha',
          completed: false,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          createdAt: '2026-04-16T10:00:00.000Z',
        },
      ],
      activeTaskId: 'task-1',
      activeTaskSelectionDate: '2026-04-17',
    } as any);

    expect(usePomodoroStore.getState().activeTaskId).toBe('task-1');

    vi.useRealTimers();
  });

  it('does not sync before initialization', () => {
    usePomodoroStore.getState().addTask({
      title: 'Task before hydrate',
      completed: false,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
    });

    expect(writeToFirestore).not.toHaveBeenCalled();
  });

  it('hydrates and marks store as initialized', () => {
    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [],
      projects: [{ id: 'p1', name: 'Trabalho', color: '#00a8ff' }],
      records: [],
      breakExerciseStats: {
        'quick-pushups': {
          reps: 18,
          updatedAt: '2026-04-13T10:00:00.000Z',
        },
      },
      timerState: {
        mode: 'shortBreak',
        status: 'RUNNING',
        timeLeft: 1402,
        endTime: 1776075802000,
        sessionCount: 3,
      },
      settings: {
        pomodoroLength: 25,
        shortBreakLength: 5,
        longBreakLength: 15,
        longBreakAfter: 4,
        autoStartPomodoro: false,
        autoStartBreak: false,
        disableBreak: false,
        alarmSound: 'bell',
        tickSound: 'none',
        volume: 50,
        desktopNotifications: false,
        theme: 'dark',
        accentColor: '#f43f5e',
        dailyGoal: 8,
        weekStartsOn: 1,
      },
    });

    const state = usePomodoroStore.getState();
    expect(state._initialized).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.breakExerciseStats['quick-pushups']?.reps).toBe(18);
    expect(state.timerState.mode).toBe('shortBreak');
    expect(state.timerState.sessionCount).toBe(3);
  });

  it('syncs task mutations after hydration', () => {
    usePomodoroStore.getState()._hydrateFromFirestore(null);

    usePomodoroStore.getState().addTask({
      title: 'Synced task',
      completed: false,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
    });

    expect(writeToFirestore).toHaveBeenCalledWith(
      'pomodoro-storage',
      expect.objectContaining({
        tasks: expect.arrayContaining([
          expect.objectContaining({ title: 'Synced task' }),
        ]),
      })
    );
  });

  it('syncs pomodoro records after hydration', () => {
    usePomodoroStore.getState()._hydrateFromFirestore(null);

    usePomodoroStore.getState().addRecord({
      taskId: 'task-1',
      duration: 25,
      startTime: '2026-04-12T10:00:00.000Z',
      endTime: '2026-04-12T10:25:00.000Z',
    });

    expect(writeToFirestore).toHaveBeenCalledWith(
      'pomodoro-storage',
      expect.objectContaining({
        records: expect.arrayContaining([
          expect.objectContaining({ taskId: 'task-1', duration: 25 }),
        ]),
      })
    );
  });

  it('syncs exercise break reps after hydration', () => {
    usePomodoroStore.getState()._hydrateFromFirestore(null);

    usePomodoroStore.getState().setBreakExerciseReps('quick-pushups', 12);

    expect(writeToFirestore).toHaveBeenCalledWith(
      'pomodoro-storage',
      expect.objectContaining({
        breakExerciseStats: expect.objectContaining({
          'quick-pushups': expect.objectContaining({ reps: 12 }),
        }),
      })
    );
  });

  it('syncs pomodoro timer state after hydration', () => {
    usePomodoroStore.getState()._hydrateFromFirestore(null);

    usePomodoroStore.getState().setTimerState({
      mode: 'pomodoro',
      status: 'RUNNING',
      timeLeft: 1500,
      endTime: 1776077300000,
      sessionCount: 2,
    });

    expect(writeToFirestore).toHaveBeenCalledWith(
      'pomodoro-storage',
      expect.objectContaining({
        timerState: expect.objectContaining({
          status: 'RUNNING',
          sessionCount: 2,
        }),
      }),
      REALTIME_DEBOUNCE_MS
    );
  });

  it('syncs active task changes with realtime debounce', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T09:00:00.000Z'));

    usePomodoroStore.getState()._hydrateFromFirestore(null);

    usePomodoroStore.getState().setActiveTaskId('task-1');

    expect(writeToFirestore).toHaveBeenCalledWith(
      'pomodoro-storage',
      expect.objectContaining({
        activeTaskId: 'task-1',
        activeTaskSelectionDate: '2026-04-17',
      }),
      REALTIME_DEBOUNCE_MS
    );

    vi.useRealTimers();
  });

  it('marks pomodoro edits with the current day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-17T09:00:00.000Z'));

    usePomodoroStore.getState()._hydrateFromFirestore(null);

    usePomodoroStore.getState().addTask({
      title: 'Daily task',
      completed: false,
      estimatedPomodoros: 2,
      completedPomodoros: 0,
    });

    const taskId = usePomodoroStore.getState().tasks[0]?.id;
    expect(taskId).toBeTruthy();

    usePomodoroStore.getState().updateTask(taskId!, {
      completedPomodoros: 3,
    });

    const updatedTask = usePomodoroStore.getState().tasks.find((task) => task.id === taskId);
    expect(updatedTask?.completedPomodoros).toBe(3);
    expect(updatedTask?.lastCompletedDate).toBe('2026-04-17');

    vi.useRealTimers();
  });
});
