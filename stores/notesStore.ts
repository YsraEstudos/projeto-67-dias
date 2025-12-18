/**
 * Notes Store - Notes and tags with Firestore-first persistence
 */
import { create } from 'zustand';
import { Note, Tag, NoteColor } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_notes_store';

/**
 * Deduplicate items by ID
 */
const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface NotesState {
    notes: Note[];
    tags: Tag[];
    isLoading: boolean;
    _initialized: boolean;

    // Note Actions
    setNotes: (notes: Note[]) => void;
    addNote: (note: Note) => void;
    updateNote: (id: string, updates: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    togglePinNote: (id: string) => void;
    pinNoteToTag: (noteId: string, tagId: string) => void;
    unpinNoteFromTag: (noteId: string, tagId: string) => void;
    setNoteColor: (id: string, color: NoteColor) => void;
    addTagToNote: (noteId: string, tagId: string) => void;
    removeTagFromNote: (noteId: string, tagId: string) => void;

    // Tag Actions
    setTags: (tags: Tag[]) => void;
    addTag: (tag: Tag) => void;
    updateTag: (id: string, updates: Partial<Tag>) => void;
    deleteTag: (id: string) => void;

    setLoading: (loading: boolean) => void;

    // Internal sync methods
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { notes: Note[]; tags: Tag[] } | null) => void;
    _reset: () => void;
}

export const useNotesStore = create<NotesState>()((set, get) => ({
    notes: [],
    tags: [],
    isLoading: true,
    _initialized: false,

    // Note Actions
    setNotes: (notes) => {
        set({ notes: deduplicateById(notes) });
        get()._syncToFirestore();
    },

    addNote: (note) => {
        set((state) => ({
            notes: [...state.notes, note]
        }));
        get()._syncToFirestore();
    },

    updateNote: (id, updates) => {
        set((state) => ({
            notes: state.notes.map(n =>
                n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
            )
        }));
        get()._syncToFirestore();
    },

    deleteNote: (id) => {
        set((state) => ({
            notes: state.notes.filter(n => n.id !== id)
        }));
        get()._syncToFirestore();
    },

    togglePinNote: (id) => {
        set((state) => ({
            notes: state.notes.map(n =>
                n.id === id ? { ...n, isPinned: !n.isPinned } : n
            )
        }));
        get()._syncToFirestore();
    },

    pinNoteToTag: (noteId, tagId) => {
        set((state) => ({
            notes: state.notes.map(n => {
                if (n.id !== noteId) return n;
                const pinnedToTags = n.pinnedToTags || [];
                if (pinnedToTags.includes(tagId)) return n;
                return { ...n, pinnedToTags: [...pinnedToTags, tagId] };
            })
        }));
        get()._syncToFirestore();
    },

    unpinNoteFromTag: (noteId, tagId) => {
        set((state) => ({
            notes: state.notes.map(n => {
                if (n.id !== noteId) return n;
                return {
                    ...n,
                    pinnedToTags: (n.pinnedToTags || []).filter(t => t !== tagId)
                };
            })
        }));
        get()._syncToFirestore();
    },

    setNoteColor: (id, color) => {
        set((state) => ({
            notes: state.notes.map(n => n.id === id ? { ...n, color } : n)
        }));
        get()._syncToFirestore();
    },

    addTagToNote: (noteId, tagId) => {
        set((state) => ({
            notes: state.notes.map(n => {
                if (n.id !== noteId) return n;
                if (n.tags.includes(tagId)) return n;
                return { ...n, tags: [...n.tags, tagId] };
            })
        }));
        get()._syncToFirestore();
    },

    removeTagFromNote: (noteId, tagId) => {
        set((state) => ({
            notes: state.notes.map(n => {
                if (n.id !== noteId) return n;
                return { ...n, tags: n.tags.filter(t => t !== tagId) };
            })
        }));
        get()._syncToFirestore();
    },

    // Tag Actions
    setTags: (tags) => {
        set({ tags: deduplicateById(tags) });
        get()._syncToFirestore();
    },

    addTag: (tag) => {
        set((state) => ({
            tags: [...state.tags, tag]
        }));
        get()._syncToFirestore();
    },

    updateTag: (id, updates) => {
        set((state) => ({
            tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
        get()._syncToFirestore();
    },

    deleteTag: (id) => {
        set((state) => ({
            tags: state.tags.filter(t => t.id !== id),
            notes: state.notes.map(n => ({
                ...n,
                tags: n.tags.filter(t => t !== id),
                pinnedToTags: (n.pinnedToTags || []).filter(t => t !== id)
            }))
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { notes, tags, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { notes, tags });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                notes: deduplicateById(data.notes || []),
                tags: deduplicateById(data.tags || []),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({
            notes: [],
            tags: [],
            isLoading: true,
            _initialized: false
        });
    }
}));
