import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ChapterView from '../../../components/views/AulasView/ChapterView';

const mockUpdateChapterStudyTime = vi.fn();
const stableStore = {
  books: [
    {
      id: 'book-1',
      folderId: 'folder-1',
      title: 'Livro',
      coverImage: null,
      targetDate: null,
      position: 0,
      chapters: [{ id: 'chapter-1', title: 'Aula 1', content: '# Aula 1\n\nTexto', attachments: {}, position: 0 }],
    },
  ],
  updateChapter: vi.fn(),
  addRecentlyStudied: vi.fn(),
  setChapterConfidence: vi.fn(),
  updateChapterStudyTime: mockUpdateChapterStudyTime,
};

vi.mock('../../../stores/aulasStore', () => ({
  useAulasStore: () => stableStore,
}));

let visibility: DocumentVisibilityState = 'visible';

const setVisibility = (state: DocumentVisibilityState) => {
  visibility = state;
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('ChapterView study time tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUpdateChapterStudyTime.mockClear();
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves accumulated time when the tab is hidden and ignores hidden time', () => {
    const { unmount } = render(<ChapterView bookId="book-1" chapterId="chapter-1" onBack={vi.fn()} />);

    act(() => { vi.advanceTimersByTime(10_000); });
    act(() => { setVisibility('hidden'); });

    expect(mockUpdateChapterStudyTime).toHaveBeenCalledTimes(1);
    expect(mockUpdateChapterStudyTime).toHaveBeenCalledWith('book-1', 'chapter-1', 10);

    // A long time in the background must not be counted as study time.
    act(() => { vi.advanceTimersByTime(60_000); });
    act(() => { setVisibility('visible'); });
    act(() => { vi.advanceTimersByTime(8_000); });

    unmount();

    expect(mockUpdateChapterStudyTime).toHaveBeenCalledTimes(2);
    expect(mockUpdateChapterStudyTime).toHaveBeenLastCalledWith('book-1', 'chapter-1', 8);
  });
});
