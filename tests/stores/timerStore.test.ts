import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { getTimerDisplayMs, useTimerStore } from '../../stores/timerStore';

describe('timerStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 3, 21, 10, 0, 0));
        useTimerStore.getState()._reset();
        useTimerStore.getState()._hydrateFromFirestore(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('pausing a countdown keeps the remaining time and resuming moves endTime forward', () => {
        const store = useTimerStore.getState();
        store.startTimer(60, 'Teste');
        vi.advanceTimersByTime(20_000);
        store.pause();

        let timer = useTimerStore.getState().timer;
        expect(timer.status).toBe('PAUSED');
        expect(getTimerDisplayMs(timer)).toBe(40_000);

        vi.advanceTimersByTime(30_000); // pausado: não deve consumir tempo
        store.resume();
        timer = useTimerStore.getState().timer;
        expect(timer.endTime).toBe(Date.now() + 40_000);
        vi.advanceTimersByTime(10_000);
        expect(getTimerDisplayMs(useTimerStore.getState().timer)).toBe(30_000);
    });

    it('stopping a stopwatch freezes the elapsed time', () => {
        const store = useTimerStore.getState();
        store.startStopwatch();
        vi.advanceTimersByTime(5_000);
        store.stop();
        vi.advanceTimersByTime(5_000);

        const timer = useTimerStore.getState().timer;
        expect(timer.status).toBe('FINISHED');
        expect(getTimerDisplayMs(timer)).toBe(5_000);
    });

    it('reads countdown state written by the TimerTool (endTime without startTime)', () => {
        const now = Date.now();
        expect(getTimerDisplayMs({
            mode: 'TIMER', status: 'RUNNING', startTime: null, endTime: now + 90_000,
            accumulated: 0, totalDuration: 1500,
        }, now)).toBe(90_000);
        expect(getTimerDisplayMs({
            mode: 'TIMER', status: 'PAUSED', startTime: null, endTime: now,
            accumulated: 12_000, totalDuration: 1500,
        }, now)).toBe(12_000);
    });
});
