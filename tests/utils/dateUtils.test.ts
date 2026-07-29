import { describe, it, expect } from 'vitest';
import { getOperationalDateISO, formatDateISO } from '../../utils/dateUtils';

describe('dateUtils - Operational Date', () => {
    const createLocalDate = (year: number, month: number, day: number, hours: number, minutes: number): Date => {
        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    };

    it('should attribute times between 00:00 and 05:59 to the previous operational day', () => {
        const earlyMorning = createLocalDate(2026, 7, 27, 5, 59);
        expect(getOperationalDateISO(earlyMorning)).toBe('2026-07-26');
    });

    it('should attribute 06:00 onwards to the current operational day', () => {
        const exactlySix = createLocalDate(2026, 7, 27, 6, 0);
        expect(getOperationalDateISO(exactlySix)).toBe('2026-07-27');
    });

    it('should format civil date correctly with formatDateISO regardless of hour', () => {
        const lateNight = createLocalDate(2026, 7, 27, 23, 30);
        expect(formatDateISO(lateNight)).toBe('2026-07-27');
    });
});
