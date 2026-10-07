import { addDays } from 'date-fns';
import { Book } from '../../types';
import { formatDateISO, getTodayISO, parseDate } from '../../utils/dateUtils';

/**
 * Consecutive days (ending today, or yesterday if today has no reading yet)
 * with at least one positive reading log. Dates are local calendar days
 * (YYYY-MM-DD), matching how the store writes logs via getTodayISO().
 */
export function calculateReadingStreak(books: Book[], todayISO: string = getTodayISO()): number {
  const dates = new Set<string>();
  for (const book of books) {
    for (const log of book.logs ?? []) {
      if (log.pagesRead > 0 && log.date) dates.add(log.date);
    }
  }
  if (dates.size === 0) return 0;

  let cursor = parseDate(todayISO);
  if (!dates.has(todayISO)) cursor = addDays(cursor, -1);

  let streak = 0;
  while (dates.has(formatDateISO(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Total units (pages/chapters) logged across all books on the given day. */
export function getUnitsReadOnDate(books: Book[], dateISO: string = getTodayISO()): number {
  let total = 0;
  for (const book of books) {
    for (const log of book.logs ?? []) {
      if (log.date === dateISO && log.pagesRead > 0) total += log.pagesRead;
    }
  }
  return total;
}

/**
 * Applies a relative progress change, clamping to [0, total]. When the book has
 * no total configured (total <= 0) only the lower bound is enforced, otherwise
 * every increment would be clamped back to zero.
 */
export function clampProgress(book: Pick<Book, 'current' | 'total'>, delta: number): number {
  const next = Math.max(0, book.current + delta);
  return book.total > 0 ? Math.min(book.total, next) : next;
}
