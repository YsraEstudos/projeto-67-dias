import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RestView from '../../../components/views/RestView';
import { RestActivity } from '../../../types';

// Mock useStorage
const mockActivities: RestActivity[] = [
    { id: '1', title: 'Activity 1', isCompleted: false, type: 'DAILY', order: 0, notes: 'Old Note' },
];

let activitiesState = [...mockActivities];
const setActivitiesMock = vi.fn((update: any) => {
    if (typeof update === 'function') {
        activitiesState = update(activitiesState);
    } else {
        activitiesState = update;
    }
});

vi.mock('../../../hooks/useStorage', () => ({
    useStorage: (key: string, initialValue: any) => {
        if (key === 'p67_rest_activities') {
            return [activitiesState, setActivitiesMock];
        }
        return [initialValue, vi.fn()];
    },
    readNamespacedStorage: vi.fn(() => null),
    writeNamespacedStorage: vi.fn(),
    removeNamespacedStorage: vi.fn(),
}));

// Mock Gemini
vi.mock('../../../services/gemini', () => ({
    getGeminiModel: vi.fn()
}));

describe('RestView - Edit Feature', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        activitiesState = [...mockActivities];
    });

    it('opens edit modal and updates activity', async () => {
        render(<RestView />);

        // Find edit button (hovering logic might be tricky in jsdom, but button exists)
        // In the code: opacity-0 group-hover:opacity-100. It's in the DOM.
        const editButtons = screen.getAllByTitle('Editar');
        fireEvent.click(editButtons[0]);

        // Check if modal opened by looking for "Editar Atividade"
        expect(screen.getByText('Editar Atividade')).toBeInTheDocument();

        // Change title
        const titleInput = screen.getByPlaceholderText('Ex: Alongamento...');
        fireEvent.change(titleInput, { target: { value: 'Updated Activity' } });

        // Change Note
        const noteInput = screen.getByPlaceholderText('Instruções, contagem de repetições, links...');
        fireEvent.change(noteInput, { target: { value: 'New Note Content' } });

        // Save
        const saveButton = screen.getByText('Salvar Alterações');
        fireEvent.click(saveButton);

        // Verify update function called
        expect(setActivitiesMock).toHaveBeenCalled();

        // Verify state update
        const updatedActivity = activitiesState.find(a => a.id === '1');
        expect(updatedActivity?.title).toBe('Updated Activity');
        expect(updatedActivity?.notes).toBe('New Note Content');
    });
});
