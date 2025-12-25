/**
 * Notes Store - Notes and tags with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Note, Tag, NoteColor } from '../types';
import { writeToFirestore, getCurrentUserId } from './firestoreSync';
import { readNamespacedStorage, writeNamespacedStorage } from '../utils/storageUtils';

const STORE_KEY = 'p67_notes_store';
const LOCAL_BACKUP_KEY = `${STORE_KEY}::backup`;

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

const readLocalBackup = (): { notes: Note[]; tags: Tag[] } | null => {
    const userId = getCurrentUserId();
    const raw = readNamespacedStorage(LOCAL_BACKUP_KEY, userId);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed?.notes && parsed?.tags) {
            return parsed;
        }
    } catch {
        // ignore malformed cache
    }
    return null;
};

const writeLocalBackup = (data: { notes: Note[]; tags: Tag[] }) => {
    const userId = getCurrentUserId();
    try {
        writeNamespacedStorage(LOCAL_BACKUP_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }), userId);
    } catch {
        // localStorage may be unavailable; ignore
    }
};

export const useNotesStore = create<NotesState>()(immer((set, get) => ({
    notes: [],
    tags: [],
    isLoading: true,
    _initialized: false,

    // Note Actions
    setNotes: (notes) => {
        set((state) => { state.notes = deduplicateById(notes); });
        get()._syncToFirestore();
    },

    addNote: (note) => {
        console.log('[notesStore] addNote:', note.id, note.title);
        set((state) => { state.notes.push(note); });
        get()._syncToFirestore();
    },

    updateNote: (id, updates) => {
        set((state) => {
            const note = state.notes.find(n => n.id === id);
            if (note) {
                Object.assign(note, updates);
                note.updatedAt = Date.now();
            }
        });
        get()._syncToFirestore();
    },

    deleteNote: (id) => {
        set((state) => {
            const idx = state.notes.findIndex(n => n.id === id);
            if (idx !== -1) state.notes.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    togglePinNote: (id) => {
        set((state) => {
            const note = state.notes.find(n => n.id === id);
            if (note) note.isPinned = !note.isPinned;
        });
        get()._syncToFirestore();
    },

    pinNoteToTag: (noteId, tagId) => {
        set((state) => {
            const note = state.notes.find(n => n.id === noteId);
            if (!note) return;
            if (!note.pinnedToTags) note.pinnedToTags = [];
            if (!note.pinnedToTags.includes(tagId)) {
                note.pinnedToTags.push(tagId);
            }
        });
        get()._syncToFirestore();
    },

    unpinNoteFromTag: (noteId, tagId) => {
        set((state) => {
            const note = state.notes.find(n => n.id === noteId);
            if (!note || !note.pinnedToTags) return;
            const idx = note.pinnedToTags.indexOf(tagId);
            if (idx !== -1) note.pinnedToTags.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    setNoteColor: (id, color) => {
        set((state) => {
            const note = state.notes.find(n => n.id === id);
            if (note) note.color = color;
        });
        get()._syncToFirestore();
    },

    addTagToNote: (noteId, tagId) => {
        set((state) => {
            const note = state.notes.find(n => n.id === noteId);
            if (!note) return;
            if (!note.tags.includes(tagId)) {
                note.tags.push(tagId);
            }
        });
        get()._syncToFirestore();
    },

    removeTagFromNote: (noteId, tagId) => {
        set((state) => {
            const note = state.notes.find(n => n.id === noteId);
            if (!note) return;
            const idx = note.tags.indexOf(tagId);
            if (idx !== -1) note.tags.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    // Tag Actions
    setTags: (tags) => {
        set((state) => { state.tags = deduplicateById(tags); });
        get()._syncToFirestore();
    },

    addTag: (tag) => {
        set((state) => { state.tags.push(tag); });
        get()._syncToFirestore();
    },

    updateTag: (id, updates) => {
        set((state) => {
            const tag = state.tags.find(t => t.id === id);
            if (tag) Object.assign(tag, updates);
        });
        get()._syncToFirestore();
    },

    deleteTag: (id) => {
        set((state) => {
            // Remove tag from tags list
            const tagIdx = state.tags.findIndex(t => t.id === id);
            if (tagIdx !== -1) state.tags.splice(tagIdx, 1);

            // Remove tag references from all notes
            for (const note of state.notes) {
                const tagRefIdx = note.tags.indexOf(id);
                if (tagRefIdx !== -1) note.tags.splice(tagRefIdx, 1);

                if (note.pinnedToTags) {
                    const pinnedIdx = note.pinnedToTags.indexOf(id);
                    if (pinnedIdx !== -1) note.pinnedToTags.splice(pinnedIdx, 1);
                }
            }
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    _syncToFirestore: () => {
        const { notes, tags, _initialized } = get();
        const userId = getCurrentUserId();
        const payload = { notes, tags };

        console.log('[notesStore] _syncToFirestore:', { noteCount: notes.length, tagCount: tags.length, _initialized, userId });

        // Always keep a local backup to avoid data loss if Firestore is temporarily unavailable
        writeLocalBackup(payload);

        if (!userId) {
            console.warn('[notesStore] Cannot sync - no userId');
            return;
        }

        if (_initialized) {
            writeToFirestore(STORE_KEY, payload);
        }
    },

    _hydrateFromFirestore: (data) => {
        const fallback = data || readLocalBackup();
        const { notes: localNotes, tags: localTags, _initialized } = get();

        if (!fallback) {
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
            return;
        }

        const remoteNotes = fallback.notes || [];
        const remoteTags = fallback.tags || [];

        console.log('[notesStore] _hydrateFromFirestore:', {
            remoteNotes: remoteNotes.length,
            localNotes: localNotes.length,
            _initialized
        });

        // Se já foi inicializado, fazer merge inteligente para evitar sobrescrever dados locais pendentes
        if (_initialized) {
            // Merge notes: comparar updatedAt para decidir qual versão manter
            const remoteNoteMap = new Map(remoteNotes.map((n: Note) => [n.id, n]));
            const localNoteIds = new Set(localNotes.map(n => n.id));

            const mergedNotes = localNotes.map(localNote => {
                const remoteNote = remoteNoteMap.get(localNote.id);
                if (!remoteNote) return localNote; // Nova nota local, manter
                // Remoto mais recente = usar remoto, senão manter local
                return remoteNote.updatedAt > localNote.updatedAt ? remoteNote : localNote;
            });

            // Adicionar notas remotas que não existem localmente
            remoteNotes.forEach((rn: Note) => {
                if (!localNoteIds.has(rn.id)) {
                    mergedNotes.push(rn);
                }
            });

            // Merge tags: similar lógica
            const remoteTagMap = new Map(remoteTags.map((t: Tag) => [t.id, t]));
            const localTagIds = new Set(localTags.map(t => t.id));

            const mergedTags = localTags.map(localTag => {
                const remoteTag = remoteTagMap.get(localTag.id);
                if (!remoteTag) return localTag;
                return remoteTag;
            });

            remoteTags.forEach((rt: Tag) => {
                if (!localTagIds.has(rt.id)) {
                    mergedTags.push(rt);
                }
            });

            set((state) => {
                state.notes = deduplicateById(mergedNotes);
                state.tags = deduplicateById(mergedTags);
                state.isLoading = false;
            });
        } else {
            // Primeira hidratação: usar dados remotos diretamente
            set((state) => {
                state.notes = deduplicateById(remoteNotes);
                state.tags = deduplicateById(remoteTags);
                state.isLoading = false;
                state._initialized = true;
            });
        }
    },

    _reset: () => {
        set((state) => {
            state.notes = [];
            state.tags = [];
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));

