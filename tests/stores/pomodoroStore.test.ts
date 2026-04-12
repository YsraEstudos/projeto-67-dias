import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoroStore } from '../../stores/pomodoroStore';
import { writeToFirestore } from '../../stores/firestoreSync';

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
});
