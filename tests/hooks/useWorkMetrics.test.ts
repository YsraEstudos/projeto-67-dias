import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useWorkMetrics } from '../../components/views/work/hooks/useWorkMetrics';

const ensureCurrentDay = vi.fn();
vi.mock('../../stores', () => ({
    useWorkStore: () => ensureCurrentDay,
}));

describe('useWorkMetrics hook', () => {
    it('calculates metrics correctly with a break', () => {
        const { result } = renderHook(() => useWorkMetrics({
            goal: 100,
            startTime: '08:00',
            endTime: '17:00',
            breakTime: '12:00',
            currentCount: 10,
            preBreakCount: 5,
            paceMode: '10m'
        }));

        expect(result.current.hasBreak).toBe(true);
        // 9 hours total (08:00 - 17:00) minus 1 hour break = 8 hours total duration (480 mins)
        // expected pre break ratio: (12:00 - 08:00) = 4 hours / 8 hours = 50%
        expect(result.current.expectedPreBreakCount).toBe(50);
    });

    it('calculates metrics correctly without a break', () => {
        const { result } = renderHook(() => useWorkMetrics({
            goal: 100,
            startTime: '08:00',
            endTime: '13:00',
            breakTime: '',
            currentCount: 10,
            preBreakCount: 0,
            paceMode: '10m'
        }));

        expect(result.current.hasBreak).toBe(false);
        // expected pre break ratio: 0 (since hasBreak is false)
        expect(result.current.expectedPreBreakCount).toBe(0);
    });

    describe('with frozen clock', () => {
        afterEach(() => {
            vi.useRealTimers();
            ensureCurrentDay.mockClear();
        });

        it('checks the operational day immediately on mount', () => {
            ensureCurrentDay.mockClear();
            renderHook(() => useWorkMetrics({
                goal: 100, startTime: '08:00', endTime: '17:00', breakTime: '12:00',
                currentCount: 0, preBreakCount: 0, paceMode: '10m'
            }));
            expect(ensureCurrentDay).toHaveBeenCalledTimes(1);
        });

        it('projects the end-of-day total from worked minutes, excluding the break', () => {
            vi.useFakeTimers();
            // 14:00 -> trabalhou 08-12 + 13-14 = 300 min de 480 totais
            vi.setSystemTime(new Date(2026, 3, 21, 14, 0, 0));
            const { result } = renderHook(() => useWorkMetrics({
                goal: 100, startTime: '08:00', endTime: '17:00', breakTime: '12:00',
                currentCount: 50, preBreakCount: 40, paceMode: '10m'
            }));

            expect(result.current.elapsedWorkMinutes).toBe(300);
            expect(result.current.projectedCount).toBe(80);
        });

        it('does not project before enough minutes were worked', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 3, 21, 8, 5, 0));
            const { result } = renderHook(() => useWorkMetrics({
                goal: 100, startTime: '08:00', endTime: '17:00', breakTime: '12:00',
                currentCount: 3, preBreakCount: 0, paceMode: '10m'
            }));

            expect(result.current.projectedCount).toBeNull();
        });
    });
});
