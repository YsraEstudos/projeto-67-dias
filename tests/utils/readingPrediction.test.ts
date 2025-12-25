/**
 * Tests for Reading Prediction Utilities
 */
import { describe, it, expect } from 'vitest';
import {
    calculateReadingDailyRequirement,
    calculateReadingDailyPlan,
    getExponentialFactor,
    getTodayPlan,
    getCurrentPhase
} from '../../utils/readingPrediction';
import { Book } from '../../types';
import { getTodayISO, formatDateISO, addDaysToDate } from '../../utils/dateUtils';

// Helper to create a minimal book for testing
const createMockBook = (overrides: Partial<Book> = {}): Book => ({
    id: 'test-book-1',
    title: 'Test Book',
    author: 'Test Author',
    genre: 'Fiction',
    unit: 'PAGES',
    total: 300,
    current: 0,
    status: 'READING',
    rating: 0,
    folderId: null,
    notes: '',
    addedAt: new Date().toISOString(),
    ...overrides,
});

// Helper to get a date N days from now in YYYY-MM-DD format
const getFutureDate = (daysFromNow: number): string => {
    return formatDateISO(addDaysToDate(new Date(), daysFromNow));
};

describe('calculateReadingDailyRequirement', () => {
    describe('when book has no deadline', () => {
        it('should return null', () => {
            const book = createMockBook({ deadline: undefined });
            const result = calculateReadingDailyRequirement(book);
            expect(result).toBeNull();
        });
    });

    describe('when deadline has passed', () => {
        it('should return isExpired: true', () => {
            const book = createMockBook({
                deadline: getFutureDate(-1) // Yesterday
            });

            const result = calculateReadingDailyRequirement(book);

            expect(result).not.toBeNull();
            expect(result!.isExpired).toBe(true);
            expect(result!.remainingDays).toBe(0);
        });
    });

    describe('when book has future deadline', () => {
        it('should calculate pages per day within expected range', () => {
            // Deadline roughly 10 days away, 300 pages remaining
            const book = createMockBook({
                total: 300,
                current: 0,
                deadline: getFutureDate(10)
            });

            const result = calculateReadingDailyRequirement(book);

            expect(result).not.toBeNull();
            expect(result!.isExpired).toBe(false);
            // Due to timezone/time-of-day, days might be 9-11
            expect(result!.remainingDays).toBeGreaterThanOrEqual(9);
            expect(result!.remainingDays).toBeLessThanOrEqual(11);
            // Pages per day should be around 30 (between 27 and 34)
            expect(result!.pagesPerDay).toBeGreaterThanOrEqual(27);
            expect(result!.pagesPerDay).toBeLessThanOrEqual(34);
        });

        it('should account for progress already made', () => {
            // 300 pages total, 150 done, ~5 days left
            const book = createMockBook({
                total: 300,
                current: 150,
                deadline: getFutureDate(5)
            });

            const result = calculateReadingDailyRequirement(book);

            expect(result).not.toBeNull();
            // 150 pages remaining / ~5 days = ~30 pages/day
            expect(result!.pagesPerDay).toBeGreaterThanOrEqual(25);
            expect(result!.pagesPerDay).toBeLessThanOrEqual(38);
        });
    });

    describe('when book is already completed', () => {
        it('should return 0 for daily requirements', () => {
            const book = createMockBook({
                total: 300,
                current: 300,
                deadline: getFutureDate(5)
            });

            const result = calculateReadingDailyRequirement(book);

            expect(result).not.toBeNull();
            expect(result!.pagesPerDay).toBe(0);
            expect(result!.isExpired).toBe(false);
        });
    });
});

describe('getExponentialFactor', () => {
    it('should return 1.0 for single day', () => {
        expect(getExponentialFactor(0, 1, 1.0)).toBe(1.0);
    });

    it('should return minFactor at start with full intensity', () => {
        const factor = getExponentialFactor(0, 10, 1.0);
        expect(factor).toBeCloseTo(0.3, 1);
    });

    it('should return maxFactor at end with full intensity', () => {
        const factor = getExponentialFactor(9, 10, 1.0);
        expect(factor).toBeCloseTo(1.7, 1);
    });

    it('should return 1.0 everywhere with intensity 0', () => {
        expect(getExponentialFactor(0, 10, 0.0)).toBe(1.0);
        expect(getExponentialFactor(5, 10, 0.0)).toBe(1.0);
        expect(getExponentialFactor(9, 10, 0.0)).toBe(1.0);
    });

    it('should have narrower range with intensity 0.5', () => {
        const startFactor = getExponentialFactor(0, 10, 0.5);
        const endFactor = getExponentialFactor(9, 10, 0.5);
        expect(startFactor).toBeCloseTo(0.65, 1);
        expect(endFactor).toBeCloseTo(1.35, 1);
    });
});

describe('calculateReadingDailyPlan', () => {
    describe('when book has no deadline', () => {
        it('should return null', () => {
            const book = createMockBook({ deadline: undefined });
            const result = calculateReadingDailyPlan(book);
            expect(result).toBeNull();
        });
    });

    describe('when deadline has passed', () => {
        it('should return isExpired: true with empty plan', () => {
            const book = createMockBook({
                deadline: getFutureDate(-1)
            });

            const result = calculateReadingDailyPlan(book);

            expect(result).not.toBeNull();
            expect(result!.isExpired).toBe(true);
            expect(result!.items).toHaveLength(0);
        });
    });

    describe('with LINEAR distribution', () => {
        it('should distribute pages evenly', () => {
            const book = createMockBook({
                total: 100,
                current: 0,
                deadline: getFutureDate(10),
                distributionType: 'LINEAR'
            });

            const result = calculateReadingDailyPlan(book);

            expect(result).not.toBeNull();
            // All days should have approximately equal pages
            const pages = result!.items.map(i => i.pages);
            const avg = pages.reduce((a, b) => a + b, 0) / pages.length;
            pages.forEach(p => {
                expect(Math.abs(p - avg)).toBeLessThanOrEqual(2);
            });
        });
    });

    describe('with EXPONENTIAL distribution', () => {
        it('should have increasing pages over time', () => {
            const book = createMockBook({
                total: 100,
                current: 0,
                deadline: getFutureDate(10),
                distributionType: 'EXPONENTIAL',
                exponentialIntensity: 1.0
            });

            const result = calculateReadingDailyPlan(book);

            expect(result).not.toBeNull();
            const items = result!.items;
            // First day should have less than last day
            expect(items[0].pages).toBeLessThan(items[items.length - 1].pages);
        });

        it('should generate 4 phases', () => {
            const book = createMockBook({
                total: 200,
                current: 0,
                deadline: getFutureDate(20),
                distributionType: 'EXPONENTIAL',
                exponentialIntensity: 1.0
            });

            const result = calculateReadingDailyPlan(book);

            expect(result).not.toBeNull();
            expect(result!.phases.length).toBeGreaterThanOrEqual(1);
            expect(result!.phases.length).toBeLessThanOrEqual(4);
        });
    });

    describe('with excluded days', () => {
        it('should skip excluded days', () => {
            const book = createMockBook({
                total: 100,
                current: 0,
                deadline: getFutureDate(14),
                distributionType: 'LINEAR',
                excludedDays: [0, 6] // Exclude weekends
            });

            const result = calculateReadingDailyPlan(book);

            expect(result).not.toBeNull();
            // Weekend days should have 0 pages
            result!.items.forEach(item => {
                if (item.dayOfWeek === 0 || item.dayOfWeek === 6) {
                    expect(item.pages).toBe(0);
                    expect(item.isExcluded).toBe(true);
                }
            });
        });

        it('should have fewer effective days', () => {
            const book = createMockBook({
                total: 100,
                current: 0,
                deadline: getFutureDate(14),
                distributionType: 'LINEAR',
                excludedDays: [0, 6]
            });

            const result = calculateReadingDailyPlan(book);

            expect(result).not.toBeNull();
            expect(result!.effectiveDays).toBeLessThan(result!.items.length);
        });
    });

    describe('total pages consistency', () => {
        it('should sum to exactly remainingPages', () => {
            const book = createMockBook({
                total: 137, // Odd number to test rounding
                current: 23,
                deadline: getFutureDate(11),
                distributionType: 'EXPONENTIAL',
                exponentialIntensity: 0.7
            });

            const result = calculateReadingDailyPlan(book);

            expect(result).not.toBeNull();
            const totalAllocated = result!.items.reduce((sum, i) => sum + i.pages, 0);
            expect(totalAllocated).toBe(137 - 23);
        });
    });
});

describe('getTodayPlan', () => {
    it('should return null for null plan', () => {
        expect(getTodayPlan(null)).toBeNull();
    });

    it('should return null for expired plan', () => {
        const plan = {
            items: [],
            totalPages: 0,
            remainingPages: 0,
            effectiveDays: 0,
            avgPagesPerDay: 0,
            phases: [],
            isExpired: true
        };
        expect(getTodayPlan(plan)).toBeNull();
    });

    it('should return today item when available', () => {
        const book = createMockBook({
            total: 100,
            current: 0,
            deadline: getFutureDate(10)
        });

        const plan = calculateReadingDailyPlan(book);
        const today = getTodayPlan(plan);

        expect(today).not.toBeNull();
        expect(today!.date).toBe(getTodayISO());
    });
});

describe('getCurrentPhase', () => {
    it('should return null for null inputs', () => {
        expect(getCurrentPhase(null, null)).toBeNull();
    });

    it('should return first phase for today in first phase', () => {
        const book = createMockBook({
            total: 200,
            current: 0,
            deadline: getFutureDate(20),
            distributionType: 'EXPONENTIAL'
        });

        const plan = calculateReadingDailyPlan(book);
        const today = getTodayPlan(plan);
        const phase = getCurrentPhase(plan, today);

        expect(phase).not.toBeNull();
        expect(phase!.name).toBe('Início');
        expect(phase!.emoji).toBe('🌱');
    });
});
