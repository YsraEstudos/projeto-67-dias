import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSubHabits } from '../../../components/habits/subHabitUtils';
import { getDaysUntil, isTaskOverdue } from '../../../components/habits/taskDateUtils';

describe('buildSubHabits', () => {
    it('keeps the ids of existing sub-habits so history stays linked', () => {
        const existing = [{ id: 'a', title: 'Ler' }, { id: 'b', title: 'Resumir' }];
        const result = buildSubHabits(['Resumir', 'Novo', 'Ler'], existing);
        expect(result[0]).toEqual({ id: 'b', title: 'Resumir' });
        expect(result[2]).toEqual({ id: 'a', title: 'Ler' });
        expect(result[1].title).toBe('Novo');
        expect(['a', 'b']).not.toContain(result[1].id);
    });

    it('handles duplicate titles without reusing the same id twice', () => {
        const existing = [{ id: 'a', title: 'X' }];
        const result = buildSubHabits(['X', 'X'], existing);
        expect(result[0].id).toBe('a');
        expect(result[1].id).not.toBe('a');
    });

    it('works for new habits without existing sub-habits', () => {
        const result = buildSubHabits(['A', 'B']);
        expect(result).toHaveLength(2);
        expect(new Set(result.map(r => r.id)).size).toBe(2);
    });
});

describe('taskDateUtils', () => {
    afterEach(() => vi.useRealTimers());

    it('computes calendar-day differences', () => {
        expect(getDaysUntil('2026-07-10', '2026-07-10')).toBe(0);
        expect(getDaysUntil('2026-07-11', '2026-07-10')).toBe(1);
        expect(getDaysUntil('2026-07-07', '2026-07-10')).toBe(-3);
        expect(getDaysUntil('', '2026-07-10')).toBeNull();
        expect(getDaysUntil('lixo', '2026-07-10')).toBeNull();
    });

    it('does not treat a task due today as overdue (even late at night)', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 6, 10, 23, 30));
        expect(isTaskOverdue('2026-07-10')).toBe(false);
        expect(isTaskOverdue('2026-07-09')).toBe(true);
        expect(isTaskOverdue(undefined)).toBe(false);
    });
});
