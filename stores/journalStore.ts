/**
 * Journal Store - Journal entries with Firestore-first persistence
 */
import { create } from 'zustand';
import { writeToFirestore } from './firestoreSync';
import { Mood } from '../types';

const STORE_KEY = 'p67_journal_store';

export interface JournalEntry {
    id: string;
    date: string;
    content: string;
    mood?: Mood;
    tags?: string[];
    createdAt: number;
    updatedAt: number;
}

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface JournalState {
    entries: JournalEntry[];
    isLoading: boolean;
    _initialized: boolean;

    // Entry Actions
    setEntries: (entries: JournalEntry[]) => void;
    addEntry: (entry: JournalEntry) => void;
    updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
    deleteEntry: (id: string) => void;

    // Helpers
    getEntryByDate: (date: string) => JournalEntry | undefined;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { entries: JournalEntry[] } | null) => void;
    _reset: () => void;
}

export const useJournalStore = create<JournalState>()((set, get) => ({
    entries: [],
    isLoading: true,
    _initialized: false,

    setEntries: (entries) => {
        set({ entries: deduplicateById(entries) });
        get()._syncToFirestore();
    },

    addEntry: (entry) => {
        set((state) => ({ entries: [...state.entries, entry] }));
        get()._syncToFirestore();
    },

    updateEntry: (id, updates) => {
        set((state) => ({
            entries: state.entries.map(e =>
                e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
            )
        }));
        get()._syncToFirestore();
    },

    deleteEntry: (id) => {
        set((state) => ({ entries: state.entries.filter(e => e.id !== id) }));
        get()._syncToFirestore();
    },

    getEntryByDate: (date) => get().entries.find(e => e.date === date),

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { entries, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { entries });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                entries: deduplicateById(data.entries || []),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ entries: [], isLoading: true, _initialized: false });
    }
}));
