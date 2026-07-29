import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useReadingStore } from '../../stores/readingStore';
import { getTodayISO } from '../../utils/dateUtils';

const createBook = () => ({
    id: 'book-1',
    title: 'Livro teste',
    author: 'Autor teste',
    genre: 'Estudo',
    unit: 'PAGES' as const,
    total: 144,
    current: 0,
    status: 'READING' as const,
    rating: 0,
    folderId: null,
    notes: '',
    addedAt: getTodayISO(),
    dailyGoal: 20,
    logs: [],
});

describe('readingStore', () => {
    beforeEach(() => {
        useReadingStore.getState()._reset();
        useReadingStore.getState()._hydrateFromFirestore({
            books: [createBook()],
            folders: [],
        });
    });

    it('creates a log for today when progress increases', () => {
        const today = getTodayISO();

        useReadingStore.getState().updateProgress('book-1', 20);

        const book = useReadingStore.getState().books[0];

        expect(book.current).toBe(20);
        expect(book.logs).toHaveLength(1);
        expect(book.logs?.[0]).toMatchObject({
            date: today,
            pagesRead: 20,
            bookId: 'book-1',
        });
    });

    it('accumulates multiple increases on the same day', () => {
        useReadingStore.getState().updateProgress('book-1', 8);
        useReadingStore.getState().updateProgress('book-1', 20);

        const book = useReadingStore.getState().books[0];

        expect(book.current).toBe(20);
        expect(book.logs).toHaveLength(1);
        expect(book.logs?.[0]?.pagesRead).toBe(20);
    });

    it('reduces the daily log when progress goes down without going negative', () => {
        useReadingStore.getState().updateProgress('book-1', 10);
        useReadingStore.getState().updateProgress('book-1', 25);
        useReadingStore.getState().updateProgress('book-1', 12);
        useReadingStore.getState().updateProgress('book-1', 0);

        const book = useReadingStore.getState().books[0];

        expect(book.current).toBe(0);
        expect(book.logs).toHaveLength(1);
        expect(book.logs?.[0]?.pagesRead).toBe(0);
    });

    it('keeps today log when the book is completed on the same day', () => {
        useReadingStore.getState().updateProgress('book-1', 144);

        const book = useReadingStore.getState().books[0];

        expect(book.status).toBe('COMPLETED');
        expect(book.current).toBe(144);
        expect(book.logs).toHaveLength(1);
        expect(book.logs?.[0]?.pagesRead).toBe(144);
    });

    it('migrates books without shelf metadata to the first named level', () => {
        const book = useReadingStore.getState().books[0];

        expect(useReadingStore.getState().shelfLevels).toHaveLength(3);
        expect(book.shelfLevelId).toBe('shelf-level-1');
        expect(book.shelfPosition).toBe(0);
    });

    it('renames and creates levels without changing the single-shelf model', () => {
        const store = useReadingStore.getState();
        const newLevelId = store.addShelfLevel('Livros de TI');
        store.updateShelfLevel(newLevelId, { name: 'Livro de TI' });

        const level = useReadingStore.getState().shelfLevels.find((candidate) => candidate.id === newLevelId);
        expect(level).toMatchObject({ id: newLevelId, name: 'Livro de TI' });
        expect(useReadingStore.getState().shelfLevels).toHaveLength(4);
    });

    it('moves a book to another level and appends it without rewriting on pointer moves', () => {
        const secondBook = { ...createBook(), id: 'book-2', title: 'Segundo livro' };
        useReadingStore.getState().setBooks([
            { ...createBook(), shelfLevelId: 'shelf-level-1', shelfPosition: 0 },
            { ...secondBook, shelfLevelId: 'shelf-level-2', shelfPosition: 0 },
        ]);

        useReadingStore.getState().moveBookToShelfLevel('book-1', 'shelf-level-2');

        const books = useReadingStore.getState().books;
        expect(books.find((book) => book.id === 'book-1')).toMatchObject({
            shelfLevelId: 'shelf-level-2',
            shelfPosition: 1,
        });
        expect(books.find((book) => book.id === 'book-2')).toMatchObject({
            shelfLevelId: 'shelf-level-2',
            shelfPosition: 0,
        });
    });

    it('reassigns books before removing a level', () => {
        const store = useReadingStore.getState();
        store.setBooks([{ ...createBook(), shelfLevelId: 'shelf-level-2', shelfPosition: 0 }]);
        store.deleteShelfLevel('shelf-level-2');

        expect(useReadingStore.getState().shelfLevels.some((level) => level.id === 'shelf-level-2')).toBe(false);
        expect(useReadingStore.getState().books[0].shelfLevelId).toBe('shelf-level-1');
    });
});
