import { describe, expect, it } from 'vitest';
import {
    isJournalEntrySaved,
    formatJournalDate,
    parseJournalLine,
    toggleChecklistLine,
    normalizeJournalSearch,
    sortJournalEntries,
} from './journalFormatting';

describe('journalFormatting', () => {
    it('detects saved state from the new and legacy flags', () => {
        expect(isJournalEntrySaved({ isSaved: true })).toBe(true);
        expect(isJournalEntrySaved({ isFinalized: true })).toBe(true);
        expect(isJournalEntrySaved({ isSaved: false, isFinalized: false })).toBe(false);
        expect(isJournalEntrySaved(null)).toBe(false);
    });

    it('formats date-only journal values as local calendar dates', () => {
        expect(formatJournalDate('2026-04-17')).toBe('17 de abril');
    });

    it('toggles checklist lines only when the line is a checklist item', () => {
        const content = ['Linha normal', '- [ ] tarefa', '- [x] feito'].join('\n');

        expect(toggleChecklistLine(content, 1)).toBe(['Linha normal', '- [x] tarefa', '- [x] feito'].join('\n'));
        expect(toggleChecklistLine(content, 2)).toBe(['Linha normal', '- [ ] tarefa', '- [ ] feito'].join('\n'));
        expect(toggleChecklistLine(content, 0)).toBe(content);
    });

    it('parses journal lines into text, blank, and checklist shapes', () => {
        expect(parseJournalLine('')).toEqual({ kind: 'blank' });
        expect(parseJournalLine('Linha normal')).toEqual({ kind: 'text', text: 'Linha normal' });
        expect(parseJournalLine('  - [x] tarefa')).toEqual({
            kind: 'checklist',
            indent: '  ',
            bullet: '-',
            checked: true,
            text: 'tarefa',
        });
    });

    it('normalizes search text ignoring case and accents', () => {
        expect(normalizeJournalSearch('Reunião ÀS 10h')).toBe('reuniao as 10h');
        expect(normalizeJournalSearch(undefined)).toBe('');
    });

    it('sorts entries newest first by date then creation time without mutating', () => {
        const input = [
            { id: 'a', date: '2026-01-02', createdAt: 5, updatedAt: 5 },
            { id: 'b', date: '2026-03-01', createdAt: 1, updatedAt: 1 },
            { id: 'c', date: '2026-01-02', createdAt: 9, updatedAt: 9 },
        ];
        expect(sortJournalEntries(input).map(e => e.id)).toEqual(['b', 'c', 'a']);
        expect(input.map(e => e.id)).toEqual(['a', 'b', 'c']);
    });
});
