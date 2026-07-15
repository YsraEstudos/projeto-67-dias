import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useWorkMetrics } from '../../components/views/work/hooks/useWorkMetrics';

vi.mock('../../stores', () => ({
    useWorkStore: () => vi.fn(),
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
});
