import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useWaterStore, sanitizeGoal, MAX_DAILY_GOAL, MIN_DAILY_GOAL } from '../../stores/waterStore';

const setNow = (iso: string, hour = 12) => {
    const [y, m, d] = iso.split('-').map(Number);
    vi.setSystemTime(new Date(y, m - 1, d, hour, 0, 0));
};

describe('waterStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setNow('2026-07-01');
        useWaterStore.getState()._reset();
        useWaterStore.getState()._hydrateFromFirestore(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('checkDate resets currentAmount to the new day log', () => {
        useWaterStore.getState().addWater(500, '2026-07-01');
        expect(useWaterStore.getState().currentAmount).toBe(500);

        useWaterStore.getState().checkDate('2026-07-02');
        const s = useWaterStore.getState();
        expect(s.today).toBe('2026-07-02');
        expect(s.currentAmount).toBe(0);
        expect(s.history['2026-07-01'].amount).toBe(500);
    });

    it('rolls over to the real day when adding water with a stale "today"', () => {
        useWaterStore.getState().addWater(300, '2026-07-01');
        // App left open past midnight; checkDate never ran
        setNow('2026-07-02', 0);
        useWaterStore.getState().addWater(200, '2026-07-02');

        const s = useWaterStore.getState();
        expect(s.today).toBe('2026-07-02');
        expect(s.currentAmount).toBe(200);
    });

    it('ignores non-positive or invalid amounts', () => {
        useWaterStore.getState().addWater(0, '2026-07-01');
        useWaterStore.getState().addWater(-100, '2026-07-01');
        useWaterStore.getState().addWater(Number.NaN, '2026-07-01');
        expect(useWaterStore.getState().currentAmount).toBe(0);
        expect(useWaterStore.getState().history['2026-07-01']).toBeUndefined();
    });

    it('sanitizes the daily goal (no zero/negative/NaN goals)', () => {
        useWaterStore.getState().setGoal(0);
        expect(useWaterStore.getState().dailyGoal).toBe(2500);
        useWaterStore.getState().setGoal(100);
        expect(useWaterStore.getState().dailyGoal).toBe(MIN_DAILY_GOAL);
        useWaterStore.getState().setGoal(999999);
        expect(useWaterStore.getState().dailyGoal).toBe(MAX_DAILY_GOAL);
        useWaterStore.getState().setGoal(3000);
        expect(useWaterStore.getState().dailyGoal).toBe(3000);
        expect(useWaterStore.getState().history['2026-07-01'].goal).toBe(3000);

        expect(sanitizeGoal(undefined)).toBe(2500);
        expect(sanitizeGoal('abc')).toBe(2500);
    });

    it('hydration with an invalid goal falls back to a safe value', () => {
        useWaterStore.getState()._reset();
        useWaterStore.getState()._hydrateFromFirestore({
            dailyGoal: -5,
            history: { '2026-07-01': { amount: 800, goal: 2000 } },
            today: '2026-06-30',
            bottles: [],
        });
        const s = useWaterStore.getState();
        expect(s.dailyGoal).toBe(2500);
        expect(s.currentAmount).toBe(800);
        expect(s.today).toBe('2026-07-01');
    });
});
