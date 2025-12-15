/**
 * Reading Store - Books and folders with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Book, Folder, ReadingLog } from '../types';
import { createFirebaseStorage } from './persistMiddleware';
import { generateUUID } from '../utils/uuid';

interface ReadingState {
    books: Book[];
    folders: Folder[];
    isLoading: boolean;

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

    // Folder Actions
    setFolders: (folders: Folder[]) => void;
    addFolder: (folder: Folder) => void;
    updateFolder: (id: string, updates: Partial<Folder>) => void;
    deleteFolder: (id: string) => void;

    setLoading: (loading: boolean) => void;
}

export const useReadingStore = create<ReadingState>()(
    persist(
        (set) => ({
            books: [],
            folders: [],
            isLoading: true,

            // Book Actions
            setBooks: (books) => set({ books }),

            addBook: (book) => set((state) => ({
                books: [...state.books, book]
            })),

            updateBook: (id, updates) => set((state) => ({
                books: state.books.map(b => b.id === id ? { ...b, ...updates } : b)
            })),

            deleteBook: (id) => set((state) => ({
                books: state.books.filter(b => b.id !== id)
            })),

            updateProgress: (id, current) => set((state) => ({
                books: state.books.map(b => {
                    if (b.id !== id) return b;
                    const newStatus = current >= b.total ? 'COMPLETED' : b.status;
                    return { ...b, current, status: newStatus };
                })
            })),

            setBookStatus: (id, status) => set((state) => ({
                books: state.books.map(b => b.id === id ? { ...b, status } : b)
            })),

            setBookRating: (id, rating) => set((state) => ({
                books: state.books.map(b => b.id === id ? { ...b, rating } : b)
            })),

            moveBookToFolder: (bookId, folderId) => set((state) => ({
                books: state.books.map(b =>
                    b.id === bookId ? { ...b, folderId } : b
                )
            })),

            setDailyGoal: (id, goal) => set((state) => ({
                books: state.books.map(b => b.id === id ? { ...b, dailyGoal: goal } : b)
            })),

            addReadingLog: (id, pagesRead) => set((state) => ({
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
            })),

            // Folder Actions
            setFolders: (folders) => set({ folders }),

            addFolder: (folder) => set((state) => ({
                folders: [...state.folders, folder]
            })),

            updateFolder: (id, updates) => set((state) => ({
                folders: state.folders.map(f => f.id === id ? { ...f, ...updates } : f)
            })),

            deleteFolder: (id) => set((state) => ({
                folders: state.folders.filter(f => f.id !== id),
                // Move books from deleted folder to root
                books: state.books.map(b =>
                    b.folderId === id ? { ...b, folderId: null } : b
                )
            })),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_reading_store',
            storage: createFirebaseStorage('p67_reading_store'),
            partialize: (state) => ({ books: state.books, folders: state.folders }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate books (same id)
                if (state?.books?.length) {
                    const seen = new Set<string>();
                    const uniqueBooks = state.books.filter(b => {
                        if (seen.has(b.id)) return false;
                        seen.add(b.id);
                        return true;
                    });
                    if (uniqueBooks.length !== state.books.length) {
                        state.setBooks(uniqueBooks);
                    }
                }
                // Clean up any duplicate folders (same id)
                if (state?.folders?.length) {
                    const seen = new Set<string>();
                    const uniqueFolders = state.folders.filter(f => {
                        if (seen.has(f.id)) return false;
                        seen.add(f.id);
                        return true;
                    });
                    if (uniqueFolders.length !== state.folders.length) {
                        state.setFolders(uniqueFolders);
                    }
                }
                state?.setLoading(false);
            },
        }
    )
);
