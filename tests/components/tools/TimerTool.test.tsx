import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
    subscribeToDocument: vi.fn(() => vi.fn()),
    getCurrentUserId: vi.fn(() => 'test-user'),
}));

import { TimerTool } from '../../../components/tools/TimerTool';
import { useTimerStore } from '../../../stores/timerStore';

describe('TimerTool (totalDuration is stored in seconds)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 7, 10, 0, 0));
        useTimerStore.getState().setTimer({
            mode: 'TIMER',
            status: 'IDLE',
            startTime: null,
            endTime: null,
            accumulated: 0,
            totalDuration: 25 * 60,
            label: 'Pomodoro',
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows 25:00 for an idle 25-minute preset', () => {
        render(<TimerTool />);
        expect(screen.getByText('25:00')).toBeInTheDocument();
    });

    it('starts a countdown that ends 25 minutes later (not 1.5 seconds)', () => {
        render(<TimerTool />);
        fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }));

        const timer = useTimerStore.getState().timer;
        expect(timer.status).toBe('RUNNING');
        expect(timer.endTime).toBe(Date.now() + 25 * 60 * 1000);

        act(() => { vi.advanceTimersByTime(60_000); });
        expect(useTimerStore.getState().timer.status).toBe('RUNNING');
        expect(screen.getByText('24:00')).toBeInTheDocument();
    });

    it('5-minute preset displays 05:00', () => {
        render(<TimerTool />);
        fireEvent.click(screen.getByText('Pausa'));
        expect(useTimerStore.getState().timer.totalDuration).toBe(300);
        expect(screen.getByText('05:00')).toBeInTheDocument();
    });
});
