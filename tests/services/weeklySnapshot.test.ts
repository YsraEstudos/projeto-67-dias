import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateCurrentDay, calculateCurrentWeek, getDaysUntilStart, JOURNEY_CONFIG } from '../../services/weeklySnapshot';

describe('weeklySnapshot date calculations', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('calculateCurrentDay', () => {
        it('returns 1 when startDate is today (same hour)', () => {
            const now = new Date('2025-12-13T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-13T07:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(1);
        });

        it('returns 1 when startDate is later today', () => {
            const now = new Date('2025-12-13T08:00:00');
            vi.setSystemTime(now);

            // startDate is in the future (same day) - should still be Day 1
            const startDate = new Date('2025-12-13T23:59:59').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(1);
        });

        it('returns 1 when startDate is at midnight today', () => {
            const now = new Date('2025-12-13T12:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-13T00:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(1);
        });

        it('returns 2 when startDate was yesterday', () => {
            const now = new Date('2025-12-13T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-12T08:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(2);
        });

        it('returns 3 when startDate was 2 days ago', () => {
            const now = new Date('2025-12-13T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-11T15:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(3);
        });

        it('caps at 67 days', () => {
            const now = new Date('2025-12-13T08:00:00');
            vi.setSystemTime(now);

            // 100 days ago
            const startDate = new Date('2025-09-04T08:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(JOURNEY_CONFIG.TOTAL_DAYS);
        });

        it('returns 1 even if startDate is 1 second ago same day', () => {
            const now = new Date('2025-12-13T08:00:01');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-13T08:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(1);
        });

        // NEW: Tests for future dates
        it('returns 0 when startDate is tomorrow (journey not started)', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-21T08:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(0);
        });

        it('returns 0 when startDate is 2 days in the future', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-22T08:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(0);
        });

        it('returns 0 when startDate is far in the future', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2026-01-15T08:00:00').toISOString();
            expect(calculateCurrentDay(startDate)).toBe(0);
        });
    });

    describe('getDaysUntilStart', () => {
        it('returns 0 when startDate is today', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-20T12:00:00').toISOString();
            expect(getDaysUntilStart(startDate)).toBe(0);
        });

        it('returns 0 when startDate is in the past', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-15T08:00:00').toISOString();
            expect(getDaysUntilStart(startDate)).toBe(0);
        });

        it('returns 1 when startDate is tomorrow', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-21T08:00:00').toISOString();
            expect(getDaysUntilStart(startDate)).toBe(1);
        });

        it('returns 2 when startDate is 2 days in the future', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-22T08:00:00').toISOString();
            expect(getDaysUntilStart(startDate)).toBe(2);
        });

        it('returns correct days for far future date', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            // 26 days in the future
            const startDate = new Date('2026-01-15T08:00:00').toISOString();
            expect(getDaysUntilStart(startDate)).toBe(26);
        });
    });

    describe('calculateCurrentWeek', () => {
        it('returns 1 on the first day', () => {
            const now = new Date('2025-12-13T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-13T07:00:00').toISOString();
            expect(calculateCurrentWeek(startDate)).toBe(1);
        });

        it('returns 1 on day 7', () => {
            const now = new Date('2025-12-19T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-13T08:00:00').toISOString();
            expect(calculateCurrentWeek(startDate)).toBe(1);
        });

        it('returns 2 on day 8', () => {
            const now = new Date('2025-12-20T08:00:00');
            vi.setSystemTime(now);

            const startDate = new Date('2025-12-13T08:00:00').toISOString();
            expect(calculateCurrentWeek(startDate)).toBe(2);
        });

        it('caps at 10 weeks', () => {
            const now = new Date('2025-12-13T08:00:00');
            vi.setSystemTime(now);

            // 100 days ago - more than 10 weeks
            const startDate = new Date('2025-09-04T08:00:00').toISOString();
            expect(calculateCurrentWeek(startDate)).toBe(JOURNEY_CONFIG.TOTAL_WEEKS);
        });
    });
});

