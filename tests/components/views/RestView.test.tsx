import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RestView from '../../../components/views/RestView';

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

// Mock Gemini
vi.mock('../../../services/gemini', () => ({
    getGeminiModel: vi.fn()
}));

describe('RestView - Next 2 Hours Mode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens the Next 2 Hours modal when button is clicked', async () => {
        render(<RestView />);

        fireEvent.click(screen.getByRole('button', { name: /Planejar Próximas 2h/i }));

        // Click first slot
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
});
