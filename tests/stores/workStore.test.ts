import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { writeToFirestore } from '../../stores/firestoreSync';
import { useWorkStore } from '../../stores/workStore';

describe('workStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 3, 21, 10, 0, 0));
        vi.clearAllMocks();
        useWorkStore.getState()._reset();
        useWorkStore.getState()._hydrateFromFirestore(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resets daily tracking and syncs when the day changes', () => {
        useWorkStore.setState({
            currentCount: 41,
            preBreakCount: 4,
            lastActiveDate: '2026-04-20',
            _initialized: true,
        } as any);

        const changed = useWorkStore.getState().ensureCurrentDay();

        expect(changed).toBe(true);
        expect(useWorkStore.getState().currentCount).toBe(0);
        expect(useWorkStore.getState().preBreakCount).toBe(0);
        expect(useWorkStore.getState().lastActiveDate).toBe('2026-04-21');
        expect(writeToFirestore).toHaveBeenCalledWith(
            'p67_work_store',
            expect.objectContaining({
                currentCount: 0,
                preBreakCount: 0,
                lastActiveDate: '2026-04-21',
            })
        );
    });

    it('keeps the counters untouched when the day is still the same', () => {
        useWorkStore.setState({
            currentCount: 41,
            preBreakCount: 4,
            lastActiveDate: '2026-04-21',
            _initialized: true,
        } as any);

        const changed = useWorkStore.getState().ensureCurrentDay();

        expect(changed).toBe(false);
        expect(useWorkStore.getState().currentCount).toBe(41);
        expect(useWorkStore.getState().preBreakCount).toBe(4);
        expect(writeToFirestore).not.toHaveBeenCalled();
    });

    it('uses 06:00 operational cutoff for daily work reset', () => {
        // At 05:30 on April 21, operational date is still April 20
        vi.setSystemTime(new Date(2026, 3, 21, 5, 30, 0));
        useWorkStore.setState({
            currentCount: 15,
            lastActiveDate: '2026-04-20',
            _initialized: true,
        } as any);

        const changed = useWorkStore.getState().ensureCurrentDay();

        expect(changed).toBe(false);
        expect(useWorkStore.getState().currentCount).toBe(15);
        expect(useWorkStore.getState().lastActiveDate).toBe('2026-04-20');

        // At 06:01 on April 21, operational date rolls over to April 21
        vi.setSystemTime(new Date(2026, 3, 21, 6, 1, 0));
        const changedAfterCutoff = useWorkStore.getState().ensureCurrentDay();

        expect(changedAfterCutoff).toBe(true);
        expect(useWorkStore.getState().currentCount).toBe(0);
        expect(useWorkStore.getState().lastActiveDate).toBe('2026-04-21');
    });

    it('resets yesterday counters before applying a daily goal override', () => {
        useWorkStore.setState({
            currentCount: 41,
            preBreakCount: 4,
            lastActiveDate: '2026-04-20',
            _initialized: true,
        } as any);

        useWorkStore.getState().setDailyGoalOverride(80);

        const state = useWorkStore.getState();
        expect(state.dailyGoalOverride).toBe(80);
        expect(state.currentCount).toBe(0);
        expect(state.preBreakCount).toBe(0);
        expect(state.lastActiveDate).toBe('2026-04-21');
    });

    it('sanitizes invalid counts coming from number inputs', () => {
        const store = useWorkStore.getState();
        store.setCurrentCount(-5);
        expect(useWorkStore.getState().currentCount).toBe(0);
        store.setCurrentCount(Number.NaN);
        expect(useWorkStore.getState().currentCount).toBe(0);
        store.setCurrentCount(12.6);
        expect(useWorkStore.getState().currentCount).toBe(13);
        store.setPreBreakCount(-3);
        expect(useWorkStore.getState().preBreakCount).toBe(0);
        store.setDailyGoalOverride(Number.NaN);
        expect(useWorkStore.getState().dailyGoalOverride).toBeNull();
    });

    it('sanitizes weekly goal and keeps work days when input is invalid', () => {
        const store = useWorkStore.getState();
        store.setWeeklyWorkDays('2026-W17', 5);
        store.setWeeklyGoal('2026-W17', -10);
        expect(useWorkStore.getState().getWeeklyGoal('2026-W17')).toBe(0);
        store.setWeeklyWorkDays('2026-W17', Number.NaN);
        expect(useWorkStore.getState().getWeeklyWorkDays('2026-W17')).toBe(5);
    });

    it('reads the current week goal from the operational week (Monday before 06:00 is still last week)', () => {
        useWorkStore.getState().setWeeklyGoal('2026-W17', 500);
        useWorkStore.getState().setWeeklyGoal('2026-W18', 900);

        // Segunda, 27/04/2026 às 05:00 -> dia operacional é domingo 26/04 (W17)
        vi.setSystemTime(new Date(2026, 3, 27, 5, 0, 0));
        expect(useWorkStore.getState().getCurrentWeekGoal()).toBe(500);

        vi.setSystemTime(new Date(2026, 3, 27, 7, 0, 0));
        expect(useWorkStore.getState().getCurrentWeekGoal()).toBe(900);
    });
});
