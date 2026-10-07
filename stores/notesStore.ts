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

const mergeNotesByRecency = (baseNotes: Note[], incomingNotes: Note[]): Note[] => {
    const merged = new Map<string, Note>();

    baseNotes.forEach((note) => {
        merged.set(note.id, note);
    });

    incomingNotes.forEach((note) => {
        const current = merged.get(note.id);
        if (!current || note.updatedAt >= current.updatedAt) {
            merged.set(note.id, note);
        }
    });

    return Array.from(merged.values());
};

/**
 * Session-local bookkeeping used to reconcile remote snapshots with local
 * edits that are still inside the (long) Firestore write debounce window.
 * - dirtyNoteIds: notes created/changed locally that the server may not have yet.
 * - deletedNoteIds: notes deleted locally that the server may still contain.
 */
const dirtyNoteIds = new Set<string>();
const deletedNoteIds = new Set<string>();

// Firestore does not preserve map key order, so compare with sorted keys.
const stableStringify = (value: unknown): string => JSON.stringify(value, (_key, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
        ? Object.keys(val).sort().reduce<Record<string, unknown>>((acc, k) => { acc[k] = val[k]; return acc; }, {})
        : val
);

const markDirty = (id: string) => {
    dirtyNoteIds.add(id);
    deletedNoteIds.delete(id);
};

/**
 * Merge a remote notes snapshot into the local list after the store is initialized.
 * Remote is the source of truth, except for local changes not yet persisted.
 */
export const reconcileRemoteNotes = (localNotes: Note[], remoteNotes: Note[]): Note[] => {
    const localById = new Map(localNotes.map(n => [n.id, n]));
    const remoteIds = new Set<string>();
    const result: Note[] = [];

    remoteNotes.forEach((remote) => {
        remoteIds.add(remote.id);
        if (deletedNoteIds.has(remote.id)) return; // locally deleted, write pending

        const local = localById.get(remote.id);
        if (!local) {
            result.push(remote);
            return;
        }

        const remoteIsNewer = (remote.updatedAt ?? 0) > (local.updatedAt ?? 0);
        if (dirtyNoteIds.has(remote.id) && !remoteIsNewer) {
            // Keep the pending local version; the server caught up once both match.
            if (stableStringify(remote) === stableStringify(local)) dirtyNoteIds.delete(remote.id);
            result.push(local);
        } else {
            dirtyNoteIds.delete(remote.id);
            result.push(remote);
        }
    });

    // Local-only notes survive only if they are pending local creations/edits;
    // otherwise they were deleted on another device.
    localNotes.forEach((local) => {
        if (!remoteIds.has(local.id) && dirtyNoteIds.has(local.id)) {
            result.push(local);
        }
    });

    // Tombstones whose note is gone from the server are settled.
    deletedNoteIds.forEach((id) => {
        if (!remoteIds.has(id)) deletedNoteIds.delete(id);
    });

    return deduplicateById(result);
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
        const nextNotes = deduplicateById(notes);

        nextNotes.forEach(n => markDirty(n.id));
        set((state) => { state.notes = nextNotes; });
        get()._syncToFirestore();
    },

    addNote: (note) => {
        console.log('[notesStore] addNote:', note.id, note.title);
        markDirty(note.id);
        set((state) => { state.notes.push(note); });
        get()._syncToFirestore();
    },

    updateNote: (id, updates) => {
        markDirty(id);
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
        dirtyNoteIds.delete(id);
        deletedNoteIds.add(id);
        set((state) => {
            const idx = state.notes.findIndex(n => n.id === id);
            if (idx !== -1) state.notes.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    togglePinNote: (id) => {
        markDirty(id);
        set((state) => {
            const note = state.notes.find(n => n.id === id);
            if (note) note.isPinned = !note.isPinned;
        });
        get()._syncToFirestore();
    },

    pinNoteToTag: (noteId, tagId) => {
        markDirty(noteId);
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
        markDirty(noteId);
        set((state) => {
            const note = state.notes.find(n => n.id === noteId);
            if (!note || !note.pinnedToTags) return;
            const idx = note.pinnedToTags.indexOf(tagId);
            if (idx !== -1) note.pinnedToTags.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    setNoteColor: (id, color) => {
        markDirty(id);
        set((state) => {
            const note = state.notes.find(n => n.id === id);
            if (note) note.color = color;
        });
        get()._syncToFirestore();
    },

    addTagToNote: (noteId, tagId) => {
        markDirty(noteId);
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
        markDirty(noteId);
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
        set((state) => {
            if (!state.tags.some(existing => existing.id === tag.id)) {
                state.tags.push(tag);
            }
        });
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
                let touched = false;
                const tagRefIdx = note.tags.indexOf(id);
                if (tagRefIdx !== -1) { note.tags.splice(tagRefIdx, 1); touched = true; }

                if (note.pinnedToTags) {
                    const pinnedIdx = note.pinnedToTags.indexOf(id);
                    if (pinnedIdx !== -1) { note.pinnedToTags.splice(pinnedIdx, 1); touched = true; }
                }
                if (touched) markDirty(note.id);
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
        const { tags: localTags, notes: localNotes, _initialized } = get();

        if (!fallback) {
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
            return;
        }

        const remoteTags = fallback.tags || [];

        if (_initialized) {
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

            // Notes live in this same document: apply remote changes from other
            // devices instead of ignoring them (which also caused the next local
            // write to overwrite them), while keeping pending local edits.
            const nextNotes = Array.isArray(fallback.notes)
                ? reconcileRemoteNotes(localNotes, fallback.notes)
                : null;

            set((state) => {
                if (nextNotes) state.notes = nextNotes;
                state.tags = deduplicateById(mergedTags);
                state.isLoading = false;
            });
        } else {
            set((state) => {
                // Initialize notes from remote/local backup, keeping notes created while
                // hydration was still pending (previously they blocked remote notes from loading).
                if (fallback.notes) {
                    state.notes = mergeNotesByRecency(deduplicateById(fallback.notes), localNotes);
                }
                // Preserve tags created while the initial hydration was still pending.
                state.tags = deduplicateById([...remoteTags, ...state.tags]);
                state.isLoading = false;
                state._initialized = true;
            });

        }
    },

    _reset: () => {
        dirtyNoteIds.clear();
        deletedNoteIds.clear();
        set((state) => {
            state.notes = [];
            state.tags = [];
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));

