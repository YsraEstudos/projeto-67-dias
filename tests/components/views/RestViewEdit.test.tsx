import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RestView from '../../../components/views/RestView';
import { RestActivity } from '../../../types';
import { useRestStore } from '../../../stores';

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
});
