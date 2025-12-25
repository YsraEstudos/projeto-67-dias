/**
 * Reading Store - Books and folders with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Book, Folder, ReadingLog } from '../types';
import { writeToFirestore } from './firestoreSync';
import { generateUUID } from '../utils/uuid';
import { getTodayISO } from '../utils/dateUtils';

const STORE_KEY = 'p67_reading_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface ReadingState {
    books: Book[];
    folders: Folder[];
    isLoading: boolean;
    _initialized: boolean;

    // Book Actions
    setBooks: (books: Book[]) => void;
    addBook: (book: Book) => void;
    updateBook: (id: string, updates: Partial<Book>) => void;
    deleteBook: (id: string) => void;
    updateProgress: (id: string, current: number) => void;
    setBookStatus: (id: string, status: Book['status']) => void;
    setBookRating: (id: string, rating: number) => void;
    moveBookToFolder: (bookId: string, folderId: string | null) => void;
    setDailyGoal: (id: string, goal: number) => void;
    addReadingLog: (id: string, pagesRead: number) => void;

    // Exponential Distribution Actions
    setBookDeadline: (id: string, deadline: string | undefined) => void;
    setDistributionType: (id: string, type: 'LINEAR' | 'EXPONENTIAL') => void;
    toggleExcludedDay: (id: string, dayOfWeek: number) => void;
    setExcludedDays: (id: string, days: number[]) => void;
    setExponentialIntensity: (id: string, intensity: number) => void;

    // Folder Actions
    setFolders: (folders: Folder[]) => void;
    addFolder: (folder: Folder) => void;
    updateFolder: (id: string, updates: Partial<Folder>) => void;
    deleteFolder: (id: string) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { books: Book[]; folders: Folder[] } | null) => void;
    _reset: () => void;
}

export const useReadingStore = create<ReadingState>()(immer((set, get) => ({
    books: [],
    folders: [],
    isLoading: true,
    _initialized: false,

    setBooks: (books) => {
        set((state) => { state.books = deduplicateById(books); });
        get()._syncToFirestore();
    },

    addBook: (book) => {
        set((state) => { state.books.push(book); });
        get()._syncToFirestore();
    },

    updateBook: (id, updates) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) Object.assign(book, updates);
        });
        get()._syncToFirestore();
    },

    deleteBook: (id) => {
        set((state) => {
            const idx = state.books.findIndex(b => b.id === id);
            if (idx !== -1) state.books.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    updateProgress: (id, current) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) {
                book.current = current;
                if (current >= book.total) book.status = 'COMPLETED';
            }
        });
        get()._syncToFirestore();
    },

    setBookStatus: (id, status) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) book.status = status;
        });
        get()._syncToFirestore();
    },

    setBookRating: (id, rating) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) book.rating = rating;
        });
        get()._syncToFirestore();
    },

    moveBookToFolder: (bookId, folderId) => {
        set((state) => {
            const book = state.books.find(b => b.id === bookId);
            if (book) book.folderId = folderId;
        });
        get()._syncToFirestore();
    },

    setDailyGoal: (id, goal) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) book.dailyGoal = goal;
        });
        get()._syncToFirestore();
    },

    addReadingLog: (id, pagesRead) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (!book) return;

            const today = getTodayISO();
            if (!book.logs) book.logs = [];

            const existingLog = book.logs.find(l => l.date === today);
            if (existingLog) {
                existingLog.pagesRead += pagesRead;
            } else {
                book.logs.push({
                    id: generateUUID(),
                    date: today,
                    pagesRead,
                    bookId: id
                });
            }
            book.current = Math.min(book.total, book.current + pagesRead);
        });
        get()._syncToFirestore();
    },

    // Exponential Distribution Actions
    setBookDeadline: (id, deadline) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) book.deadline = deadline;
        });
        get()._syncToFirestore();
    },

    setDistributionType: (id, type) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) book.distributionType = type;
        });
        get()._syncToFirestore();
    },

    toggleExcludedDay: (id, dayOfWeek) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (!book) return;
            if (!book.excludedDays) book.excludedDays = [];

            const idx = book.excludedDays.indexOf(dayOfWeek);
            if (idx >= 0) {
                book.excludedDays.splice(idx, 1);
            } else {
                book.excludedDays.push(dayOfWeek);
                book.excludedDays.sort();
            }
        });
        get()._syncToFirestore();
    },

    setExcludedDays: (id, days) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) book.excludedDays = days.sort();
        });
        get()._syncToFirestore();
    },

    setExponentialIntensity: (id, intensity) => {
        set((state) => {
            const book = state.books.find(b => b.id === id);
            if (book) book.exponentialIntensity = intensity;
        });
        get()._syncToFirestore();
    },

    setFolders: (folders) => {
        set((state) => { state.folders = deduplicateById(folders); });
        get()._syncToFirestore();
    },

    addFolder: (folder) => {
        set((state) => { state.folders.push(folder); });
        get()._syncToFirestore();
    },

    updateFolder: (id, updates) => {
        set((state) => {
            const folder = state.folders.find(f => f.id === id);
            if (folder) Object.assign(folder, updates);
        });
        get()._syncToFirestore();
    },

    deleteFolder: (id) => {
        set((state) => {
            const folderIdx = state.folders.findIndex(f => f.id === id);
            if (folderIdx !== -1) state.folders.splice(folderIdx, 1);

            // Remove folder reference from books
            for (const book of state.books) {
                if (book.folderId === id) book.folderId = null;
            }
        });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

    _syncToFirestore: () => {
        const { books, folders, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { books, folders });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set((state) => {
                state.books = deduplicateById(data.books || []);
                state.folders = deduplicateById(data.folders || []);
                state.isLoading = false;
                state._initialized = true;
            });
        } else {
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
        }
    },

    _reset: () => {
        set((state) => {
            state.books = [];
            state.folders = [];
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));

