import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerWidget } from '../../components/TimerWidget';
import { useStorage } from '../../hooks/useStorage';
import { GlobalTimerState } from '../../types';

vi.mock('../../hooks/useStorage', () => ({
    useStorage: vi.fn(),
    readNamespacedStorage: vi.fn(),
    writeNamespacedStorage: vi.fn(),
    removeNamespacedStorage: vi.fn(),
}));

const mockedUseStorage = vi.mocked(useStorage);

const createTimerState = (): GlobalTimerState => ({
    mode: 'TIMER',
    status: 'IDLE',
    startTime: null,
    endTime: null,
    accumulated: 0,
    totalDuration: 0,
    label: undefined,
});

const mockSetState = vi.fn();
let mockState = createTimerState();

describe('TimerWidget Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockState = createTimerState();
        mockedUseStorage.mockReturnValue([mockState, mockSetState, false]);
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
