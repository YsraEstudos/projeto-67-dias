import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskItem } from '../../../../components/views/PomodoroView/components/TaskItem';
import { usePomodoroStore } from '../../../../stores/pomodoroStore';

describe('TaskItem pomodoro summary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T09:00:00.000Z'));
    usePomodoroStore.getState()._reset();

    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [
        {
          id: 'task-1',
          title: 'Estudar',
          completed: false,
          estimatedPomodoros: 4,
          completedPomodoros: 0,
          createdAt: '2026-04-23T08:00:00.000Z',
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
        {
          id: 'record-2',
          taskId: 'task-1',
          duration: 25,
          startTime: '2026-04-22T11:00:00.000Z',
          endTime: '2026-04-22T11:25:00.000Z',
        },
      ],
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows daily and historical pomodoro counts separately', () => {
    render(
      <TaskItem
        task={usePomodoroStore.getState().tasks[0]}
        isSelected={false}
        isCompleting={false}
        onToggle={() => undefined}
        onSelect={() => undefined}
      />
    );

    expect(screen.getByText(/Hoje 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Histórico total 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Meta 4/i)).toBeInTheDocument();
  });

  it('shows stale daily pomodoros only in the historical total', () => {
    usePomodoroStore.getState()._hydrateFromFirestore({
      tasks: [
        {
          id: 'task-1',
          title: 'Manha',
          completed: false,
          estimatedPomodoros: 4,
          completedPomodoros: 47,
          lastCompletedDate: '2026-04-22',
          createdAt: '2026-04-22T08:00:00.000Z',
        },
      ],
      records: Array.from({ length: 47 }, (_, index) => ({
        id: `record-${index + 1}`,
        taskId: 'task-1',
        duration: 25,
        startTime: '2026-04-22T10:00:00.000Z',
        endTime: '2026-04-22T10:25:00.000Z',
      })),
    } as any);

    render(
      <TaskItem
        task={usePomodoroStore.getState().tasks[0]}
        isSelected={false}
        isCompleting={false}
        onToggle={() => undefined}
        onSelect={() => undefined}
      />
    );

    expect(screen.getByText(/Hoje 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Histórico total 47/i)).toBeInTheDocument();
  });
});
