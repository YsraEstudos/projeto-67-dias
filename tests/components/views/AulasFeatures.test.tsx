import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAulasStore } from '../../../stores/aulasStore';

const toLocalYmd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
    const expectedEasyString = toLocalYmd(expectedEasyDate);
    expect(updatedCh.confidence).toBe('easy');
    expect(updatedCh.nextReviewDate).toBe(expectedEasyString);

    // Set confidence to 'medium' (expected: today + 3 days)
    store.setChapterConfidence(book.id, chapter.id, 'medium');
    updatedBook = useAulasStore.getState().books.find(b => b.id === book.id)!;
    updatedCh = updatedBook.chapters[0];
    
    const expectedMediumDate = new Date();
    expectedMediumDate.setDate(expectedMediumDate.getDate() + 3);
    const expectedMediumString = toLocalYmd(expectedMediumDate);
    expect(updatedCh.confidence).toBe('medium');
    expect(updatedCh.nextReviewDate).toBe(expectedMediumString);

    // Set confidence to 'hard' (expected: today + 1 day)
    store.setChapterConfidence(book.id, chapter.id, 'hard');
    updatedBook = useAulasStore.getState().books.find(b => b.id === book.id)!;
    updatedCh = updatedBook.chapters[0];
    
    const expectedHardDate = new Date();
    expectedHardDate.setDate(expectedHardDate.getDate() + 1);
    const expectedHardString = toLocalYmd(expectedHardDate);
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

  it('schedules the next review on the local calendar day, not the UTC one', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'America/Sao_Paulo';
    vi.useFakeTimers();
    // 23:30 in Sao Paulo is already the next day in UTC.
    vi.setSystemTime(new Date('2026-10-08T02:30:00.000Z'));
    try {
      const store = useAulasStore.getState();
      store.addFolder('Folder TZ');
      const folder = useAulasStore.getState().folders.find(f => f.name === 'Folder TZ')!;
      store.addBook(folder.id, 'Book TZ');
      const book = useAulasStore.getState().books.find(b => b.title === 'Book TZ')!;
      store.addChaptersJson(book.id, [{ title: 'Chapter TZ' }]);
      const chapter = useAulasStore.getState().books.find(b => b.id === book.id)!.chapters[0];

      store.setChapterConfidence(book.id, chapter.id, 'hard');

      const updated = useAulasStore.getState().books.find(b => b.id === book.id)!.chapters[0];
      expect(updated.nextReviewDate).toBe('2026-10-08');
    } finally {
      vi.useRealTimers();
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });
});
