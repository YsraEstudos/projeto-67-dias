import { describe, expect, it } from 'vitest';
import {
  buildShelfLayout,
  createDefaultShelfLevels,
  moveBookToShelfLevel,
  type ShelfLayoutBook,
} from '../../utils/readingShelfLayout';

function createSyntheticBooks(count: number): ShelfLayoutBook[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `perf-book-${index}`,
    shelfLevelId: `shelf-level-${(index % 3) + 1}`,
    shelfPosition: Math.floor(index / 3),
    width: 1.9,
    thickness: 0.24 + (index % 5) * 0.035,
    height: 3.1 + (index % 4) * 0.08,
  }));
}

describe('reading shelf performance budgets', () => {
  it('lays out 5,000 books repeatedly without losing books', () => {
    const books = createSyntheticBooks(5_000);
    const levels = createDefaultShelfLevels();
    const startedAt = performance.now();
    let layout = [];

    for (let iteration = 0; iteration < 5; iteration += 1) {
      layout = buildShelfLayout(books, levels);
    }

    const elapsedMs = performance.now() - startedAt;
    expect(layout).toHaveLength(books.length);
    expect(new Set(layout.map((entry) => entry.bookId)).size).toBe(books.length);
    // Regression budget for deterministic layout work, independent of WebGL/network cost.
    expect(elapsedMs).toBeLessThan(2_500);
  });

  it('moves 1,000 books in O(n) state transitions within the interaction budget', () => {
    let books = createSyntheticBooks(1_000);
    const levels = createDefaultShelfLevels();
    const startedAt = performance.now();

    for (let iteration = 0; iteration < 40; iteration += 1) {
      books = moveBookToShelfLevel(
        books,
        `perf-book-${iteration % books.length}`,
        levels[(iteration + 1) % levels.length].id,
      );
    }

    const elapsedMs = performance.now() - startedAt;
    expect(books).toHaveLength(1_000);
    expect(new Set(books.map((book) => book.id)).size).toBe(1_000);
    expect(elapsedMs).toBeLessThan(2_500);
  });
});
