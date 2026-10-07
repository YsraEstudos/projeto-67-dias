import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { usePomodoroStore } from '../../../../stores/pomodoroStore';
import { StatsBar } from '../../../../components/views/PomodoroView/components/StatsBar';
import { useTimerKeyboardShortcut } from '../../../../components/views/PomodoroView/hooks/useTimerKeyboardShortcut';
import {
  formatTimerTitle,
  useTimerDocumentTitle,
} from '../../../../components/views/PomodoroView/hooks/useTimerDocumentTitle';
import type { PomodoroTimerState, Task } from '../../../../components/views/PomodoroView/store/types';

vi.mock('../../../../stores/firestoreSync', async () => {
  const actual = await vi.importActual<typeof import('../../../../stores/firestoreSync')>(
    '../../../../stores/firestoreSync',
  );
  return { ...actual, writeToFirestore: vi.fn() };
});

const runningState = (secondsLeft: number): PomodoroTimerState => ({
  mode: 'pomodoro',
  status: 'RUNNING',
  timeLeft: 1500,
  endTime: Date.now() + secondsLeft * 1000,
  sessionCount: 0,
  sessionStartTime: Date.now(),
  alertStep: null,
});

describe('Pomodoro focus helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T12:00:00'));
    usePomodoroStore.getState()._reset();
    usePomodoroStore.getState()._hydrateFromFirestore(null);
    document.title = 'Projeto 67 Dias';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatTimerTitle', () => {
    it('returns null when idle', () => {
      expect(formatTimerTitle(usePomodoroStore.getState().timerState)).toBeNull();
    });

    it('formats running and paused timers', () => {
      expect(formatTimerTitle(runningState(12 * 60 + 5))).toBe('12:05 · Foco');
      expect(formatTimerTitle({ ...runningState(0), status: 'PAUSED', endTime: null, timeLeft: 90, mode: 'shortBreak' }))
        .toBe('01:30 · Pausa Curta (pausado)');
    });
  });

  describe('useTimerDocumentTitle', () => {
    it('shows the countdown in the tab title and restores it when idle/unmounted', () => {
      const { unmount } = renderHook(() => useTimerDocumentTitle());
      expect(document.title).toBe('Projeto 67 Dias');

      act(() => {
        usePomodoroStore.getState().setTimerState(runningState(10 * 60));
      });
      expect(document.title).toBe('10:00 · Foco | Projeto 67 Dias');

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(document.title).toBe('09:59 · Foco | Projeto 67 Dias');

      unmount();
      expect(document.title).toBe('Projeto 67 Dias');
    });
  });

  describe('useTimerKeyboardShortcut', () => {
    it('toggles on Space outside form fields only', () => {
      const onToggle = vi.fn();
      renderHook(() => useTimerKeyboardShortcut(onToggle));

      fireEvent.keyDown(document.body, { key: ' ', code: 'Space' });
      expect(onToggle).toHaveBeenCalledTimes(1);

      const input = document.createElement('input');
      document.body.appendChild(input);
      fireEvent.keyDown(input, { key: ' ', code: 'Space' });
      expect(onToggle).toHaveBeenCalledTimes(1);
      input.remove();

      fireEvent.keyDown(document.body, { key: ' ', code: 'Space', repeat: true });
      fireEvent.keyDown(document.body, { key: 'Enter', code: 'Enter' });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('does nothing when disabled', () => {
      const onToggle = vi.fn();
      renderHook(() => useTimerKeyboardShortcut(onToggle, false));

      fireEvent.keyDown(document.body, { key: ' ', code: 'Space' });
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('StatsBar', () => {
    const task: Task = {
      id: 't1',
      title: 'Estudar',
      completed: false,
      estimatedPomodoros: 2,
      completedPomodoros: 1,
      createdAt: '2026-04-13T08:00:00.000Z',
    };

    it('uses the configured pomodoro length and shows daily goal progress', () => {
      usePomodoroStore.setState((state) => ({
        settings: { ...state.settings, pomodoroLength: 50, dailyGoal: 4 },
        records: [
          { id: 'r1', duration: 50, startTime: '2026-04-13T08:00:00', endTime: '2026-04-13T08:50:00' },
          { id: 'r2', duration: 50, startTime: '2026-04-12T08:00:00', endTime: '2026-04-12T08:50:00' },
        ],
      }));

      render(<StatsBar activeTasks={[task]} completedCount={0} />);

      expect(screen.getByText('100')).toBeInTheDocument(); // 2 x 50 estimated
      expect(screen.getByText('50')).toBeInTheDocument(); // 1 x 50 elapsed
      expect(screen.getByText('1/4 pomodoros')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    });

    it('hides the goal when the daily goal is zero', () => {
      usePomodoroStore.setState((state) => ({ settings: { ...state.settings, dailyGoal: 0 } }));
      render(<StatsBar activeTasks={[]} completedCount={0} />);
      expect(screen.queryByTestId('daily-goal-progress')).toBeNull();
    });
  });
});
