import type { ReadingShelfLevel } from '../types/reading';

export const DEFAULT_SHELF_LEVEL_ID = 'shelf-level-1';
export const SHELF_LEVEL_SPACING = 3.9;
export const SHELF_BOOK_GAP = 0.08;

export interface ShelfLayoutBook {
  id: string;
  shelfLevelId?: string;
  shelfPosition?: number;
  width: number;
  thickness: number;
  height: number;
}

export interface ShelfLayoutEntry {
  bookId: string;
  shelfLevelId: string;
  shelfPosition: number;
  levelIndex: number;
  x: number;
  y: number;
  width: number;
  thickness: number;
  height: number;
}

export const createDefaultShelfLevels = (): ReadingShelfLevel[] => [
  { id: DEFAULT_SHELF_LEVEL_ID, name: 'Estante 1', position: 0 },
  { id: 'shelf-level-2', name: 'Estante 2', position: 1 },
  { id: 'shelf-level-3', name: 'Estante 3', position: 2 },
];

export function normalizeShelfLevels(levels?: ReadingShelfLevel[] | null): ReadingShelfLevel[] {
  const source = levels?.length ? levels : createDefaultShelfLevels();
  const seen = new Set<string>();

  return source
    .map((level, index) => ({
      id: level.id?.trim() || `shelf-level-${index + 1}`,
      name: level.name?.trim() || `Estante ${index + 1}`,
      position: Number.isFinite(level.position) ? Math.max(0, level.position) : index,
    }))
    .filter((level) => {
      if (seen.has(level.id)) return false;
      seen.add(level.id);
      return true;
    })
    .sort((a, b) => a.position - b.position)
    .map((level, index) => ({ ...level, position: index }));
}

export interface ShelfBookAssignment {
  id: string;
  shelfLevelId?: string;
  shelfPosition?: number;
}

type IndexedShelfBook<T extends ShelfBookAssignment> = T & { sourceIndex: number };

function compareShelfBooks<T extends ShelfBookAssignment>(a: IndexedShelfBook<T>, b: IndexedShelfBook<T>) {
  const aPosition = Number.isFinite(a.shelfPosition) ? a.shelfPosition! : Number.POSITIVE_INFINITY;
  const bPosition = Number.isFinite(b.shelfPosition) ? b.shelfPosition! : Number.POSITIVE_INFINITY;
  return aPosition - bPosition || a.sourceIndex - b.sourceIndex;
}

export function normalizeBookShelfAssignments<T extends ShelfBookAssignment>(
  books: T[],
  levels: ReadingShelfLevel[],
): T[] {
  const normalizedLevels = normalizeShelfLevels(levels);
  const validLevelIds = new Set(normalizedLevels.map((level) => level.id));
  const fallbackLevelId = normalizedLevels[0].id;
  const grouped = new Map<string, Array<IndexedShelfBook<T>>>();

  books.forEach((book, sourceIndex) => {
    const shelfLevelId = book.shelfLevelId && validLevelIds.has(book.shelfLevelId)
      ? book.shelfLevelId
      : fallbackLevelId;
    const group = grouped.get(shelfLevelId) ?? [];
    group.push({ ...book, shelfLevelId, sourceIndex });
    grouped.set(shelfLevelId, group);
  });

  const positions = new Map<string, number>();
  grouped.forEach((group) => {
    group.sort(compareShelfBooks);
    group.forEach((book, index) => positions.set(book.id, index));
  });

  return books.map((book) => ({
    ...book,
    shelfLevelId: book.shelfLevelId && validLevelIds.has(book.shelfLevelId)
      ? book.shelfLevelId
      : fallbackLevelId,
    shelfPosition: positions.get(book.id) ?? 0,
  }));
}

export function buildShelfLayout<T extends ShelfLayoutBook>(
  books: T[],
  levels: ReadingShelfLevel[],
): ShelfLayoutEntry[] {
  const normalizedLevels = normalizeShelfLevels(levels);
  const normalizedBooks = normalizeBookShelfAssignments(books, normalizedLevels);
  const grouped = new Map<string, T[]>();

  normalizedBooks.forEach((book) => {
    const levelId = book.shelfLevelId ?? normalizedLevels[0].id;
    const group = grouped.get(levelId) ?? [];
    group.push(book);
    grouped.set(levelId, group);
  });

  const layout: ShelfLayoutEntry[] = [];
  normalizedLevels.forEach((level, levelIndex) => {
    const row = (grouped.get(level.id) ?? []).sort((a, b) => (a.shelfPosition ?? 0) - (b.shelfPosition ?? 0));
    const rowWidth = row.reduce((total, book) => total + book.thickness + SHELF_BOOK_GAP, 0);
    let cursor = -rowWidth / 2;

    row.forEach((book, shelfPosition) => {
      cursor += book.thickness / 2;
      layout.push({
        bookId: book.id,
        shelfLevelId: level.id,
        shelfPosition,
        levelIndex,
        x: cursor,
        // BookMeshGroup uses the bottom of the book as its local origin.
        y: level.position * SHELF_LEVEL_SPACING + 0.18,
        width: book.width,
        thickness: book.thickness,
        height: book.height,
      });
      cursor += book.thickness / 2 + SHELF_BOOK_GAP;
    });
  });

  return layout;
}

export function moveBookToShelfLevel<T extends ShelfBookAssignment>(
  books: T[],
  bookId: string,
  targetLevelId: string,
  targetPosition?: number,
): T[] {
  const sourceBook = books.find((book) => book.id === bookId);
  if (!sourceBook) return books;

  const grouped = new Map<string, T[]>();
  books.forEach((book) => {
    if (book.id === bookId) return;
    const levelId = book.shelfLevelId ?? DEFAULT_SHELF_LEVEL_ID;
    const group = grouped.get(levelId) ?? [];
    group.push(book);
    grouped.set(levelId, group);
  });

  const targetGroup = grouped.get(targetLevelId) ?? [];
  const insertionIndex = Number.isFinite(targetPosition)
    ? Math.max(0, Math.min(targetGroup.length, Math.floor(targetPosition!)))
    : targetGroup.length;
  targetGroup.splice(insertionIndex, 0, {
    ...sourceBook,
    shelfLevelId: targetLevelId,
    shelfPosition: insertionIndex,
  });
  grouped.set(targetLevelId, targetGroup);

  const updatedPositions = new Map<string, number>();
  grouped.forEach((group, levelId) => {
    if (levelId !== targetLevelId) {
      group.sort((a, b) => (a.shelfPosition ?? 0) - (b.shelfPosition ?? 0));
    }
    group.forEach((book, index) => updatedPositions.set(book.id, index));
  });

  return books.map((book) => ({
    ...book,
    shelfLevelId: book.id === bookId ? targetLevelId : book.shelfLevelId ?? DEFAULT_SHELF_LEVEL_ID,
    shelfPosition: updatedPositions.get(book.id) ?? 0,
  }));
}

export function countBooksByShelfLevel(books: { shelfLevelId?: string }[], levels: ReadingShelfLevel[]) {
  const counts = new Map(normalizeShelfLevels(levels).map((level) => [level.id, 0]));
  books.forEach((book) => {
    const levelId = book.shelfLevelId ?? DEFAULT_SHELF_LEVEL_ID;
    counts.set(levelId, (counts.get(levelId) ?? 0) + 1);
  });
  return counts;
}
