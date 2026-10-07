// Run these checks in a UTC-3 timezone, where 21:00-23:59 local is already "tomorrow" in UTC.
process.env.TZ = 'America/Sao_Paulo';

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import App from '../../../../components/views/PomodoroView';
import { usePomodoroStore } from '../../../../stores/pomodoroStore';
import { splitRestActivitiesByDate } from '../../../../components/views/PomodoroView/lib/breakOptions';
import { countPomodorosOnDate } from '../../../../components/views/PomodoroView/lib/pomodoroStats';
import type { RestActivity } from '../../../../types';

vi.mock('../../../../components/views/PomodoroView/components/Sidebar', () => ({ Sidebar: () => <div /> }));
vi.mock('../../../../components/views/PomodoroView/components/MainContent', () => ({ MainContent: () => <div /> }));
vi.mock('../../../../components/views/PomodoroView/components/TimerWidget', () => ({ TimerWidget: () => <div /> }));
vi.mock('../../../../components/views/PomodoroView/components/ReportDashboard', () => ({ ReportDashboard: () => <div /> }));
vi.mock('../../../../components/views/PomodoroView/components/TaskDetailsSidebar', () => ({ TaskDetailsSidebar: () => <div /> }));
vi.mock('../../../../components/views/PomodoroView/components/SettingsModal', () => ({ SettingsModal: () => <div /> }));

vi.mock('../../../../stores/firestoreSync', async () => {
  const actual = await vi.importActual<typeof import('../../../../stores/firestoreSync')>(
    '../../../../stores/firestoreSync',
  );
  return { ...actual, writeToFirestore: vi.fn() };
});

// 22:30 on 2026-04-12 in São Paulo == 01:30 on 2026-04-13 UTC
const LATE_EVENING_UTC = new Date('2026-04-13T01:30:00.000Z');

describe('Pomodoro local-date handling (UTC-3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(LATE_EVENING_UTC);
    usePomodoroStore.getState()._reset();
    usePomodoroStore.getState()._hydrateFromFirestore(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs in the expected timezone', () => {
    expect(new Date().getDate()).toBe(12);
  });

  it('stamps the recurring copy of a completed task with the local day', () => {
    usePomodoroStore.getState().addTask({
      title: 'Recorrente',
      completed: false,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      recurringDays: [0, 1, 2, 3, 4, 5, 6],
    });
    const id = usePomodoroStore.getState().tasks[0].id;

    usePomodoroStore.getState().toggleTask(id);

    const copy = usePomodoroStore.getState().tasks.find((task) => task.id !== id);
    expect(copy?.lastCompletedDate).toBe('2026-04-12');
  });

  it('does not delete a daily quick task created late in the evening', async () => {
    usePomodoroStore.setState({
      tasks: [
        {
          id: 'quick-today',
          title: 'Rapida de hoje',
          completed: false,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          isDailyQuickTask: true,
          createdAt: '2026-04-13T01:00:00.000Z', // 22:00 local on the 12th
        },
        {
          id: 'quick-yesterday',
          title: 'Rapida de ontem',
          completed: false,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          isDailyQuickTask: true,
          createdAt: '2026-04-11T20:00:00.000Z',
        },
      ],
    });

    await act(async () => {
      render(<App />);
    });

    const ids = usePomodoroStore.getState().tasks.map((task) => task.id);
    expect(ids).toEqual(['quick-today']);
  });

  it('matches one-off rest activities by the local calendar day', () => {
    const activity: RestActivity = {
      id: 'once',
      title: 'Alongar',
      isCompleted: false,
      type: 'ONCE',
      order: 0,
      specificDate: '2026-04-12',
    } as RestActivity;

    const { today } = splitRestActivitiesByDate([activity], new Date());
    expect(today.map((entry) => entry.id)).toEqual(['once']);
  });

  it('counts focus records by their local end day', () => {
    const records = [
      { id: 'a', duration: 25, startTime: '2026-04-13T00:30:00.000Z', endTime: '2026-04-13T00:55:00.000Z' }, // 21:55 local, 12th
      { id: 'b', duration: 25, startTime: '2026-04-13T03:30:00.000Z', endTime: '2026-04-13T03:55:00.000Z' }, // 00:55 local, 13th
      { id: 'c', duration: 25, startTime: 'x', endTime: 'invalid' },
    ];

    expect(countPomodorosOnDate(records, '2026-04-12')).toBe(1);
    expect(countPomodorosOnDate(records, '2026-04-13')).toBe(1);
  });
});
