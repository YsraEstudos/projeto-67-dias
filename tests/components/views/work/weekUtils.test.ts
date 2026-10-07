import { afterEach, describe, expect, it } from 'vitest';
import {
    getISOWeekKey,
    getOperationalWeekKey,
    getPreviousWeekKey,
} from '../../../../components/views/work/utils/weekUtils';

describe('weekUtils', () => {
    const originalTZ = process.env.TZ;

    afterEach(() => {
        process.env.TZ = originalTZ;
    });

    it('computes ISO week keys across year boundaries', () => {
        expect(getISOWeekKey(new Date(2026, 0, 1))).toBe('2026-W01');
        expect(getISOWeekKey(new Date(2027, 0, 1))).toBe('2026-W53');
        expect(getISOWeekKey(new Date(2027, 0, 4))).toBe('2027-W01');
        expect(getPreviousWeekKey('2027-W01')).toBe('2026-W53');
    });

    it('is not shifted by daylight saving offsets (southern hemisphere)', () => {
        // Em Sydney, 1º de janeiro está em horário de verão e abril não: a diferença
        // em ms ganha 1h e o ceil empurrava a quinta-feira para a semana seguinte.
        process.env.TZ = 'Australia/Sydney';
        expect(new Date(2027, 0, 1).getTimezoneOffset()).toBe(-660);
        expect(getISOWeekKey(new Date(2027, 3, 8))).toBe('2027-W14');
        expect(getISOWeekKey(new Date(2027, 3, 5))).toBe('2027-W14');
    });

    it('uses the operational day (06:00 cutoff) for the current week', () => {
        // Segunda 27/04/2026 05:59 ainda pertence ao turno de domingo (W17)
        expect(getOperationalWeekKey(new Date(2026, 3, 27, 5, 59))).toBe('2026-W17');
        expect(getOperationalWeekKey(new Date(2026, 3, 27, 6, 0))).toBe('2026-W18');
    });
});
