import { JournalEntry } from '../../../stores/journalStore';
import { formatDateBR } from '../../../utils/dateUtils';

export const CHECKLIST_LINE_REGEX = /^(\s*)([-*+])\s+\[( |x|X)\]\s*(.*)$/;

export const isJournalEntrySaved = (entry?: Pick<JournalEntry, 'isSaved' | 'isFinalized'> | null) => {
    if (!entry) return false;
    return Boolean(entry.isSaved ?? entry.isFinalized ?? false);
};

export const formatJournalDate = (date: Date | string, formatStr = "d 'de' MMMM") => {
    return formatDateBR(date, formatStr);
};

export const toggleChecklistLine = (content: string, lineIndex: number) => {
    const lines = content.split('\n');
    const line = lines[lineIndex];
    if (typeof line !== 'string') return content;

    const match = line.match(CHECKLIST_LINE_REGEX);
    if (!match) return content;

    const checked = match[3].toLowerCase() === 'x';
    lines[lineIndex] = line.replace(/\[( |x|X)\]/, checked ? '[ ]' : '[x]');
    return lines.join('\n');
};

export const parseJournalLine = (line: string) => {
    const match = line.match(CHECKLIST_LINE_REGEX);

    if (match) {
        const [, indent, bullet, checkedMark, text] = match;
        return {
            kind: 'checklist' as const,
            indent,
            bullet,
            checked: checkedMark.toLowerCase() === 'x',
            text,
        };
    }

    if (line.trim().length === 0) {
        return { kind: 'blank' as const };
    }

    return {
        kind: 'text' as const,
        text: line,
    };
};

/** Lowercase + strip accents so searches like "reuniao" match "Reunião". */
export const normalizeJournalSearch = (value: string | undefined | null) =>
    (value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Newest first: by entry date (YYYY-MM-DD), then by creation time. Does not mutate. */
export const sortJournalEntries = <T extends Pick<JournalEntry, 'date' | 'createdAt' | 'updatedAt'>>(entries: T[]): T[] =>
    [...entries].sort((a, b) => {
        const byDate = (b.date || '').localeCompare(a.date || '');
        if (byDate !== 0) return byDate;
        return (b.createdAt ?? b.updatedAt ?? 0) - (a.createdAt ?? a.updatedAt ?? 0);
    });
