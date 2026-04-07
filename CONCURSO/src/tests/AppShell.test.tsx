import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderConcursoApp } from './renderConcursoApp';

const mockMatchMedia = ({ compact, coarse }: { compact: boolean; coarse: boolean }) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches:
      query.includes('(max-width: 920px)')
        ? compact
        : query.includes('hover: none') || query.includes('pointer: coarse')
          ? coarse
          : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
};

afterEach(() => {
  mockMatchMedia({ compact: false, coarse: false });
});

describe('AppShell', () => {
  it('inicia recolhida e nao deixa o tray contextual visivel por padrao', () => {
    mockMatchMedia({ compact: false, coarse: false });
    renderConcursoApp('/');

    const shell = screen.getByTestId('shell-chrome');
    expect(shell).toHaveAttribute('data-shell-state', 'collapsed');
    expect(screen.getByText('Dia selecionado').closest('.context-tray')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('desktop-shell-backdrop')).not.toBeInTheDocument();
  });

  it('abre o menu desktop por clique e mostra as entradas principais mais configuracoes', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu superior' }));

    const shell = screen.getByTestId('shell-chrome');
    expect(shell).toHaveAttribute('data-shell-state', 'expanded');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plano Diário' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Conteúdo Pragmático' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anki & FSRS' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Simulados e Redações' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configurações' })).toBeInTheDocument();
    expect(screen.getByTestId('desktop-shell-backdrop')).toBeInTheDocument();
  });

  it('navega para configuracoes pelo menu desktop e fecha o shell ao concluir', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu superior' }));
    await user.click(screen.getByRole('link', { name: 'Configurações' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Configurações e Backup' })).toBeInTheDocument();
      expect(screen.getByTestId('shell-chrome')).toHaveAttribute('data-shell-state', 'collapsed');
    });
  });

  it('fecha o menu desktop com escape', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu superior' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.getByTestId('shell-chrome')).toHaveAttribute('data-shell-state', 'collapsed');
    });
  });

  it('fecha o menu desktop ao clicar no backdrop', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu superior' }));
    await user.click(screen.getByTestId('desktop-shell-backdrop'));

    await waitFor(() => {
      expect(screen.getByTestId('shell-chrome')).toHaveAttribute('data-shell-state', 'collapsed');
    });
  });

  it('entra em modo reader quando recebe o sinal da tela de aula', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    renderConcursoApp('/conteudo');

    const shell = screen.getByTestId('shell-chrome');
    act(() => {
      window.dispatchEvent(new CustomEvent('concurso-reader-mode', { detail: { active: true } }));
    });

    await waitFor(() => {
      expect(shell).toHaveAttribute('data-shell-state', 'reader-collapsed');
    });
  });

it('exibe a barra inferior de navegacao no mobile e oculta o menu superior/hamburguer', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    renderConcursoApp('/');

    // A ilha e o hamburguer antigo não devem mais existir no mobile
    expect(screen.queryByRole('button', { name: 'Abrir menu lateral' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-nav-chrome')).not.toBeInTheDocument();

    // A barra inferior deve estar visível
    const nav = screen.getByRole('navigation', { name: 'Navegação Principal Mobile' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Plano' })).toBeInTheDocument();
  });

  it('navega pelas rotas corretas ao clicar nos botoes da barra inferior mobile', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    renderConcursoApp('/');

    const planoBtn = screen.getByRole('button', { name: 'Plano' });
    await user.click(planoBtn);

    await waitFor(() => {
      expect(planoBtn).toHaveClass('floating-bottom-nav-btn-active');
    });
  });
}, 15000);
