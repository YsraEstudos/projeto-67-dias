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


    it('keeps remote notes when a note was created before initial hydration', () => {
        useNotesStore.getState()._reset();
        const local = createNote({ id: 'local-early', updatedAt: 500 });
        const remote = createNote({ id: 'remote-1' });

        useNotesStore.getState().addNote(local);
        useNotesStore.getState()._hydrateFromFirestore({ notes: [remote], tags: [] });

        expect(useNotesStore.getState().notes.map(n => n.id).sort()).toEqual(['local-early', 'remote-1']);
    });

    it('applies remote note changes from other devices after initialization', () => {
        const note = createNote();
        useNotesStore.getState()._hydrateFromFirestore({ notes: [note], tags: [] });
        expect(useNotesStore.getState().notes).toEqual([note]);

        const remoteEdit = { ...note, title: 'Editada em outro aparelho', updatedAt: 200 };
        const remoteNew = createNote({ id: 'note-2', title: 'Nova remota' });
        useNotesStore.getState()._hydrateFromFirestore({ notes: [remoteEdit, remoteNew], tags: [] });

        expect(useNotesStore.getState().notes).toEqual([remoteEdit, remoteNew]);

        // Deleted on another device
        useNotesStore.getState()._hydrateFromFirestore({ notes: [remoteNew], tags: [] });
        expect(useNotesStore.getState().notes).toEqual([remoteNew]);
    });

    it('keeps pending local edits, creations and deletions when a stale snapshot arrives', () => {
        const a = createNote({ id: 'a' });
        const b = createNote({ id: 'b' });
        useNotesStore.getState()._hydrateFromFirestore({ notes: [a, b], tags: [] });

        useNotesStore.getState().updateNote('a', { title: 'Local pendente' });
        useNotesStore.getState().togglePinNote('a');
        useNotesStore.getState().deleteNote('b');
        useNotesStore.getState().addNote(createNote({ id: 'c' }));

        // Server snapshot that does not include the local changes yet
        useNotesStore.getState()._hydrateFromFirestore({ notes: [a, b], tags: [] });

        const notes = useNotesStore.getState().notes;
        expect(notes.map(n => n.id).sort()).toEqual(['a', 'c']);
        const localA = notes.find(n => n.id === 'a')!;
        expect(localA.title).toBe('Local pendente');
        expect(localA.isPinned).toBe(true);

        // Once the server echoes our write, a later remote edit wins again
        useNotesStore.getState()._hydrateFromFirestore({ notes: [localA, notes.find(n => n.id === 'c')!], tags: [] });
        const remoteUnpin = { ...localA, isPinned: false };
        useNotesStore.getState()._hydrateFromFirestore({ notes: [remoteUnpin, notes.find(n => n.id === 'c')!], tags: [] });
        expect(useNotesStore.getState().notes.find(n => n.id === 'a')!.isPinned).toBe(false);
    });
});
