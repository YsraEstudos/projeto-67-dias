/**
 * useDashboardStats
 *
 * Derives reading and aulas statistics from their respective Zustand stores.
 * Previously these were two `useMemo` blocks inside WorkspaceApp.
 *
 * Pure computation — no side effects.
 */
import { useMemo } from 'react';
import { useReadingStore, useAulasStore } from '../stores';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReadingStats {
    readingCount: number;
    completedCount: number;
    totalCount: number;
    progressPercent: number;
}

export interface AulasStats {
    totalBooks: number;
    totalChapters: number;
    readChapters: number;
    progressPercent: number;
}

export interface DashboardStats {
    readingStats: ReadingStats;
    aulasStats: AulasStats;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useDashboardStats = (): DashboardStats => {
    const books = useReadingStore((state) => state.books);
    const aulasBooks = useAulasStore((state) => state.books);

    const readingStats = useMemo((): ReadingStats => {
        const totals = books.reduce(
            (acc, book) => {
                if (book.status === 'READING') acc.readingCount += 1;
                if (book.status === 'COMPLETED') acc.completedCount += 1;
                acc.totalCount += 1;
                return acc;
            },
            { readingCount: 0, completedCount: 0, totalCount: 0 }
        );

        const progressPercent =
            totals.totalCount > 0
                ? Math.round((totals.completedCount / totals.totalCount) * 100)
                : 0;

        return { ...totals, progressPercent };
    }, [books]);

    const aulasStats = useMemo((): AulasStats => {
        const totalBooks = aulasBooks.length;
        let totalChapters = 0;
        let readChapters = 0;

        aulasBooks.forEach((book) => {
            if (book.chapters) {
                totalChapters += book.chapters.length;
                book.chapters.forEach((ch) => {
                    if (ch.readAt) {
                        readChapters += 1;
                    }
                });
            }
        });

        const progressPercent =
            totalChapters > 0
                ? Math.round((readChapters / totalChapters) * 100)
                : 0;

        return { totalBooks, totalChapters, readChapters, progressPercent };
    }, [aulasBooks]);

    return { readingStats, aulasStats };
};
