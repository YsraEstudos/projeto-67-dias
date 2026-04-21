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
});
