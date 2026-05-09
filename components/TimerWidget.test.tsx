import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimerWidget } from './TimerWidget';
import { useTimerStore } from '../stores';

// Mock the zustand store
vi.mock('../stores', () => ({
  useTimerStore: vi.fn(),
}));

describe('TimerWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pomodoro pulse ring does not block clicks (has pointer-events-none)', () => {
    // Setup running timer state
    const mockSetTimer = vi.fn();
    (useTimerStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      const state = {
        timer: {
          status: 'RUNNING',
          mode: 'TIMER',
          label: 'Pomodoro',
          accumulated: 0,
          endTime: Date.now() + 1000 * 60 * 25, // 25 mins
          totalDuration: 1500,
        },
        setTimer: mockSetTimer,
      };
      return selector(state);
    });

    const onClickMock = vi.fn();
    render(<TimerWidget onClick={onClickMock} />);

    // Check if the pulse ring renders with pointer-events-none
    const pulseRing = screen.getByTestId('pomodoro-pulse-ring');
    expect(pulseRing).toBeInTheDocument();
    expect(pulseRing.className).toContain('pointer-events-none');
  });
});
