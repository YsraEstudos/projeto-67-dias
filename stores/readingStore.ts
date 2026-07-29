/**
 * Reading Store - Books and folders with Firestore-first persistence
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Book, Folder, ReadingLog, ReadingShelfLevel } from '../types';
import { writeToFirestore } from './firestoreSync';
import { generateUUID } from '../utils/uuid';
import { getTodayISO } from '../utils/dateUtils';
import {
    createDefaultShelfLevels,
    moveBookToShelfLevel,
    normalizeBookShelfAssignments,
    normalizeShelfLevels,
} from '../utils/readingShelfLayout';

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
    shelfLevels: ReadingShelfLevel[];
    isLoading: boolean;
    _initialized: boolean;

    // Book Actions
    setBooks: (books: Book[]) => void;
    setShelfLevels: (levels: ReadingShelfLevel[]) => void;
    addShelfLevel: (name?: string) => string;
    updateShelfLevel: (id: string, updates: Partial<Pick<ReadingShelfLevel, 'name' | 'position'>>) => void;
    deleteShelfLevel: (id: string) => void;
    moveBookToShelfLevel: (bookId: string, shelfLevelId: string, position?: number) => void;
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
    _hydrateFromFirestore: (data: { books: Book[]; folders: Folder[]; shelfLevels?: ReadingShelfLevel[] } | null) => void;
    _reset: () => void;
}

export const useReadingStore = create<ReadingState>()(immer((set, get) => ({
    books: [],
    folders: [],
    shelfLevels: createDefaultShelfLevels(),
    isLoading: true,
    _initialized: false,

    setBooks: (books) => {
        set((state) => { state.books = normalizeBookShelfAssignments(deduplicateById(books), state.shelfLevels); });
        get()._syncToFirestore();
    },

    setShelfLevels: (levels) => {
        const normalizedLevels = normalizeShelfLevels(levels);
        set((state) => {
            state.shelfLevels = normalizedLevels;
            state.books = normalizeBookShelfAssignments(state.books, normalizedLevels);
        });
        get()._syncToFirestore();
    },

    addShelfLevel: (name) => {
        const id = generateUUID();
        set((state) => {
            state.shelfLevels.push({
                id,
                name: name?.trim() || `Estante ${state.shelfLevels.length + 1}`,
                position: state.shelfLevels.length,
            });
        });
        get()._syncToFirestore();
        return id;
    },

    updateShelfLevel: (id, updates) => {
        set((state) => {
            const level = state.shelfLevels.find((candidate) => candidate.id === id);
            if (!level) return;
            if (updates.name !== undefined) level.name = updates.name.trim() || level.name;
            if (updates.position !== undefined && Number.isFinite(updates.position)) {
                level.position = Math.max(0, updates.position);
            }
            state.shelfLevels = normalizeShelfLevels(state.shelfLevels);
        });
        get()._syncToFirestore();
    },

    deleteShelfLevel: (id) => {
        const currentLevels = get().shelfLevels;
        if (currentLevels.length <= 1) return;
        const remainingLevel = currentLevels.find((level) => level.id !== id);
        if (!remainingLevel) return;

        set((state) => {
            state.shelfLevels = normalizeShelfLevels(state.shelfLevels.filter((level) => level.id !== id));
            let nextPosition = state.books.filter((book) => book.shelfLevelId === remainingLevel.id).length;
            state.books = state.books.map((book) => {
                if (book.shelfLevelId !== id) return book;
                return { ...book, shelfLevelId: remainingLevel.id, shelfPosition: nextPosition++ };
            });
            state.books = normalizeBookShelfAssignments(state.books, state.shelfLevels);
        });
        get()._syncToFirestore();
    },

    moveBookToShelfLevel: (bookId, shelfLevelId, position) => {
        if (!get().shelfLevels.some((level) => level.id === shelfLevelId)) return;
        const nextBooks = moveBookToShelfLevel(get().books, bookId, shelfLevelId, position);
        set((state) => { state.books = nextBooks; });
        get()._syncToFirestore();
    },

    addBook: (book) => {
        set((state) => {
            state.books = normalizeBookShelfAssignments([...state.books, book], state.shelfLevels);
        });
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
                const delta = current - book.current;
                const today = getTodayISO();

                if (!book.logs) book.logs = [];

                if (delta !== 0) {
                    const existingLog = book.logs.find(log => log.date === today);

                    if (existingLog) {
                        existingLog.pagesRead = Math.max(0, existingLog.pagesRead + delta);
                    } else if (delta > 0) {
                        book.logs.push({
                            id: generateUUID(),
                            date: today,
                            pagesRead: delta,
                            bookId: id
                        });
                    }
                }

                book.current = current;
                // Only auto-complete when total is explicitly > 0.
                // If total=0 (not configured), we DON'T auto-complete — the book
                // would incorrectly be set to COMPLETED on the very first progress update,
                // removing it from XP calculations entirely.
                if (book.total > 0 && current >= book.total) book.status = 'COMPLETED';
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
        const { books, folders, shelfLevels, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { books, folders, shelfLevels });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            const shelfLevels = normalizeShelfLevels(data.shelfLevels);
            set((state) => {
                state.books = normalizeBookShelfAssignments(deduplicateById(data.books || []), shelfLevels);
                state.folders = deduplicateById(data.folders || []);
                state.shelfLevels = shelfLevels;
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
            state.shelfLevels = createDefaultShelfLevels();
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));

