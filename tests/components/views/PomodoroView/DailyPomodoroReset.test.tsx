import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import App from '../../../../components/views/PomodoroView';
import { usePomodoroStore } from '../../../../stores/pomodoroStore';

vi.mock('../../../../components/views/PomodoroView/components/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

vi.mock('../../../../components/views/PomodoroView/components/MainContent', () => ({
  MainContent: () => <div data-testid="main-content" />,
}));

vi.mock('../../../../components/views/PomodoroView/components/TimerWidget', () => ({
  TimerWidget: () => <div data-testid="timer-widget" />,
}));

vi.mock('../../../../components/views/PomodoroView/components/ReportDashboard', () => ({
  ReportDashboard: () => <div data-testid="report-dashboard" />,
}));

vi.mock('../../../../components/views/PomodoroView/components/TaskDetailsSidebar', () => ({
  TaskDetailsSidebar: () => <div data-testid="task-details-sidebar" />,
}));

vi.mock('../../../../components/views/PomodoroView/components/SettingsModal', () => ({
  SettingsModal: () => <div data-testid="settings-modal" />,
}));

vi.mock('../../../../stores/firestoreSync', async () => {
  const actual = await vi.importActual<typeof import('../../../../stores/firestoreSync')>(
    '../../../../stores/firestoreSync',
  );

  return {
    ...actual,
    writeToFirestore: vi.fn(),
  };
});

describe('PomodoroView daily reset', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T09:00:00.000Z'));
    usePomodoroStore.getState()._reset();

    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [
        {
          id: 'task-1',
          title: 'Manha',
          completed: false,
          estimatedPomodoros: 4,
          completedPomodoros: 45,
          lastCompletedDate: '2026-04-22',
          createdAt: '2026-04-22T10:00:00.000Z',
        },
      ],
      records: [
        {
          id: 'record-1',
          taskId: 'task-1',
          duration: 25,
          startTime: '2026-04-22T10:00:00.000Z',
          endTime: '2026-04-22T10:25:00.000Z',
        },
      ],
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resets yesterday pomodoros on mount and keeps the records history', async () => {
    await act(async () => {
      render(<App />);
    });

    const task = usePomodoroStore.getState().tasks.find((entry) => entry.id === 'task-1');
    expect(task?.completedPomodoros).toBe(0);
    expect(task?.lastCompletedDate).toBeNull();

    expect(usePomodoroStore.getState().records).toHaveLength(1);
  });
});
