import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createStateWithTopics, renderConcursoApp } from './renderConcursoApp';

describe('DailyPlanPage', () => {
  it('mostra o conteudo programatico oficial nos blocos do plano manual', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/plano-diario', state);

    expect(screen.getByText('Web: HTML semântico + forms')).toBeInTheDocument();
    expect(screen.getAllByText(/Conteúdo programático:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/HTML/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: /HTML/i }),
    ).toHaveAttribute('href', expect.stringMatching(/^\/conteudo\/topico\/item-/));
  });
});
