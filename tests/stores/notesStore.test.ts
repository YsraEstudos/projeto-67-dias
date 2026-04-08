import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../../types';

const {
    writeToFirestoreMock,
    writeItemToSubcollectionMock,
    deleteItemFromSubcollectionMock,
    getCurrentUserIdMock,
} = vi.hoisted(() => ({
    writeToFirestoreMock: vi.fn(),
    writeItemToSubcollectionMock: vi.fn(() => Promise.resolve()),
    deleteItemFromSubcollectionMock: vi.fn(() => Promise.resolve()),
    getCurrentUserIdMock: vi.fn(() => 'user-123'),
}));

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: writeToFirestoreMock,
    writeItemToSubcollection: writeItemToSubcollectionMock,
    deleteItemFromSubcollection: deleteItemFromSubcollectionMock,
    getCurrentUserId: getCurrentUserIdMock,
}));

import { useNotesStore } from '../../stores/notesStore';

const createNote = (overrides: Partial<Note> = {}): Note => ({
    id: 'note-1',
    title: 'Primeira nota',
    content: 'Conteudo inicial',
    color: 'blue',
    tags: [],
    isPinned: false,
    pinnedToTags: [],
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
});

describe('notesStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getCurrentUserIdMock.mockReturnValue('user-123');
        window.localStorage.clear();
        useNotesStore.getState()._reset();
        useNotesStore.getState()._hydrateFromFirestore({ notes: [], tags: [] });
        vi.clearAllMocks();
    });

    it('mirrors note create, update and delete actions to the notes subcollection', () => {
        const note = createNote();

        useNotesStore.getState().addNote(note);

        expect(writeItemToSubcollectionMock).toHaveBeenCalledWith('p67_notes_store_items', note.id, note);
        expect(writeToFirestoreMock).toHaveBeenCalledWith('p67_notes_store', {
            notes: [note],
            tags: [],
        });

        vi.clearAllMocks();

        useNotesStore.getState().updateNote(note.id, { title: 'Nota atualizada' });
        const updatedNote = useNotesStore.getState().notes[0];

        expect(updatedNote.title).toBe('Nota atualizada');
        expect(writeItemToSubcollectionMock).toHaveBeenCalledWith('p67_notes_store_items', note.id, updatedNote);
        expect(writeToFirestoreMock).toHaveBeenCalledWith('p67_notes_store', {
            notes: [updatedNote],
            tags: [],
        });

        vi.clearAllMocks();

        useNotesStore.getState().deleteNote(note.id);

        expect(deleteItemFromSubcollectionMock).toHaveBeenCalledWith('p67_notes_store_items', note.id);
        expect(writeToFirestoreMock).toHaveBeenCalledWith('p67_notes_store', {
            notes: [],
            tags: [],
        });
    });

    it('does not wipe hydrated document notes when the notes subcollection is still empty', () => {
        const legacyNote = createNote({ id: 'legacy-note', title: 'Nota legada' });

        useNotesStore.getState()._reset();
        useNotesStore.getState()._hydrateFromFirestore({
            notes: [legacyNote],
            tags: [],
        });

        vi.clearAllMocks();

        useNotesStore.getState()._hydrateNotesFromSubcollection([]);

        expect(useNotesStore.getState().notes).toEqual([legacyNote]);

        const newerRemoteNote = createNote({
            id: 'legacy-note',
            title: 'Nota remota mais nova',
            updatedAt: 200,
        });

        useNotesStore.getState()._hydrateNotesFromSubcollection([newerRemoteNote]);

        expect(useNotesStore.getState().notes).toEqual([newerRemoteNote]);
    });
});
