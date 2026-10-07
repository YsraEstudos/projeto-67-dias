import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RestView from '../../../components/views/RestView';
import { useRestStore } from '../../../stores';
import { formatDateISO } from '../../../utils/dateUtils';


// Mock useStorage
vi.mock('../../../hooks/useStorage', () => ({
    useStorage: (key: string, initialValue: any) => {
        const [val, setVal] = React.useState(initialValue);
        return [val, setVal];
    },
    readNamespacedStorage: vi.fn(() => null),
    writeNamespacedStorage: vi.fn(),
    removeNamespacedStorage: vi.fn(),
}));

describe('RestView - Next 2 Hours Mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const store = useRestStore.getState();
        store.setActivities([]);
        store.setNextTwoHoursIds([]);

        store.addActivity({
            id: 'test-1',
            title: 'Alongamento de pescoço (30s)',
            type: 'DAILY',
            isCompleted: false,
            order: 0
        });
    });

    it('opens the Next 2 Hours modal when button is clicked', async () => {
        render(<RestView />);

        fireEvent.click(screen.getByRole('button', { name: /Planejar Próximas 2h/i }));

        // Wait for modal to load
        await waitFor(() => {
            expect(screen.getAllByText('Selecionar Atividade').length).toBeGreaterThan(0);
        });
        const slots = screen.getAllByText('Selecionar Atividade');
        fireEvent.click(slots[0]);

        // Select a task (assuming mock data has tasks)
        // Note: INITIAL_ACTIVITIES in RestView has "Alongamento de pescoço (30s)"
        // It appears in the main list and the modal list, so we take the last one (modal)
        const taskButtons = screen.getAllByText('Alongamento de pescoço (30s)');
        fireEvent.click(taskButtons[taskButtons.length - 1]);

        // Verify slot is filled - might appear multiple times now
        expect(screen.getAllByText('Alongamento de pescoço (30s)').length).toBeGreaterThan(0);
    });

    it('allows creating a new task', async () => {
        render(<RestView />);

        // Open modal
        fireEvent.click(screen.getByRole('button', { name: /Planejar Próximas 2h/i }));

        // Click first slot
        await waitFor(() => {
            expect(screen.getAllByText('Selecionar Atividade').length).toBeGreaterThan(0);
        });
        const slots = screen.getAllByText('Selecionar Atividade');
        fireEvent.click(slots[0]);

        // Switch to New tab
        fireEvent.click(screen.getByText('Novo'));

        // Type name
        const input = screen.getByPlaceholderText('Nome da atividade...');
        fireEvent.change(input, { target: { value: 'Nova Tarefa Teste' } });

        // Add
        fireEvent.click(screen.getByText('Adicionar'));

        // Verify slot is filled
        expect(screen.getAllByText('Nova Tarefa Teste').length).toBeGreaterThan(0);
    });

    it('saves the plan and displays it in the main view', async () => {
        render(<RestView />);

        // Open modal
        fireEvent.click(screen.getByRole('button', { name: /Planejar Próximas 2h/i }));

        // Click first slot
        await waitFor(() => {
            expect(screen.getAllByText('Selecionar Atividade').length).toBeGreaterThan(0);
        });
        const slots = screen.getAllByText('Selecionar Atividade');
        fireEvent.click(slots[0]);

        // Select a task
        const taskButtons = screen.getAllByText('Alongamento de pescoço (30s)');
        fireEvent.click(taskButtons[taskButtons.length - 1]);

        // Confirm
        fireEvent.click(screen.getByText('Confirmar Planejamento'));

        // Verify "Próximas 2 Horas" section appears
        expect(screen.getByText('Próximas 2 Horas')).toBeInTheDocument();
        // Verify task is in the list
        const tasks = screen.getAllByText('Alongamento de pescoço (30s)');
        expect(tasks.length).toBeGreaterThan(0);
    });

    it('manually adds a rest activity via the input component', async () => {
        render(<RestView />);

        // Open manual input
        fireEvent.click(screen.getByText('Descanso'));

        // Type name
        const input = screen.getByPlaceholderText(/Nome da atividade/i);
        fireEvent.change(input, { target: { value: 'Atividade Manual Teste' } });

        // Add
        fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));

        // Verify
        expect(screen.getByText('Atividade Manual Teste')).toBeInTheDocument();
    });

    it('creates a rest activity with explicit series and allows marking them individually', async () => {
        render(<RestView />);

        fireEvent.click(screen.getByText('Descanso'));

        fireEvent.change(screen.getByPlaceholderText(/Nome da atividade/i), {
            target: { value: 'Prancha guiada' },
        });

        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));

        expect(screen.getByText('Prancha guiada')).toBeInTheDocument();
        expect(screen.getByText('Séries: 0/3')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Série 1' }));

        expect(screen.getByText('Séries: 1/3')).toBeInTheDocument();
    });
});

describe('RestView - date navigation and progress', () => {
    beforeEach(() => {
        const store = useRestStore.getState();
        store.setActivities([]);
        store.setNextTwoHoursIds([]);
    });

    it('shows day progress and a "Voltar para hoje" shortcut after navigating', () => {
        const today = formatDateISO(new Date());
        useRestStore.getState().setActivities([
            { id: 'a', title: 'A', type: 'DAILY', isCompleted: false, order: 0, history: { [today]: true } },
            { id: 'b', title: 'B', type: 'DAILY', isCompleted: false, order: 1 },
        ]);
        render(<RestView />);

        expect(screen.getByTestId('rest-day-progress')).toHaveTextContent('1/2 concluídos');
        expect(screen.queryByText('Voltar para hoje')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));
        expect(screen.getByTestId('rest-day-progress')).toHaveTextContent('0/2 concluídos');

        fireEvent.click(screen.getByText('Voltar para hoje'));
        expect(screen.getByTestId('rest-day-progress')).toHaveTextContent('1/2 concluídos');
        expect(screen.queryByText('Voltar para hoje')).not.toBeInTheDocument();
    });

    it('hides activities already completed on the selected date from the 2h planner', async () => {
        const today = formatDateISO(new Date());
        useRestStore.getState().setActivities([
            { id: 'done', title: 'Feita hoje', type: 'DAILY', isCompleted: false, order: 0, history: { [today]: true } },
            { id: 'todo', title: 'Pendente hoje', type: 'DAILY', isCompleted: false, order: 1 },
        ]);
        render(<RestView />);

        fireEvent.click(screen.getByRole('button', { name: /Planejar Próximas 2h/i }));
        await waitFor(() => expect(screen.getAllByText('Selecionar Atividade').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByText('Selecionar Atividade')[0]);

        // Each title appears once in the main list; the pending one also appears in the picker
        expect(screen.getAllByText('Feita hoje')).toHaveLength(1);
        expect(screen.getAllByText('Pendente hoje')).toHaveLength(2);
    });

    it('resets completion state when advancing a weekly activity to today', async () => {
        const today = new Date();
        const otherDay = (today.getDay() + 1) % 7;
        useRestStore.getState().setActivities([
            {
                id: 'weekly', title: 'Semanal X', type: 'WEEKLY', daysOfWeek: [otherDay], isCompleted: false, order: 0,
                history: { '2000-01-01': true },
            },
        ]);
        render(<RestView />);

        fireEvent.click(screen.getByRole('button', { name: /Planejar Próximas 2h/i }));
        await waitFor(() => expect(screen.getAllByText('Selecionar Atividade').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByText('Selecionar Atividade')[0]);
        fireEvent.click(screen.getByText('Adiantar (Futuro)'));
        fireEvent.click(screen.getByText('Semanal X'));

        const clone = useRestStore.getState().activities.find(a => a.id !== 'weekly');
        expect(clone?.type).toBe('ONCE');
        expect(clone?.specificDate).toBe(formatDateISO(today));
        expect(clone?.history).toBeUndefined();
        expect(clone?.isCompleted).toBe(false);
    });
});
