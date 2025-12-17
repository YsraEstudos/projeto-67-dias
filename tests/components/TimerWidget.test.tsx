import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerWidget } from '../../components/TimerWidget';
import { useTimerStore } from '../../stores/timerStore';
import { GlobalTimerState } from '../../types';

// Mock persistMiddleware to avoid side effects
vi.mock('../../stores/persistMiddleware', () => ({
    createFirebaseStorage: () => ({
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    }),
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
});
