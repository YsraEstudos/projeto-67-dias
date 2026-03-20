import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../app/seed';
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
    window.dispatchEvent(new CustomEvent('concurso-reader-mode', { detail: { active: true } }));

    await waitFor(() => {
      expect(shell).toHaveAttribute('data-shell-state', 'reader-collapsed');
    });
  });

  it('abre e fecha o menu mobile ao clicar repetidamente no hambúrguer', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    renderConcursoApp('/');

    const shell = screen.getByTestId('shell-chrome');
    const handle = screen.getByRole('button', { name: 'Abrir menu lateral' });
    const chrome = screen.getByTestId('mobile-nav-chrome');

    expect(shell).toHaveAttribute('data-shell-state', 'collapsed');
    expect(chrome).not.toHaveClass('mobile-nav-chrome-open');

    await user.click(handle);

    expect(shell).toHaveAttribute('data-shell-state', 'expanded');
    expect(chrome).toHaveClass('mobile-nav-chrome-open');
    expect(screen.getByTestId('mobile-sidebar-shell')).toHaveClass('mobile-sidebar-shell-open');
    expect(screen.getByText('Configurações')).toBeInTheDocument();

    await user.click(handle);

    await waitFor(() => {
      expect(shell).toHaveAttribute('data-shell-state', 'collapsed');
      expect(chrome).not.toHaveClass('mobile-nav-chrome-open');
    });
  });

  it('fecha a sidebar pelo backdrop no mobile', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu lateral' }));
    expect(screen.getByTestId('mobile-sidebar-shell')).toHaveClass('mobile-sidebar-shell-open');

    await user.click(screen.getByTestId('mobile-nav-overlay'));

    await waitFor(() => {
      expect(screen.getByTestId('shell-chrome')).toHaveAttribute('data-shell-state', 'collapsed');
      expect(screen.getByTestId('mobile-sidebar-shell')).not.toHaveClass('mobile-sidebar-shell-open');
    });
  });

  it('fecha o menu ao navegar pela sidebar no mobile', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu lateral' }));
    await user.click(screen.getByRole('button', { name: 'Abrir Configurações' }));

    await waitFor(() => {
      expect(screen.getByTestId('shell-chrome')).toHaveAttribute('data-shell-state', 'collapsed');
    });
  });

  it('fixa um item novo na ilha quando ha vaga', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    const state = createInitialState();
    state.shellUi.mobilePinnedNav = ['/', '/plano-diario', '/conteudo', '/anki', '/simulados-redacoes'];

    renderConcursoApp('/', state);

    await user.click(screen.getByRole('button', { name: 'Abrir menu lateral' }));
    await user.click(screen.getByRole('button', { name: 'Fixar Links de Correção na ilha' }));

    expect(screen.getByTestId('island-chip-/correcoes')).toBeInTheDocument();
  });

  it('remove um item da ilha pelo botao X', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    renderConcursoApp('/');

    expect(screen.getByTestId('island-chip-/')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remover Dashboard da ilha' }));

    expect(screen.queryByTestId('island-chip-/')).not.toBeInTheDocument();
  });

  it('reordena itens da ilha pelos controles de acessibilidade', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    const state = createInitialState();
    state.shellUi.mobilePinnedNav = ['/', '/plano-diario', '/conteudo'];

    renderConcursoApp('/', state);

    const before = screen.getAllByTestId(/^island-chip-/).map((element) => element.getAttribute('data-testid'));
    expect(before).toEqual(['island-chip-/', 'island-chip-/plano-diario', 'island-chip-/conteudo']);

    await user.click(screen.getByRole('button', { name: 'Mover Dashboard para direita' }));

    const after = screen.getAllByTestId(/^island-chip-/).map((element) => element.getAttribute('data-testid'));
    expect(after).toEqual(['island-chip-/plano-diario', 'island-chip-/', 'island-chip-/conteudo']);
  });

  it('rejeita o setimo atalho e mostra o alerta visual de overflow', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu lateral' }));
    await user.click(screen.getByRole('button', { name: 'Fixar Links de Correção na ilha' }));

    expect(screen.getByTestId('mobile-island-warning')).toBeInTheDocument();
    expect(screen.queryByTestId('island-chip-/correcoes')).not.toBeInTheDocument();
  });
});
