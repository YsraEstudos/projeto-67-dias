import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAulasStore } from '../../stores/aulasStore';

const {
    writeToFirestoreMock,
    writeItemToSubcollectionMock,
    deleteItemFromSubcollectionMock,
    getCurrentUserIdMock,
} = vi.hoisted(() => ({
    writeToFirestoreMock: vi.fn(),
    writeItemToSubcollectionMock: vi.fn(() => Promise.resolve()),
    deleteItemFromSubcollectionMock: vi.fn(() => Promise.resolve()),
    getCurrentUserIdMock: vi.fn(() => 'user-123'),
}));

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: writeToFirestoreMock,
    writeItemToSubcollection: writeItemToSubcollectionMock,
    deleteItemFromSubcollection: deleteItemFromSubcollectionMock,
    getCurrentUserId: getCurrentUserIdMock,
}));

describe('aulasStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getCurrentUserIdMock.mockReturnValue('user-123');
        window.localStorage.clear();
        useAulasStore.getState()._reset();
        useAulasStore.getState()._hydrateFromFirestore({ folders: [], collections: [] });
        vi.clearAllMocks();
    });

    it('correctly maps folder and book IDs during importBackupData and updates hierarchy', () => {
        const mockBackup = {
            folders: [
                { id: 'f-1', name: 'Estudo Ativo', position: 0 },
                { id: 'old-root-folder', name: 'Concurso Publico', position: 3 },
                { id: 'old-child-folder', name: 'Leis', position: 4, parentId: 'old-root-folder' }
            ],
            books: [
                {
                    id: 'old-book-1',
                    folderId: 'old-child-folder',
                    title: 'Lei 8.112',
                    coverImage: 'some-cover-url',
                    targetDate: '2026-12-31',
                    position: 0,
                    chapters: [
                        { id: 'ch-1', title: 'Aula 1', content: 'Conteúdo da aula 1', position: 0 }
                    ]
                }
            ],
            collections: [
                {
                    id: 'old-col-1',
                    name: 'Coleção Teste',
                    position: 0,
                    bookIds: ['old-book-1']
                }
            ]
        };

        useAulasStore.getState().importBackupData(mockBackup);

        const state = useAulasStore.getState();

        // 1. Verify root folder "Concurso Publico" was imported with a new generated UUID
        const newRootFolder = state.folders.find(f => f.name === 'Concurso Publico');
        expect(newRootFolder).toBeDefined();
        expect(newRootFolder!.id).not.toBe('old-root-folder');
        expect(newRootFolder!.parentId).toBeUndefined();

        // 2. Verify subfolder "Leis" was imported and points to the new root folder UUID
        const newChildFolder = state.folders.find(f => f.name === 'Leis');
        expect(newChildFolder).toBeDefined();
        expect(newChildFolder!.id).not.toBe('old-child-folder');
        expect(newChildFolder!.parentId).toBe(newRootFolder!.id);

        // 3. Verify book "Lei 8.112" points to the new child folder UUID
        const newBook = state.books.find(b => b.title === 'Lei 8.112');
        expect(newBook).toBeDefined();
        expect(newBook!.id).not.toBe('old-book-1');
        expect(newBook!.folderId).toBe(newChildFolder!.id);
        expect(newBook!.coverImage).toBe('some-cover-url');
        expect(newBook!.targetDate).toBe('2026-12-31');
        expect(newBook!.chapters.length).toBe(1);
        expect(newBook!.chapters[0].title).toBe('Aula 1');

        // 4. Verify collections are mapped and include the new book UUID
        const newCol = state.collections.find(c => c.name === 'Coleção Teste');
        expect(newCol).toBeDefined();
        expect(newCol!.id).not.toBe('old-col-1');
        expect(newCol!.bookIds).toEqual([newBook!.id]);

        // 5. Verify Firestore sync calls
        expect(writeItemToSubcollectionMock).toHaveBeenCalledWith('p67_aulas_books', newBook!.id, newBook);
        expect(writeToFirestoreMock).toHaveBeenCalledWith('p67_aulas_config', {
            folders: state.folders,
            collections: state.collections,
            recentlyStudied: state.recentlyStudied,
        });
    });

    it('correctly reorders chapters inside a book', () => {
        const store = useAulasStore.getState();
        store.addFolder('Folder 1');
        const folder = useAulasStore.getState().folders.find(f => f.name === 'Folder 1')!;
        
        store.addBook(folder.id, 'Book 1');
        const book = useAulasStore.getState().books.find(b => b.title === 'Book 1')!;
        
        store.addChaptersJson(book.id, [
            { title: 'Chapter A' },
            { title: 'Chapter B' },
            { title: 'Chapter C' }
        ]);

        const bookWithChapters = useAulasStore.getState().books.find(b => b.title === 'Book 1')!;
        expect(bookWithChapters.chapters.map(c => c.title)).toEqual(['Chapter A', 'Chapter B', 'Chapter C']);
        expect(bookWithChapters.chapters.map(c => c.position)).toEqual([0, 1, 2]);

        // Reorder: Move 'Chapter A' (index 0) to index 2 (after Chapter C)
        useAulasStore.getState().reorderChapters(book.id, 0, 2);

        const updatedBook = useAulasStore.getState().books.find(b => b.title === 'Book 1')!;
        expect(updatedBook.chapters.map(c => c.title)).toEqual(['Chapter B', 'Chapter C', 'Chapter A']);
        expect(updatedBook.chapters.map(c => c.position)).toEqual([0, 1, 2]);
    });

    it('correctly moves a chapter from one book to another', () => {
        const store = useAulasStore.getState();
        store.addFolder('Folder 1');
        const folder = useAulasStore.getState().folders.find(f => f.name === 'Folder 1')!;
        
        store.addBook(folder.id, 'Source Book');
        store.addBook(folder.id, 'Target Book');
        
        const sourceBook = useAulasStore.getState().books.find(b => b.title === 'Source Book')!;
        const targetBook = useAulasStore.getState().books.find(b => b.title === 'Target Book')!;

        // Add chapters to source
        store.addChaptersJson(sourceBook.id, [
            { title: 'Chapter 1' },
            { title: 'Chapter 2' }
        ]);

        // Add chapters to target
        store.addChaptersJson(targetBook.id, [
            { title: 'Chapter X' }
        ]);

        const sourceWithChapters = useAulasStore.getState().books.find(b => b.id === sourceBook.id)!;
        const chapterToMove = sourceWithChapters.chapters.find(c => c.title === 'Chapter 2')!;

        // Move 'Chapter 2' from source to target
        useAulasStore.getState().moveChapter(sourceBook.id, targetBook.id, chapterToMove.id);

        const updatedSource = useAulasStore.getState().books.find(b => b.id === sourceBook.id)!;
        const updatedTarget = useAulasStore.getState().books.find(b => b.id === targetBook.id)!;

        expect(updatedSource.chapters.map(c => c.title)).toEqual(['Chapter 1']);
        expect(updatedSource.chapters.map(c => c.position)).toEqual([0]);

        expect(updatedTarget.chapters.map(c => c.title)).toEqual(['Chapter X', 'Chapter 2']);
        expect(updatedTarget.chapters.map(c => c.position)).toEqual([0, 1]);
    });
});
