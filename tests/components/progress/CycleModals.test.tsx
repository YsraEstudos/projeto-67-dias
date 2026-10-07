import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CycleGoalModal } from '../../../components/progress/CycleGoalModal';
import { CompleteCycleModal } from '../../../components/progress/CompleteCycleModal';

const LONG_GOAL = 'Terminar o portfólio e ler três livros';

describe('CycleGoalModal', () => {
    it('resyncs the textarea with initialGoal each time it opens (discards stale drafts)', () => {
        const props = { onClose: vi.fn(), onSave: vi.fn(), cycleNumber: 1 };
        const { rerender } = render(<CycleGoalModal {...props} isOpen initialGoal={LONG_GOAL} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'rascunho descartado' } });

        rerender(<CycleGoalModal {...props} isOpen={false} initialGoal="" />);
        rerender(<CycleGoalModal {...props} isOpen initialGoal="" cycleNumber={2} />);

        expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('saves the trimmed goal with Ctrl+Enter and closes on Escape', () => {
        const onSave = vi.fn();
        const onClose = vi.fn();
        render(<CycleGoalModal isOpen onClose={onClose} onSave={onSave} initialGoal="" cycleNumber={1} />);
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: `  ${LONG_GOAL}  ` } });
        fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

        expect(onSave).toHaveBeenCalledWith(LONG_GOAL);
        expect(onClose).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('does not count surrounding whitespace toward the minimum length', () => {
        const onSave = vi.fn();
        render(<CycleGoalModal isOpen onClose={vi.fn()} onSave={onSave} initialGoal="" cycleNumber={1} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'curto' + ' '.repeat(30) } });
        expect(screen.getByRole('button', { name: /Salvar Objetivo/ })).toBeDisabled();
    });
});

describe('CompleteCycleModal', () => {
    it('clears the previous self-evaluation when reopened for the next cycle', () => {
        const props = { onClose: vi.fn(), onConfirm: vi.fn(), cycleGoal: LONG_GOAL };
        const { rerender } = render(<CompleteCycleModal {...props} isOpen cycleNumber={1} />);
        fireEvent.click(screen.getByRole('button', { name: /Sim, atingi/ }));
        expect(screen.getByRole('button', { name: /Sim, atingi/ })).toHaveAttribute('aria-pressed', 'true');

        rerender(<CompleteCycleModal {...props} isOpen={false} cycleNumber={2} />);
        rerender(<CompleteCycleModal {...props} isOpen cycleNumber={2} />);

        expect(screen.getByRole('button', { name: /Sim, atingi/ })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: /Finalizar Ciclo e Continuar/ })).toBeDisabled();
    });
});
