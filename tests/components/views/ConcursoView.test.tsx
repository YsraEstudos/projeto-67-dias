import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../components/concurso/CompetitionArena', () => ({
    CompetitionArena: () => <div data-testid="competition-arena">Competition Arena</div>,
}));

vi.mock('../../../components/concurso/ConcursoPlaceholderButton', () => ({
    ConcursoPlaceholderButton: () => <div data-testid="concurso-materials">Concurso Materials</div>,
}));

import ConcursoView from '../../../components/views/ConcursoView';

describe('ConcursoView', () => {
    it('starts on the competition tab and keeps materials available on the second tab', () => {
        render(<ConcursoView />);

        expect(screen.getByTestId('competition-arena')).toBeInTheDocument();
        expect(screen.queryByTestId('concurso-materials')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Materiais/i }));

        expect(screen.getByTestId('concurso-materials')).toBeInTheDocument();
        expect(screen.queryByTestId('competition-arena')).not.toBeInTheDocument();
    });
});
