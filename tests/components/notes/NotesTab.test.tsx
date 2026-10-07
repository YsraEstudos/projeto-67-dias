import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../../../types';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
    getCurrentUserId: () => 'user-1',
}));

vi.mock('../../../hooks/useNavigationHistory', () => ({
    useNavigationHistory: () => ({ pushNavigation: vi.fn(), replaceNavigation: vi.fn(), isHandlingPopState: false }),
}));

import { NotesTab } from '../../../components/notes/NotesTab';
import { useNotesStore } from '../../../stores/notesStore';
import { useTabStore } from '../../../stores/tabStore';

const makeNote = (overrides: Partial<Note>): Note => ({
    id: 'n1', title: 'Nota', content: '', color: 'blue', tags: [], isPinned: false,
    pinnedToTags: [], createdAt: 1, updatedAt: 1, ...overrides,
});

describe('NotesTab', () => {
    beforeEach(() => {
        act(() => {
            useNotesStore.getState()._reset();
            useNotesStore.getState()._hydrateFromFirestore({
                notes: [
                    makeNote({ id: 'p', title: 'Fixada', isPinned: true }),
                    makeNote({ id: 'q', title: 'Plano de Ação', content: 'texto' }),
                ],
                tags: [],
            });
            useTabStore.setState({ tabs: [], activeTabId: null as unknown as string });
        });
    });

    it('turns off the "pinned only" filter when no pinned notes remain', () => {
        render(<NotesTab />);

        fireEvent.click(screen.getByRole('button', { name: /Ver fixadas/ }));
        expect(screen.queryByText('Plano de Ação')).not.toBeInTheDocument();

        act(() => { useNotesStore.getState().togglePinNote('p'); });

        expect(screen.queryByRole('button', { name: /fixadas/ })).not.toBeInTheDocument();
        expect(screen.getByText('Plano de Ação')).toBeInTheDocument();
        expect(screen.getByText('Fixada')).toBeInTheDocument();
    });

    it('searches notes ignoring accents', () => {
        render(<NotesTab />);
        fireEvent.change(screen.getByPlaceholderText(/Buscar notas/), { target: { value: 'acao' } });
        expect(screen.getByText('Plano de Ação')).toBeInTheDocument();
        expect(screen.queryByText('Fixada')).not.toBeInTheDocument();
    });
});
