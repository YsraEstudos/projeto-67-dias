import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TimerWidget } from '../../../../components/views/PomodoroView/components/TimerWidget';
import { usePomodoroStore } from '../../../../stores/pomodoroStore';
import { useRestStore } from '../../../../stores/restStore';

describe('TimerWidget break selection', () => {
  beforeEach(() => {
    usePomodoroStore.getState()._reset();
    useRestStore.getState()._reset();

    useRestStore.getState().setActivities([
      {
        id: 'rest-today-1',
        title: 'Alongamento de olhos',
        isCompleted: false,
        type: 'DAILY',
        order: 0,
      },
      {
        id: 'rest-other-1',
        title: 'Corrida de domingo',
        isCompleted: false,
        type: 'ONCE',
        specificDate: '2026-04-20',
        order: 1,
      },
    ]);
  });

  it('allows choosing a planned rest activity for short break', () => {
    render(<TimerWidget />);

    fireEvent.click(screen.getByTitle('Expandir timer'));
    fireEvent.click(screen.getByTitle('Pausa Curta'));

    fireEvent.click(screen.getByRole('button', { name: /Escolher descanso/i }));
    fireEvent.click(screen.getByRole('button', { name: /Alongamento de olhos/i }));

    expect(screen.getByText('Descanso escolhido')).toBeInTheDocument();
    expect(screen.getAllByText('Alongamento de olhos').length).toBeGreaterThan(0);
    expect(usePomodoroStore.getState().shortBreakSelection?.label).toBe('Alongamento de olhos');
  });

  it('allows choosing a simple quick suggestion', () => {
    render(<TimerWidget />);

    fireEvent.click(screen.getByTitle('Expandir timer'));
    fireEvent.click(screen.getByTitle('Pausa Curta'));

    fireEvent.click(screen.getByRole('button', { name: /Escolher descanso/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sugestões rápidas/i }));
    fireEvent.click(screen.getByRole('button', { name: /Piscar os olhos por 20s/i }));

    expect(usePomodoroStore.getState().shortBreakSelection?.label).toContain('Piscar os olhos');
  });
});
