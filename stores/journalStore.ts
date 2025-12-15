/**
 * Journal Store - Journal entries with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFirebaseStorage } from './persistMiddleware';

import { Mood } from '../types';

export interface JournalEntry {
    id: string;
    date: string;
    content: string;
    mood?: Mood;
    tags?: string[];
    createdAt: number;
    updatedAt: number;
}

interface JournalState {
    entries: JournalEntry[];
    isLoading: boolean;

    // Entry Actions
    setEntries: (entries: JournalEntry[]) => void;
    addEntry: (entry: JournalEntry) => void;
    updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
    deleteEntry: (id: string) => void;

    // Helpers
    getEntryByDate: (date: string) => JournalEntry | undefined;

    setLoading: (loading: boolean) => void;
}

export const useJournalStore = create<JournalState>()(
    persist(
        (set, get) => ({
            entries: [],
            isLoading: true,

            // Entry Actions
            setEntries: (entries) => set({ entries }),

            addEntry: (entry) => set((state) => ({
                entries: [...state.entries, entry]
            })),

            updateEntry: (id, updates) => set((state) => ({
                entries: state.entries.map(e =>
                    e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
                )
            })),

            deleteEntry: (id) => set((state) => ({
                entries: state.entries.filter(e => e.id !== id)
            })),

            // Helpers
            getEntryByDate: (date) => {
                return get().entries.find(e => e.date === date);
            },

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_journal_store',
            storage: createFirebaseStorage('p67_journal_store'),
            partialize: (state) => ({ entries: state.entries }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate entries (same id)
                if (state?.entries?.length) {
                    const seen = new Set<string>();
                    const uniqueEntries = state.entries.filter(e => {
                        if (seen.has(e.id)) {
                            return false; // Skip duplicate
                        }
                        seen.add(e.id);
                        return true;
                    });

                    if (uniqueEntries.length !== state.entries.length) {
                        // There were duplicates, update the store
                        state.setEntries(uniqueEntries);
                    }
                }
                state?.setLoading(false);
            },
        }
    )
);
