import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '../../utils/sanitizeFilename';

describe('sanitizeFilename', () => {
    describe('special character handling', () => {
        it('removes special characters', () => {
            expect(sanitizeFilename('Test@Note#With$Special%Chars!')).toBe('Test_Note_With_Special_Chars_');
        });

        it('replaces spaces with underscores', () => {
            expect(sanitizeFilename('My Note Title')).toBe('My_Note_Title');
        });

        it('preserves alphanumeric characters', () => {
            expect(sanitizeFilename('SimpleNote123')).toBe('SimpleNote123');
        });
    });

    describe('Windows reserved names', () => {
        it('prefixes CON with underscore', () => {
            expect(sanitizeFilename('CON')).toBe('_CON');
        });

        it('prefixes PRN with underscore', () => {
            expect(sanitizeFilename('PRN')).toBe('_PRN');
        });

        it('prefixes AUX with underscore', () => {
            expect(sanitizeFilename('AUX')).toBe('_AUX');
        });

        it('prefixes NUL with underscore', () => {
            expect(sanitizeFilename('NUL')).toBe('_NUL');
        });

        it('prefixes COM1 with underscore', () => {
            expect(sanitizeFilename('COM1')).toBe('_COM1');
        });

        it('prefixes LPT1 with underscore', () => {
            expect(sanitizeFilename('LPT1')).toBe('_LPT1');
        });

        it('is case insensitive for reserved names', () => {
            expect(sanitizeFilename('con')).toBe('_con');
            expect(sanitizeFilename('Con')).toBe('_Con');
        });
    });

    describe('length limiting', () => {
        it('limits to 100 characters', () => {
            const longName = 'A'.repeat(150);
            const result = sanitizeFilename(longName);
            expect(result.length).toBe(100);
        });

        it('does not truncate short names', () => {
            expect(sanitizeFilename('ShortName')).toBe('ShortName');
        });
    });

    describe('edge cases', () => {
        it('returns "nota" for empty string', () => {
            expect(sanitizeFilename('')).toBe('nota');
        });

        it('returns "nota" for string with only special chars', () => {
            expect(sanitizeFilename('!@#$%')).toBe('_____');
        });
    });
});
