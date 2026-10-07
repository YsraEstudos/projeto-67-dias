import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
    subscribeToDocument: vi.fn(() => vi.fn()),
    getCurrentUserId: vi.fn(() => 'test-user'),
}));

vi.mock('../../hooks/useStreakTracking', () => ({
    useStreakTracking: () => ({ trackActivity: vi.fn() }),
}));

import { useHabitsStore } from '../../stores/habitsStore';
import { TaskNotificationWidget } from '../../components/TaskNotificationWidget';
import { OrganizeTask } from '../../types';

const task = (id: string, dueDate?: string, extra: Partial<OrganizeTask> = {}): OrganizeTask => ({
    id, title: `Tarefa ${id}`, category: 'Casa', isCompleted: false, isArchived: false,
    createdAt: 0, dueDate, ...extra,
});

describe('TaskNotificationWidget', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 6, 10, 22, 0));
        useHabitsStore.getState()._reset();
        useHabitsStore.getState()._hydrateFromFirestore({ habits: [], tasks: [] });
    });

    afterEach(() => vi.useRealTimers());

    it('renders nothing without relevant tasks', () => {
        useHabitsStore.setState({ tasks: [task('far', '2026-08-30')] });
        const { container } = render(<TaskNotificationWidget />);
        expect(container).toBeEmptyDOMElement();
    });

    it('includes overdue tasks and labels them as late', () => {
        useHabitsStore.setState({
            tasks: [
                task('late', '2026-07-08'),
                task('today', '2026-07-10'),
                task('done-late', '2026-07-01', { isCompleted: true }),
            ],
        });
        render(<TaskNotificationWidget />);

        const fab = screen.getByRole('button', { name: /Tarefas a vencer: 2 \(1 atrasada\)/ });
        fireEvent.click(fab);

        expect(screen.getByText('Tarefa late')).toBeInTheDocument();
        expect(screen.getByText('Tarefa today')).toBeInTheDocument();
        expect(screen.queryByText('Tarefa done-late')).not.toBeInTheDocument();
        expect(screen.getByText(/Atrasada há 2 dias/)).toBeInTheDocument();
        expect(screen.getByText(/Hoje/)).toBeInTheDocument();
    });

    it('closes the popover with Escape', () => {
        useHabitsStore.setState({ tasks: [task('today', '2026-07-10')] });
        render(<TaskNotificationWidget />);
        fireEvent.click(screen.getByRole('button', { name: /Tarefas a vencer/ }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
