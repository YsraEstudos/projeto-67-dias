import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SettingsModal } from '../../../../components/views/PomodoroView/components/SettingsModal';
import { usePomodoroStore } from '../../../../stores/pomodoroStore';

vi.mock('../../../../stores/firestoreSync', async () => {
  const actual = await vi.importActual<typeof import('../../../../stores/firestoreSync')>(
    '../../../../stores/firestoreSync',
  );
  return {
    ...actual,
    writeToFirestore: vi.fn(),
  };
});

describe('SettingsModal number inputs', () => {
  beforeEach(() => {
    usePomodoroStore.getState()._reset();
    usePomodoroStore.setState({ isSettingsOpen: true });
  });

  it('renders Long Break After with default value and allows typing hundreds (e.g. 150)', () => {
    render(<SettingsModal />);

    const label = screen.getByText('Long Break After');
    const inputContainer = label.parentElement;
    const input = inputContainer?.querySelector('input[type="number"]') as HTMLInputElement;

    expect(input).toBeDefined();
    expect(input.value).toBe('4');
    expect(input.getAttribute('min')).toBe('1');
    expect(input.getAttribute('max')).toBe('999');

    // Simulate user focusing and typing "150"
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '150' } });

    expect(input.value).toBe('150');
    expect(usePomodoroStore.getState().settings.longBreakAfter).toBe(150);

    fireEvent.blur(input);
    expect(input.value).toBe('150');
    expect(usePomodoroStore.getState().settings.longBreakAfter).toBe(150);
  });

  it('allows user to clear the input while typing without resetting immediately to 1', () => {
    render(<SettingsModal />);

    const label = screen.getByText('Long Break After');
    const inputContainer = label.parentElement;
    const input = inputContainer?.querySelector('input[type="number"]') as HTMLInputElement;

    fireEvent.focus(input);
    // User clears the field to type a new number
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    // User types "300"
    fireEvent.change(input, { target: { value: '300' } });
    expect(input.value).toBe('300');
    expect(usePomodoroStore.getState().settings.longBreakAfter).toBe(300);

    fireEvent.blur(input);
    expect(input.value).toBe('300');
    expect(usePomodoroStore.getState().settings.longBreakAfter).toBe(300);
  });

  it('clamps empty input on blur back to minimum (1)', () => {
    render(<SettingsModal />);

    const label = screen.getByText('Long Break After');
    const inputContainer = label.parentElement;
    const input = inputContainer?.querySelector('input[type="number"]') as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    fireEvent.blur(input);
    expect(input.value).toBe('1');
    expect(usePomodoroStore.getState().settings.longBreakAfter).toBe(1);
  });

  it('allows Daily Pomodoro Goal to be set to hundreds', () => {
    render(<SettingsModal />);

    const label = screen.getByText('Daily Pomodoro Goal');
    const inputContainer = label.parentElement;
    const input = inputContainer?.querySelector('input[type="number"]') as HTMLInputElement;

    expect(input).toBeDefined();
    expect(input.value).toBe('8');
    expect(input.getAttribute('min')).toBe('1');
    expect(input.getAttribute('max')).toBe('999');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '200' } });
    fireEvent.blur(input);

    expect(input.value).toBe('200');
    expect(usePomodoroStore.getState().settings.dailyGoal).toBe(200);
  });
});
