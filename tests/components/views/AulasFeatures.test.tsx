import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAulasStore } from '../../../stores/aulasStore';

describe('Aulas Additional Features Logic', () => {
  beforeEach(() => {
    useAulasStore.getState()._reset();
    useAulasStore.getState()._hydrateFromFirestore({ folders: [], collections: [] });
    vi.clearAllMocks();
  });

  it('correctly calculates nextReviewDate based on confidence levels (Spaced Repetition)', () => {
    const store = useAulasStore.getState();
    
    // Add folder and book
    store.addFolder('Folder A');
    const folder = useAulasStore.getState().folders.find(f => f.name === 'Folder A')!;
    
    store.addBook(folder.id, 'Book 1');
    const book = useAulasStore.getState().books.find(b => b.title === 'Book 1')!;
    
    store.addChaptersJson(book.id, [{ title: 'Chapter 1' }]);
    const bookWithChapters = useAulasStore.getState().books.find(b => b.id === book.id)!;
    const chapter = bookWithChapters.chapters[0];

    // Set confidence to 'easy' (expected: today + 7 days)
    store.setChapterConfidence(book.id, chapter.id, 'easy');
    let updatedBook = useAulasStore.getState().books.find(b => b.id === book.id)!;
    let updatedCh = updatedBook.chapters[0];
    
    const expectedEasyDate = new Date();
    expectedEasyDate.setDate(expectedEasyDate.getDate() + 7);
    const expectedEasyString = expectedEasyDate.toISOString().split('T')[0];
    expect(updatedCh.confidence).toBe('easy');
    expect(updatedCh.nextReviewDate).toBe(expectedEasyString);

    // Set confidence to 'medium' (expected: today + 3 days)
    store.setChapterConfidence(book.id, chapter.id, 'medium');
    updatedBook = useAulasStore.getState().books.find(b => b.id === book.id)!;
    updatedCh = updatedBook.chapters[0];
    
    const expectedMediumDate = new Date();
    expectedMediumDate.setDate(expectedMediumDate.getDate() + 3);
    const expectedMediumString = expectedMediumDate.toISOString().split('T')[0];
    expect(updatedCh.confidence).toBe('medium');
    expect(updatedCh.nextReviewDate).toBe(expectedMediumString);

    // Set confidence to 'hard' (expected: today + 1 day)
    store.setChapterConfidence(book.id, chapter.id, 'hard');
    updatedBook = useAulasStore.getState().books.find(b => b.id === book.id)!;
    updatedCh = updatedBook.chapters[0];
    
    const expectedHardDate = new Date();
    expectedHardDate.setDate(expectedHardDate.getDate() + 1);
    const expectedHardString = expectedHardDate.toISOString().split('T')[0];
    expect(updatedCh.confidence).toBe('hard');
    expect(updatedCh.nextReviewDate).toBe(expectedHardString);
  });

  it('correctly tracks and updates recentlyStudied items and studyTimeSeconds', () => {
    const store = useAulasStore.getState();
    
    store.addFolder('Folder A');
    const folder = useAulasStore.getState().folders.find(f => f.name === 'Folder A')!;
    store.addBook(folder.id, 'Book 1');
    const book = useAulasStore.getState().books.find(b => b.title === 'Book 1')!;
    
    store.addChaptersJson(book.id, [{ title: 'Chapter 1' }]);
    const bookWithChapters = useAulasStore.getState().books.find(b => b.id === book.id)!;
    const chapter = bookWithChapters.chapters[0];

    // Verify study time increments
    store.updateChapterStudyTime(book.id, chapter.id, 15);
    store.updateChapterStudyTime(book.id, chapter.id, 20);
    
    const updatedBook = useAulasStore.getState().books.find(b => b.id === book.id)!;
    expect(updatedBook.chapters[0].studyTimeSeconds).toBe(35);

    // Verify recentlyStudied history updates
    store.addRecentlyStudied(book.id, chapter.id);
    const state = useAulasStore.getState();
    expect(state.recentlyStudied.length).toBe(1);
    expect(state.recentlyStudied[0].bookId).toBe(book.id);
    expect(state.recentlyStudied[0].chapterId).toBe(chapter.id);
    expect(state.recentlyStudied[0].bookTitle).toBe('Book 1');
    expect(state.recentlyStudied[0].chapterTitle).toBe('Chapter 1');
  });
});
