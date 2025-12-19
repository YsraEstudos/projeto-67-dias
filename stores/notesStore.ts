/**
 * Notes Store - Notes and tags with Firestore-first persistence
 */
import { create } from 'zustand';
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

/**
 * Remove undefined values from object (Firestore doesn't accept undefined)
 */
const removeUndefined = <T extends object>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
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
        console.log('[notesStore] addNote:', note.id, note.title);
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
        const userId = getCurrentUserId();
        // Remove undefined values - Firestore doesn't accept them
        const payload = removeUndefined({ notes, tags });

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
            set({ isLoading: false, _initialized: true });
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

            set({
                notes: deduplicateById(mergedNotes),
                tags: deduplicateById(mergedTags),
                isLoading: false
            });
        } else {
            // Primeira hidratação: usar dados remotos diretamente
            set({
                notes: deduplicateById(remoteNotes),
                tags: deduplicateById(remoteTags),
                isLoading: false,
                _initialized: true
            });
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
