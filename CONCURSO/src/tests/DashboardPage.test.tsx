import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createStateWithTopics, renderConcursoApp } from './renderConcursoApp';

describe('DashboardPage', () => {
  it('renderiza sem crash e mostra os blocos principais', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/', state);

    expect(screen.getByRole('heading', { name: /Dashboard de Execução/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Progresso do dia/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Mapa rápido de revisão do edital/i)).toBeInTheDocument();
  });

  it('expõe atalhos de interação com rotas prontas para toque no dashboard', () => {
    const state = createStateWithTopics((draft) => {
      draft.selectedDate = '2026-03-14';
    });

    renderConcursoApp('/', state);

    const ctaLink = screen.getByRole('link', { name: /abrir revisão crítica/i });
    expect(ctaLink).toHaveAttribute('href', '/conteudo?focus=review-now');

    const mapLink = screen.getByRole('link', { name: /ver mapa completo/i });
    expect(mapLink).toHaveAttribute('href', '/conteudo');
  });
}, 10000);
