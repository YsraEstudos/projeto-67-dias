import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RestView from '../../../components/views/RestView';
import { RestActivity } from '../../../types';
import { useRestStore } from '../../../stores';
import { formatDateISO } from '../../../utils/dateUtils';

const mockActivities: RestActivity[] = [
    { id: '1', title: 'Activity 1', isCompleted: false, type: 'DAILY', order: 0, notes: 'Old Note' },
];

vi.mock('../../../hooks/useStorage', () => ({
    useStorage: (key: string, initialValue: any) => {
        const [val, setVal] = React.useState(initialValue);
        return [val, setVal];
    },
    readNamespacedStorage: vi.fn(() => null),
    writeNamespacedStorage: vi.fn(),
    removeNamespacedStorage: vi.fn(),
}));

describe('RestView - Edit Feature', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const store = useRestStore.getState();
        store.setActivities(mockActivities);
    });

    it('opens edit modal and updates activity', async () => {
        render(<RestView />);

        // Find edit button (hovering logic might be tricky in jsdom, but button exists)
        // In the code: opacity-0 group-hover:opacity-100. It's in the DOM.
        await waitFor(() => {
            expect(screen.getAllByTitle('Editar').length).toBeGreaterThan(0);
        }, { timeout: 5000 });
        const editButtons = screen.getAllByTitle('Editar');
        fireEvent.click(editButtons[0]);

        // Check if modal opened by looking for "Editar Atividade"
        await waitFor(() => {
            expect(screen.getByText('Editar Atividade')).toBeInTheDocument();
        }, { timeout: 5000 });

        // Change title
        const titleInput = screen.getByPlaceholderText('Ex: Alongamento...');
        fireEvent.change(titleInput, { target: { value: 'Updated Activity' } });

        // Change Note
        const noteInput = screen.getByPlaceholderText('Instruções, contagem de repetições...');
        fireEvent.change(noteInput, { target: { value: 'New Note Content' } });

        // Save
        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        // Verify update function called (implicitly via store update)

        // Verify state update in store
        const updatedActivity = useRestStore.getState().activities.find(a => a.id === '1');
        expect(updatedActivity?.title).toBe('Updated Activity');
        expect(updatedActivity?.notes).toBe('New Note Content');
    });

    it('edits series count and labels from the modal', async () => {
        useRestStore.getState().setActivities([
            {
                id: 'series-1',
                title: 'Prancha',
                isCompleted: false,
                type: 'DAILY',
                order: 0,
                totalSets: 2,
                completedSets: 0,
                series: [
                    { id: 'series-a', label: 'Série A', isCompleted: false, order: 0 },
                    { id: 'series-b', label: 'Série B', isCompleted: false, order: 1 },
                ],
            },
        ]);

        render(<RestView />);

        await waitFor(() => {
            expect(screen.getAllByTitle('Editar').length).toBeGreaterThan(0);
        });
        fireEvent.click(screen.getAllByTitle('Editar')[0]);

        await waitFor(() => {
            expect(screen.getByText('Editar Atividade')).toBeInTheDocument();
        });

        const spinButton = screen.getByRole('spinbutton');
        fireEvent.change(spinButton, { target: { value: '3' } });

        const seriesAInput = screen.getByDisplayValue('Série A');
        fireEvent.change(seriesAInput, { target: { value: 'Série Principal' } });

        fireEvent.click(screen.getByText('Salvar Alterações'));

        const updatedActivity = useRestStore.getState().activities.find((activity) => activity.id === 'series-1');
        expect(updatedActivity?.series).toHaveLength(3);
        expect(updatedActivity?.series?.[0].label).toBe('Série Principal');
        expect(updatedActivity?.totalSets).toBe(3);
    });

    it('does not leak the selected day completion into the base activity when editing', async () => {
        const today = formatDateISO(new Date());
        useRestStore.getState().setActivities([
            {
                id: 'daily-1', title: 'Respirar', isCompleted: false, type: 'DAILY', order: 0,
                history: { [today]: true },
            },
        ]);

        render(<RestView />);
        fireEvent.click(screen.getAllByTitle('Editar')[0]);
        await waitFor(() => expect(screen.getByText('Editar Atividade')).toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Ex: Alongamento...'), { target: { value: 'Respirar fundo' } });
        fireEvent.click(screen.getByText('Salvar Alterações'));

        const updated = useRestStore.getState().activities.find(a => a.id === 'daily-1');
        expect(updated?.title).toBe('Respirar fundo');
        expect(updated?.isCompleted).toBe(false);
        expect(updated?.history?.[today]).toBe(true);
    });

    it('assigns the selected date when converting a recurring activity to ONCE', async () => {
        render(<RestView />);
        fireEvent.click(screen.getAllByTitle('Editar')[0]);
        await waitFor(() => expect(screen.getByText('Editar Atividade')).toBeInTheDocument());

        fireEvent.click(screen.getByText('HOJE/ÚNICO'));
        fireEvent.click(screen.getByText('Salvar Alterações'));

        const updated = useRestStore.getState().activities.find(a => a.id === '1');
        expect(updated?.type).toBe('ONCE');
        expect(updated?.specificDate).toBe(formatDateISO(new Date()));
        // Still visible in today's list
        expect(screen.getByText('Activity 1')).toBeInTheDocument();
    });

    it('keeps a link in edit mode while typing', async () => {
        useRestStore.getState().setActivities([
            {
                id: 'link-1', title: 'Com link', isCompleted: false, type: 'DAILY', order: 0,
                links: [{ id: 'l1', label: 'Vídeo', url: 'https://example.com' }],
            },
        ]);

        render(<RestView />);
        fireEvent.click(screen.getAllByTitle('Editar')[0]);
        await waitFor(() => expect(screen.getByText('Editar Atividade')).toBeInTheDocument());

        // Link edit button lives inside the modal (after the item edit button)
        const editButtons = screen.getAllByTitle('Editar');
        fireEvent.click(editButtons[editButtons.length - 1]);

        const labelInput = screen.getByPlaceholderText('Rótulo do link');
        fireEvent.change(labelInput, { target: { value: 'V' } });
        fireEvent.change(screen.getByPlaceholderText('Rótulo do link'), { target: { value: 'Vídeo novo' } });
        fireEvent.click(screen.getByText('Concluir'));
        fireEvent.click(screen.getByText('Salvar Alterações'));

        const updated = useRestStore.getState().activities.find(a => a.id === 'link-1');
        expect(updated?.links?.[0].label).toBe('Vídeo novo');
    });

    it('closes the edit modal with Escape when there are no changes', async () => {
        render(<RestView />);
        fireEvent.click(screen.getAllByTitle('Editar')[0]);
        await waitFor(() => expect(screen.getByText('Editar Atividade')).toBeInTheDocument());

        fireEvent.keyDown(window, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByText('Editar Atividade')).not.toBeInTheDocument());
    });
});
