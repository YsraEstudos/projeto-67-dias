import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainTracker } from '../../../../components/views/work/components/MainTracker';

const baseProps = {
    currentCount: 10,
    goal: 50,
    progressPercent: 20,
    onUpdate: vi.fn(),
    onGoalUpdate: vi.fn(),
    status: 'PRE_BREAK' as const,
    minutesRemaining: 120,
};

describe('MainTracker', () => {
    it('shows the "Auto" reset only when the daily goal is overridden', () => {
        const onGoalReset = vi.fn();
        const { rerender } = render(<MainTracker {...baseProps} onGoalReset={onGoalReset} />);
        expect(screen.queryByRole('button', { name: 'Auto' })).not.toBeInTheDocument();

        rerender(<MainTracker {...baseProps} onGoalReset={onGoalReset} isGoalOverridden />);
        fireEvent.click(screen.getByRole('button', { name: 'Auto' }));
        expect(onGoalReset).toHaveBeenCalledTimes(1);
    });

    it('renders the pace projection when available', () => {
        const { rerender } = render(<MainTracker {...baseProps} />);
        expect(screen.queryByTestId('work-projection')).not.toBeInTheDocument();

        rerender(<MainTracker {...baseProps} projectedCount={42} />);
        expect(screen.getByTestId('work-projection')).toHaveTextContent('No ritmo atual: ~42 / 50 ao fim do dia');
    });

    it('exposes accessible names for the quick-add controls', () => {
        const onUpdate = vi.fn();
        render(<MainTracker {...baseProps} onUpdate={onUpdate} />);
        fireEvent.click(screen.getByRole('button', { name: 'Aumentar 1' }));
        fireEvent.click(screen.getByRole('button', { name: 'Diminuir 1' }));
        expect(onUpdate).toHaveBeenNthCalledWith(1, 11);
        expect(onUpdate).toHaveBeenNthCalledWith(2, 9);
    });
});
