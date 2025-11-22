import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerWidget } from '../../components/TimerWidget';

// Mock useLocalStorage
const mockSetState = vi.fn();
const mockState = {
    mode: 'TIMER',
    status: 'IDLE',
    startTime: null,
    endTime: null,
    accumulated: 0,
    totalDuration: 0
};

vi.mock('../../hooks/useLocalStorage', () => ({
    useLocalStorage: (key: string, initialValue: any) => {
        return [mockState, mockSetState];
    }
}));

describe('TimerWidget Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not render when status is IDLE', () => {
        mockState.status = 'IDLE';
        render(<TimerWidget onClick={() => { }} />);
        expect(screen.queryByTestId('timer-widget')).not.toBeInTheDocument();
    });

    it('renders when status is RUNNING', () => {
        mockState.status = 'RUNNING';
        mockState.endTime = Date.now() + 60000; // 1 minute from now

        render(<TimerWidget onClick={() => { }} />);
        expect(screen.getByTestId('timer-widget')).toBeInTheDocument();
    });

    it('expands on click', () => {
        mockState.status = 'RUNNING';
        render(<TimerWidget onClick={() => { }} />);

        const widget = screen.getByTestId('timer-widget');
        fireEvent.click(widget);

        expect(screen.getByText('Abrir Ferramentas')).toBeInTheDocument();
    });

    it('calls onClick when "Abrir Ferramentas" is clicked', () => {
        mockState.status = 'RUNNING';
        const handleClick = vi.fn();
        render(<TimerWidget onClick={handleClick} />);

        const widget = screen.getByTestId('timer-widget');
        fireEvent.click(widget);

        const button = screen.getByText('Abrir Ferramentas');
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalled();
    });
});
