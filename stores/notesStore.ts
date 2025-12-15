/**
 * Notes Store - Notes and tags with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, Tag, NoteColor } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface NotesState {
    notes: Note[];
    tags: Tag[];
    isLoading: boolean;

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
}

export const useNotesStore = create<NotesState>()(
    persist(
        (set) => ({
            notes: [],
            tags: [],
            isLoading: true,

            // Note Actions
            setNotes: (notes) => set({ notes }),

            addNote: (note) => set((state) => ({
                notes: [...state.notes, note]
            })),

            updateNote: (id, updates) => set((state) => ({
                notes: state.notes.map(n =>
                    n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
                )
            })),

            deleteNote: (id) => set((state) => ({
                notes: state.notes.filter(n => n.id !== id)
            })),

            togglePinNote: (id) => set((state) => ({
                notes: state.notes.map(n =>
                    n.id === id ? { ...n, isPinned: !n.isPinned } : n
                )
            })),

            pinNoteToTag: (noteId, tagId) => set((state) => ({
                notes: state.notes.map(n => {
                    if (n.id !== noteId) return n;
                    const pinnedToTags = n.pinnedToTags || [];
                    if (pinnedToTags.includes(tagId)) return n;
                    return { ...n, pinnedToTags: [...pinnedToTags, tagId] };
                })
            })),

            unpinNoteFromTag: (noteId, tagId) => set((state) => ({
                notes: state.notes.map(n => {
                    if (n.id !== noteId) return n;
                    return {
                        ...n,
                        pinnedToTags: (n.pinnedToTags || []).filter(t => t !== tagId)
                    };
                })
            })),

            setNoteColor: (id, color) => set((state) => ({
                notes: state.notes.map(n => n.id === id ? { ...n, color } : n)
            })),

            addTagToNote: (noteId, tagId) => set((state) => ({
                notes: state.notes.map(n => {
                    if (n.id !== noteId) return n;
                    if (n.tags.includes(tagId)) return n;
                    return { ...n, tags: [...n.tags, tagId] };
                })
            })),

            removeTagFromNote: (noteId, tagId) => set((state) => ({
                notes: state.notes.map(n => {
                    if (n.id !== noteId) return n;
                    return { ...n, tags: n.tags.filter(t => t !== tagId) };
                })
            })),

            // Tag Actions
            setTags: (tags) => set({ tags }),

            addTag: (tag) => set((state) => ({
                tags: [...state.tags, tag]
            })),

            updateTag: (id, updates) => set((state) => ({
                tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t)
            })),

            deleteTag: (id) => set((state) => ({
                tags: state.tags.filter(t => t.id !== id),
                // Remove tag from all notes
                notes: state.notes.map(n => ({
                    ...n,
                    tags: n.tags.filter(t => t !== id),
                    pinnedToTags: (n.pinnedToTags || []).filter(t => t !== id)
                }))
            })),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_notes_store',
            storage: createFirebaseStorage('p67_notes_store'),
            partialize: (state) => ({ notes: state.notes, tags: state.tags }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate notes (same id)
                if (state?.notes?.length) {
                    const seen = new Set<string>();
                    const uniqueNotes = state.notes.filter(n => {
                        if (seen.has(n.id)) return false;
                        seen.add(n.id);
                        return true;
                    });
                    if (uniqueNotes.length !== state.notes.length) {
                        state.setNotes(uniqueNotes);
                    }
                }
                // Clean up any duplicate tags (same id)
                if (state?.tags?.length) {
                    const seen = new Set<string>();
                    const uniqueTags = state.tags.filter(t => {
                        if (seen.has(t.id)) return false;
                        seen.add(t.id);
                        return true;
                    });
                    if (uniqueTags.length !== state.tags.length) {
                        state.setTags(uniqueTags);
                    }
                }
                state?.setLoading(false);
            },
        }
    )
);
