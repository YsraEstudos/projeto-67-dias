import { describe, expect, it } from 'vitest';
import {
    isJournalEntrySaved,
    parseJournalLine,
    toggleChecklistLine,
} from './journalFormatting';

describe('journalFormatting', () => {
    it('detects saved state from the new and legacy flags', () => {
        expect(isJournalEntrySaved({ isSaved: true })).toBe(true);
        expect(isJournalEntrySaved({ isFinalized: true })).toBe(true);
        expect(isJournalEntrySaved({ isSaved: false, isFinalized: false })).toBe(false);
        expect(isJournalEntrySaved(null)).toBe(false);
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
});
