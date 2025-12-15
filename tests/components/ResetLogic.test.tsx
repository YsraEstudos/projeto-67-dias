import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calculateCurrentDay, calculateCurrentWeek } from '../../services/weeklySnapshot';

describe('Date Calculation Logic', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should count partial days as a full day (Calendar Day logic)', () => {
        // Scenario: User starts at 23:00 on Monday
        const startDate = new Date(2023, 0, 1, 23, 0, 0).toISOString(); // Jan 1st, 23:00

        // Scenario: Check at 01:00 on Tuesday (2 hours later)
        const checkDate = new Date(2023, 0, 2, 1, 0, 0); // Jan 2nd, 01:00
        vi.setSystemTime(checkDate);

        // Old 24h Logic would say: 2 hours elapsed < 24 hours -> Day 1
        // correct Calendar Logic should say: It's a different calendar day -> Day 2

        const day = calculateCurrentDay(startDate);
        expect(day).toBe(2);
    });

    it('should be Day 1 immediately after start', () => {
        const startDate = new Date(2023, 0, 1, 10, 0, 0).toISOString();
        vi.setSystemTime(new Date(2023, 0, 1, 10, 0, 1));

        expect(calculateCurrentDay(startDate)).toBe(1);
    });

    it('should be Day 1 even at 23:59 of same day', () => {
        const startDate = new Date(2023, 0, 1, 10, 0, 0).toISOString();
        vi.setSystemTime(new Date(2023, 0, 1, 23, 59, 59));

        expect(calculateCurrentDay(startDate)).toBe(1);
    });

    it('should be Day 67 exactly on the 67th calendar day', () => {
        const startDate = new Date(2023, 0, 1, 10, 0, 0).toISOString();
        // Day 1 = Jan 1
        // Day 67 = Jan 1 + 66 days = March 8 roughly

        const day67 = new Date(2023, 0, 1);
        day67.setDate(day67.getDate() + 66); // +66 days difference = 67th day
        day67.setHours(12, 0, 0);

        vi.setSystemTime(day67);
        expect(calculateCurrentDay(startDate)).toBe(67);
    });
});
