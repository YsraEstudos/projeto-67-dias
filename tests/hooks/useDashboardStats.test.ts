import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardStats } from '../../hooks/useDashboardStats';

// ---------------------------------------------------------------------------
// Mocks — define module-level references for imperatively updating mock state
// ---------------------------------------------------------------------------

const mockReadingStore = vi.fn();
const mockAulasStore = vi.fn();

vi.mock('../../stores', () => ({
    useReadingStore: (selector: any) => mockReadingStore(selector),
    useAulasStore: (selector: any) => mockAulasStore(selector),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const setBooks = (books: any[]) => {
    mockReadingStore.mockImplementation((selector: any) => selector({ books }));
};

const setAulasBooks = (books: any[]) => {
    mockAulasStore.mockImplementation((selector: any) => selector({ books }));
};

const book = (status: 'READING' | 'COMPLETED' | 'PAUSED' | 'WISHLIST') => ({
    id: Math.random().toString(36),
    title: 'Test Book',
    status,
    current: 0,
    total: 100,
    logs: [],
    dailyGoal: 10,
});

const aulasBook = (chapters: Array<{ readAt?: string }>) => ({
    id: Math.random().toString(36),
    title: 'Test Course',
    chapters: chapters.map((c, i) => ({ id: `ch-${i}`, title: `Chapter ${i}`, ...c })),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDashboardStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setBooks([]);
        setAulasBooks([]);
    });

    // -----------------------------------------------------------------------
    // readingStats
    // -----------------------------------------------------------------------
    describe('readingStats', () => {
        it('returns all zeros when the book list is empty', () => {
            setBooks([]);
            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.readingStats).toEqual({
                readingCount: 0,
                completedCount: 0,
                totalCount: 0,
                progressPercent: 0,
            });
        });

        it('counts books by status correctly', () => {
            setBooks([
                book('READING'),
                book('READING'),
                book('COMPLETED'),
                book('PAUSED'),
                book('WISHLIST'),
            ]);

            const { result } = renderHook(() => useDashboardStats());
            const { readingStats } = result.current;

            expect(readingStats.readingCount).toBe(2);
            expect(readingStats.completedCount).toBe(1);
            expect(readingStats.totalCount).toBe(5);
        });

        it('calculates progressPercent as percentage of completed over total', () => {
            setBooks([book('COMPLETED'), book('COMPLETED'), book('READING')]);

            const { result } = renderHook(() => useDashboardStats());
            // 2 completed / 3 total = 66.67 → rounded to 67
            expect(result.current.readingStats.progressPercent).toBe(67);
        });

        it('rounds progressPercent correctly (50% exact)', () => {
            setBooks([book('COMPLETED'), book('READING')]);

            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.readingStats.progressPercent).toBe(50);
        });

        it('returns progressPercent 100 when all books are completed', () => {
            setBooks([book('COMPLETED'), book('COMPLETED'), book('COMPLETED')]);

            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.readingStats.progressPercent).toBe(100);
        });
    });

    // -----------------------------------------------------------------------
    // aulasStats
    // -----------------------------------------------------------------------
    describe('aulasStats', () => {
        it('returns all zeros when the courses list is empty', () => {
            setAulasBooks([]);
            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.aulasStats).toEqual({
                totalBooks: 0,
                totalChapters: 0,
                readChapters: 0,
                progressPercent: 0,
            });
        });

        it('counts books without chapters correctly (totalChapters = 0)', () => {
            setAulasBooks([{ id: '1', title: 'Course A', chapters: [] }]);

            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.aulasStats).toEqual({
                totalBooks: 1,
                totalChapters: 0,
                readChapters: 0,
                progressPercent: 0,
            });
        });

        it('counts read chapters (those with readAt defined)', () => {
            setAulasBooks([
                aulasBook([
                    { readAt: '2026-01-01' },
                    { readAt: '2026-01-02' },
                    {},                        // not read
                ]),
                aulasBook([
                    { readAt: '2026-01-03' },
                    {},                        // not read
                ]),
            ]);

            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.aulasStats.totalBooks).toBe(2);
            expect(result.current.aulasStats.totalChapters).toBe(5);
            expect(result.current.aulasStats.readChapters).toBe(3);
        });

        it('calculates progressPercent for aulas correctly', () => {
            setAulasBooks([aulasBook([{ readAt: '2026-01-01' }, {}, {}])]); // 1/3

            const { result } = renderHook(() => useDashboardStats());
            // 1/3 = 33.33 → rounded to 33
            expect(result.current.aulasStats.progressPercent).toBe(33);
        });

        it('handles books where chapters property is undefined', () => {
            setAulasBooks([{ id: '1', title: 'Course', chapters: undefined }]);

            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.aulasStats.totalChapters).toBe(0);
            expect(result.current.aulasStats.readChapters).toBe(0);
            expect(result.current.aulasStats.progressPercent).toBe(0);
        });

        it('returns progressPercent 100 when all chapters are read', () => {
            setAulasBooks([aulasBook([{ readAt: '2026-01-01' }, { readAt: '2026-01-02' }])]);

            const { result } = renderHook(() => useDashboardStats());
            expect(result.current.aulasStats.progressPercent).toBe(100);
        });
    });

    // -----------------------------------------------------------------------
    // Combined
    // -----------------------------------------------------------------------
    it('returns both readingStats and aulasStats in the same object', () => {
        const { result } = renderHook(() => useDashboardStats());
        expect(result.current).toHaveProperty('readingStats');
        expect(result.current).toHaveProperty('aulasStats');
    });
});
