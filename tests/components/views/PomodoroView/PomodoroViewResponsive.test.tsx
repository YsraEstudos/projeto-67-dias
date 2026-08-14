import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PomodoroView from '../../../../components/views/PomodoroView';
import { usePomodoroStore } from '../../../../stores/pomodoroStore';
import { useRestStore } from '../../../../stores/restStore';
import { getLocalISODate } from '../../../../components/views/PomodoroView/lib/pomodoroStats';

describe('PomodoroView Responsive & Direct Display', () => {
  beforeEach(() => {
    const today = getLocalISODate();

    usePomodoroStore.getState()._reset();
    useRestStore.getState()._reset();

    usePomodoroStore.getState()._hydrateFromFirestore({
      projects: [
        { id: 'p1', name: 'Trabalho', color: '#00a8ff' },
        { id: 'p2', name: 'Estudos', color: '#f43f5e' },
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Estudar Direito Administrativo',
          completed: false,
          estimatedPomodoros: 2,
          completedPomodoros: 0,
          // Set dueDate today so it shows up in default "today" filter
          dueDate: today,
          createdAt: '2026-04-17T09:00:00.000Z',
          subtasks: [
            { id: 'st-1', title: 'Ler atos administrativos', completed: false },
            { id: 'st-2', title: 'Fazer 10 questões', completed: false },
          ],
        },
        {
          id: 'task-2',
          title: 'Revisar Estatuto',
          projectId: 'p2',
          completed: false,
          estimatedPomodoros: 1,
          completedPomodoros: 0,
          // Set dueDate today so it shows up in default "today" filter
          dueDate: today,
          createdAt: '2026-04-17T09:01:00.000Z',
        },
      ],
      activeTaskId: 'task-1',
      activeTaskSelectionDate: today,
    } as any);
  });

  it('renders the Pomodoro Timer directly on the main screen on load', () => {
    render(<PomodoroView />);

    // The digital countdown is directly visible
    expect(screen.getByText('25:00')).toBeInTheDocument();

    // Mode buttons exist in the timer panel (use getAllByRole since sidebar may duplicate names)
    const foco = screen.getAllByRole('button', { name: /Foco/i });
    expect(foco.length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Pausa Curta/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Pausa Longa/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Alerta/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Habilidades/i }).length).toBeGreaterThan(0);

    // Active task title is clearly displayed
    expect(screen.getByText('Estudar Direito Administrativo')).toBeInTheDocument();
    expect(screen.getByText('Subtarefas da Sessão')).toBeInTheDocument();
    expect(screen.getByText('Ler atos administrativos')).toBeInTheDocument();
  });

  it('allows toggling between Timer view and Tasks view seamlessly', () => {
    render(<PomodoroView />);

    // Use aria-label to uniquely target the tab switcher buttons (not the sidebar)
    const tarefasTabBtn = screen.getByRole('button', { name: 'Alternar para Tarefas' });
    fireEvent.click(tarefasTabBtn);

    // Task input is now visible (this input is only in the tasks view)
    expect(screen.getByPlaceholderText(/Adicionar uma tarefa/i)).toBeInTheDocument();

    // Click Timer tab to switch back
    const timerTabBtn = screen.getByRole('button', { name: 'Alternar para Timer' });
    fireEvent.click(timerTabBtn);

    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('switches modes between Pausa Curta, Pausa Longa and back to Foco', () => {
    render(<PomodoroView />);

    // Use first match to target the timer panel mode buttons (not sidebar)
    // Switch to Pausa Curta (5 min = 05:00)
    fireEvent.click(screen.getAllByRole('button', { name: /Pausa Curta/i })[0]);
    expect(screen.getByText('05:00')).toBeInTheDocument();

    // Switch to Pausa Longa (15 min = 15:00)
    fireEvent.click(screen.getAllByRole('button', { name: /Pausa Longa/i })[0]);
    expect(screen.getByText('15:00')).toBeInTheDocument();

    // Switch back to Foco (25 min = 25:00)
    fireEvent.click(screen.getAllByRole('button', { name: /Foco/i })[0]);
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  it('clicking play on a task switches to Timer tab and sets active task', () => {
    render(<PomodoroView />);

    // Navigate to the Tasks tab
    fireEvent.click(screen.getByRole('button', { name: 'Alternar para Tarefas' }));

    // The tasks list should now be visible — task-1 is due today so it appears
    expect(screen.getByText('Estudar Direito Administrativo')).toBeInTheDocument();

    // Click play on task-1 (already active, but this exercises the play flow)
    const playTask1 = screen.getByRole('button', {
      name: 'Iniciar Pomodoro em Estudar Direito Administrativo',
    });
    fireEvent.click(playTask1);

    // Should switch back to Timer view with the countdown visible
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(usePomodoroStore.getState().activeTaskId).toBe('task-1');
  });

  it('allows checking off subtasks directly from the Timer view', () => {
    render(<PomodoroView />);

    const subtaskText = screen.getByText('Ler atos administrativos');
    fireEvent.click(subtaskText);

    const activeTask = usePomodoroStore.getState().tasks.find(t => t.id === 'task-1');
    expect(activeTask?.subtasks?.[0].completed).toBe(true);
  });
});
