/**
 * Reading Store - Books and folders with Firestore-first persistence
 */
import { create } from 'zustand';
import { Book, Folder, ReadingLog } from '../types';
import { writeToFirestore } from './firestoreSync';
import { generateUUID } from '../utils/uuid';

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

export const useReadingStore = create<ReadingState>()((set, get) => ({
    books: [],
    folders: [],
    isLoading: true,
    _initialized: false,

    setBooks: (books) => {
        set({ books: deduplicateById(books) });
        get()._syncToFirestore();
    },

    addBook: (book) => {
        set((state) => ({ books: [...state.books, book] }));
        get()._syncToFirestore();
    },

    updateBook: (id, updates) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, ...updates } : b)
        }));
        get()._syncToFirestore();
    },

    deleteBook: (id) => {
        set((state) => ({ books: state.books.filter(b => b.id !== id) }));
        get()._syncToFirestore();
    },

    updateProgress: (id, current) => {
        set((state) => ({
            books: state.books.map(b => {
                if (b.id !== id) return b;
                const newStatus = current >= b.total ? 'COMPLETED' : b.status;
                return { ...b, current, status: newStatus };
            })
        }));
        get()._syncToFirestore();
    },

    setBookStatus: (id, status) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, status } : b)
        }));
        get()._syncToFirestore();
    },

    setBookRating: (id, rating) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, rating } : b)
        }));
        get()._syncToFirestore();
    },

    moveBookToFolder: (bookId, folderId) => {
        set((state) => ({
            books: state.books.map(b => b.id === bookId ? { ...b, folderId } : b)
        }));
        get()._syncToFirestore();
    },

    setDailyGoal: (id, goal) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, dailyGoal: goal } : b)
        }));
        get()._syncToFirestore();
    },

    addReadingLog: (id, pagesRead) => {
        set((state) => ({
            books: state.books.map(book => {
                if (book.id !== id) return book;
                const today = new Date().toISOString().split('T')[0];
                const existingLog = book.logs?.find(l => l.date === today);

                if (existingLog) {
                    return {
                        ...book,
                        current: Math.min(book.total, book.current + pagesRead),
                        logs: book.logs?.map(l =>
                            l.date === today ? { ...l, pagesRead: l.pagesRead + pagesRead } : l
                        )
                    };
                }

                return {
                    ...book,
                    current: Math.min(book.total, book.current + pagesRead),
                    logs: [...(book.logs || []), {
                        id: generateUUID(),
                        date: today,
                        pagesRead,
                        bookId: id
                    }]
                };
            })
        }));
        get()._syncToFirestore();
    },

    // Exponential Distribution Actions
    setBookDeadline: (id, deadline) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, deadline } : b)
        }));
        get()._syncToFirestore();
    },

    setDistributionType: (id, type) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, distributionType: type } : b)
        }));
        get()._syncToFirestore();
    },

    toggleExcludedDay: (id, dayOfWeek) => {
        set((state) => ({
            books: state.books.map(b => {
                if (b.id !== id) return b;
                const currentDays = b.excludedDays || [];
                const newDays = currentDays.includes(dayOfWeek)
                    ? currentDays.filter(d => d !== dayOfWeek)
                    : [...currentDays, dayOfWeek].sort();
                return { ...b, excludedDays: newDays };
            })
        }));
        get()._syncToFirestore();
    },

    setExcludedDays: (id, days) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, excludedDays: days.sort() } : b)
        }));
        get()._syncToFirestore();
    },

    setExponentialIntensity: (id, intensity) => {
        set((state) => ({
            books: state.books.map(b => b.id === id ? { ...b, exponentialIntensity: intensity } : b)
        }));
        get()._syncToFirestore();
    },

    setFolders: (folders) => {
        set({ folders: deduplicateById(folders) });
        get()._syncToFirestore();
    },

    addFolder: (folder) => {
        set((state) => ({ folders: [...state.folders, folder] }));
        get()._syncToFirestore();
    },

    updateFolder: (id, updates) => {
        set((state) => ({
            folders: state.folders.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
        get()._syncToFirestore();
    },

    deleteFolder: (id) => {
        set((state) => ({
            folders: state.folders.filter(f => f.id !== id),
            books: state.books.map(b => b.folderId === id ? { ...b, folderId: null } : b)
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { books, folders, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { books, folders });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            set({
                books: deduplicateById(data.books || []),
                folders: deduplicateById(data.folders || []),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ books: [], folders: [], isLoading: true, _initialized: false });
    }
}));
