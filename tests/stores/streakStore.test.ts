import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useStreakStore } from '../../stores/streakStore';

const setToday = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    vi.setSystemTime(new Date(y, m - 1, d, 12, 0, 0));
};

describe('streakStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useStreakStore.getState()._reset();
        useStreakStore.getState()._hydrateFromFirestore(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('increments the streak on consecutive days', () => {
        setToday('2026-07-01');
        useStreakStore.getState().recordActivity();
        setToday('2026-07-02');
        useStreakStore.getState().recordActivity();

        const s = useStreakStore.getState();
        expect(s.currentStreak).toBe(2);
        expect(s.totalActiveDays).toBe(2);
        expect(s.totalFreezeUsed).toBe(0);
    });

    it('counts automatically consumed freeze days in totalFreezeUsed', () => {
        setToday('2026-07-01');
        useStreakStore.getState().recordActivity();
        // Skip two days (07-02, 07-03) -> 2 freezes consumed
        setToday('2026-07-04');
        useStreakStore.getState().recordActivity();

        const s = useStreakStore.getState();
        expect(s.currentStreak).toBe(2);
        expect(s.freezeDaysUsed).toBe(2);
        expect(s.freezeDaysAvailable).toBe(1);
        expect(s.totalFreezeUsed).toBe(2);
    });

    it('resets the streak after a long gap without counting freezes', () => {
        setToday('2026-07-01');
        useStreakStore.getState().recordActivity();
        setToday('2026-07-10');
        useStreakStore.getState().recordActivity();

        const s = useStreakStore.getState();
        expect(s.currentStreak).toBe(1);
        expect(s.longestStreak).toBe(1);
        expect(s.totalFreezeUsed).toBe(0);
    });

    it('records only once per day', () => {
        setToday('2026-07-01');
        useStreakStore.getState().recordActivity();
        useStreakStore.getState().recordActivity();
        expect(useStreakStore.getState().totalActiveDays).toBe(1);
    });
});
