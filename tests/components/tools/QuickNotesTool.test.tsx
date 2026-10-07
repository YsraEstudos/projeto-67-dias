import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { QuickNotesTool } from '../../../components/tools/QuickNotesTool';

const seedNotes = (contents: string[]) => {
    localStorage.setItem('p67_quicknotes', JSON.stringify(
        contents.map((content, i) => ({ id: String(i), content, createdAt: i, updatedAt: i }))
    ));
};

describe('QuickNotesTool', () => {
    beforeEach(() => localStorage.clear());

    it('keeps the search box visible while a query is active even after notes drop below 3', () => {
        seedNotes(['alpha', 'beta', 'gamma']);
        render(<QuickNotesTool />);
        fireEvent.change(screen.getByLabelText('Buscar notas'), { target: { value: 'alpha' } });
        fireEvent.click(screen.getByLabelText('Excluir nota: alpha'));
        // Search must stay visible so the user can clear it
        expect(screen.getByLabelText('Buscar notas')).toHaveValue('alpha');
    });

    it('persists the unsaved draft and restores it on remount', () => {
        const { unmount } = render(<QuickNotesTool />);
        fireEvent.change(screen.getByLabelText('Nova nota'), { target: { value: 'rascunho' } });
        unmount();
        render(<QuickNotesTool />);
        expect(screen.getByLabelText('Nova nota')).toHaveValue('rascunho');
    });

    it('saves with Ctrl+Enter', () => {
        render(<QuickNotesTool />);
        const textarea = screen.getByLabelText('Nova nota');
        fireEvent.change(textarea, { target: { value: 'nota rápida' } });
        fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
        expect(screen.getByText('nota rápida')).toBeInTheDocument();
        expect(textarea).toHaveValue('');
    });
});
