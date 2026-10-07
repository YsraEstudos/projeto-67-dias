import { describe, expect, it } from 'vitest';
import { calculateReadingStreak, clampProgress, getUnitsReadOnDate } from '../../../components/reading/readingStats';
import type { Book } from '../../../types';

const makeBook = (id: string, logs: Array<[string, number]>): Book => ({
  id,
  title: id,
  author: '',
  genre: '',
  unit: 'PAGES',
  total: 100,
  current: 0,
  status: 'READING',
  rating: 0,
  folderId: null,
  notes: '',
  addedAt: '2026-01-01',
  logs: logs.map(([date, pagesRead], i) => ({ id: `${id}-${i}`, date, pagesRead, bookId: id })),
});

describe('calculateReadingStreak', () => {
  it('returns 0 without logs', () => {
    expect(calculateReadingStreak([], '2026-10-07')).toBe(0);
  });

  it('counts consecutive local days across books ending today', () => {
    const books = [
      makeBook('a', [['2026-10-07', 5], ['2026-10-05', 3]]),
      makeBook('b', [['2026-10-06', 2], ['2026-10-03', 9]]),
    ];
    expect(calculateReadingStreak(books, '2026-10-07')).toBe(3);
  });

  it('keeps the streak alive when the last reading was yesterday', () => {
    const books = [makeBook('a', [['2026-10-06', 5], ['2026-10-05', 3]])];
    expect(calculateReadingStreak(books, '2026-10-07')).toBe(2);
  });

  it('ignores zero-page logs and breaks after a gap', () => {
    const books = [makeBook('a', [['2026-10-07', 0], ['2026-10-05', 3]])];
    expect(calculateReadingStreak(books, '2026-10-07')).toBe(0);
  });

  it('crosses month boundaries', () => {
    const books = [makeBook('a', [['2026-10-01', 1], ['2026-09-30', 1], ['2026-09-29', 1]])];
    expect(calculateReadingStreak(books, '2026-10-01')).toBe(3);
  });
});

describe('getUnitsReadOnDate', () => {
  it('sums positive logs for the given day only', () => {
    const books = [
      makeBook('a', [['2026-10-07', 5], ['2026-10-06', 3]]),
      makeBook('b', [['2026-10-07', 7]]),
    ];
    expect(getUnitsReadOnDate(books, '2026-10-07')).toBe(12);
    expect(getUnitsReadOnDate([], '2026-10-07')).toBe(0);
  });
});

describe('clampProgress', () => {
  it('clamps between 0 and total', () => {
    expect(clampProgress({ current: 98, total: 100 }, 5)).toBe(100);
    expect(clampProgress({ current: 2, total: 100 }, -5)).toBe(0);
  });

  it('does not clamp to zero when total is not configured', () => {
    expect(clampProgress({ current: 3, total: 0 }, 1)).toBe(4);
  });
});
