import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerWidget } from '../../components/TimerWidget';
import { useTimerStore } from '../../stores/timerStore';
import { GlobalTimerState } from '../../types';

// Mock firestoreSync to avoid side effects
vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
    subscribeToDocument: vi.fn(() => vi.fn()),
    getCurrentUserId: vi.fn(() => 'test-user'),
}));

const DEFAULT_TIMER: GlobalTimerState = {
    mode: 'TIMER',
    status: 'IDLE',
    startTime: null,
    endTime: null,
    accumulated: 0,
    totalDuration: 0,
    label: undefined,
};

describe('TimerWidget Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Reset store
        const store = useTimerStore.getState();
        store.reset();
        store.setTimer(DEFAULT_TIMER);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not render when status is IDLE', () => {
        // Default is IDLE
        render(<TimerWidget onClick={() => { }} />);
        expect(screen.queryByTestId('timer-widget')).not.toBeInTheDocument();
    });

    it('renders when status is RUNNING', () => {
        const store = useTimerStore.getState();
        act(() => {
            store.setTimer({
                status: 'RUNNING',
                endTime: Date.now() + 60000 // 1 minute from now
            });
        });

        render(<TimerWidget onClick={() => { }} />);
        expect(screen.getByTestId('timer-widget')).toBeInTheDocument();
    });

    it('expands on click', () => {
        const store = useTimerStore.getState();
        act(() => {
            store.setTimer({
                status: 'RUNNING',
                endTime: Date.now() + 60000
            });
        });

        render(<TimerWidget onClick={() => { }} />);

        const widget = screen.getByTestId('timer-widget');
        fireEvent.click(widget);

        expect(screen.getByText('Abrir Ferramentas')).toBeInTheDocument();
    });

    it('calls onClick when "Abrir Ferramentas" is clicked', () => {
        const store = useTimerStore.getState();
        act(() => {
            store.setTimer({
                status: 'RUNNING',
                endTime: Date.now() + 60000
            });
        });

        const handleClick = vi.fn();
        render(<TimerWidget onClick={handleClick} />);

        const widget = screen.getByTestId('timer-widget');
        fireEvent.click(widget);

        const button = screen.getByText('Abrir Ferramentas');
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalled();
    });

    it('counts down from endTime and finishes the timer when it reaches zero', () => {
        act(() => {
            useTimerStore.getState().setTimer({
                mode: 'TIMER',
                status: 'RUNNING',
                startTime: null,
                endTime: Date.now() + 3000,
                totalDuration: 1500,
                label: 'Pomodoro',
            });
        });

        render(<TimerWidget onClick={() => { }} />);
        const fab = screen.getByRole('button', { name: /Pomodoro: em andamento \(00:03\)/ });
        expect(fab).toHaveAttribute('aria-expanded', 'false');

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(screen.getByRole('button', { name: /\(00:02\)/ })).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(useTimerStore.getState().timer.status).toBe('FINISHED');
        expect(screen.queryByTestId('timer-widget')).not.toBeInTheDocument();
    });

    it('shows the remaining time stored in accumulated while paused', () => {
        act(() => {
            useTimerStore.getState().setTimer({
                mode: 'TIMER',
                status: 'PAUSED',
                startTime: null,
                endTime: null,
                accumulated: 65_000,
                totalDuration: 1500,
                label: 'Pomodoro',
            });
        });

        render(<TimerWidget onClick={() => { }} />);
        expect(screen.getByRole('button', { name: /Pomodoro: pausado \(01:05\)/ })).toBeInTheDocument();
    });
});
