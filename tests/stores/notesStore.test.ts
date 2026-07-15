import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../../types';

const {
    writeToFirestoreMock,
    getCurrentUserIdMock,
} = vi.hoisted(() => ({
    writeToFirestoreMock: vi.fn(),
    getCurrentUserIdMock: vi.fn(() => 'user-123'),
}));

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: writeToFirestoreMock,
    writeItemToSubcollection: vi.fn(),
    deleteItemFromSubcollection: vi.fn(),
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

    it('syncs note create, update and delete to Firestore via _syncToFirestore only', () => {
        const note = createNote();

        useNotesStore.getState().addNote(note);

        expect(writeToFirestoreMock).toHaveBeenCalledWith('p67_notes_store', {
            notes: [note],
            tags: [],
        });

        vi.clearAllMocks();

        useNotesStore.getState().updateNote(note.id, { title: 'Nota atualizada' });
        const updatedNote = useNotesStore.getState().notes[0];

        expect(updatedNote.title).toBe('Nota atualizada');
        expect(writeToFirestoreMock).toHaveBeenCalledWith('p67_notes_store', {
            notes: [updatedNote],
            tags: [],
        });

        vi.clearAllMocks();

        useNotesStore.getState().deleteNote(note.id);

        expect(writeToFirestoreMock).toHaveBeenCalledWith('p67_notes_store', {
            notes: [],
            tags: [],
        });
    });
    it('keeps a tag created before initial hydration completes', () => {
        useNotesStore.getState()._reset();
        const tag = { id: 'tag-fiscal-5', label: 'Fiscal 5.0', color: 'bg-purple-500', createdAt: 200 };

        useNotesStore.getState().addTag(tag);
        useNotesStore.getState()._hydrateFromFirestore({ notes: [], tags: [] });

        expect(useNotesStore.getState().tags).toEqual([tag]);
    });

});
