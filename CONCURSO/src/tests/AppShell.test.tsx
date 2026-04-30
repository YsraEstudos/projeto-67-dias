import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStateWithTopics, renderConcursoApp } from './renderConcursoApp';
import { warmMainSiteEntryPoint } from '../../../utils/mainSitePrefetch';

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
  vi.restoreAllMocks();
  mockMatchMedia({ compact: false, coarse: false });
});

describe('AppShell', () => {
  it('abre o novo modulo na raiz do concurso', () => {
    mockMatchMedia({ compact: false, coarse: false });
    renderConcursoApp('/');

    expect(screen.getByTestId('clean-concurso-module')).toBeInTheDocument();
  });

  it('redireciona rotas antigas para o novo modulo', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    renderConcursoApp('/plano-diario');

    await waitFor(() => {
      expect(screen.getByTestId('clean-concurso-module')).toBeInTheDocument();
    });
  });

  it('inicia recolhida e nao deixa o tray contextual visivel por padrao', () => {
    mockMatchMedia({ compact: false, coarse: false });
    renderConcursoApp('/');

    const shell = screen.getByTestId('shell-chrome');
    expect(shell).toHaveAttribute('data-shell-state', 'collapsed');
    expect(screen.getByText('Dia selecionado').closest('.context-tray')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('desktop-shell-backdrop')).not.toBeInTheDocument();
  });

  it('abre o menu desktop com apenas a entrada do novo modulo', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu superior' }));

    const shell = screen.getByTestId('shell-chrome');
    expect(shell).toHaveAttribute('data-shell-state', 'expanded');
    expect(screen.getByRole('link', { name: 'Novo Concurso' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Plano Diário' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Conteúdo Pragmático' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Simulados e Redações' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Configurações' })).not.toBeInTheDocument();
    expect(screen.getByTestId('desktop-shell-backdrop')).toBeInTheDocument();
  });

  it('mantem o novo modulo ao clicar na unica entrada do menu desktop', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    const user = userEvent.setup();
    renderConcursoApp('/');

    await user.click(screen.getByRole('button', { name: 'Abrir menu superior' }));
    await user.click(screen.getByRole('link', { name: 'Novo Concurso' }));

    await waitFor(() => {
      expect(screen.getByTestId('clean-concurso-module')).toBeInTheDocument();
      expect(screen.getByTestId('shell-chrome')).toHaveAttribute('data-shell-state', 'collapsed');
    });
  });

  it('aquece o retorno ao site principal quando o botao de voltar recebe hover', async () => {
    mockMatchMedia({ compact: false, coarse: false });
    renderConcursoApp('/');

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Voltar ao Projeto 67 Dias' }));

    expect(warmMainSiteEntryPoint).toHaveBeenCalled();
  });

  it('mostra o dia selecionado no shell sem deslocamento de fuso', () => {
    mockMatchMedia({ compact: false, coarse: false });

    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    const toLocaleDateStringSpy = vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(
      function (
        this: Date,
        locale?: Intl.LocalesArgument,
        options?: Intl.DateTimeFormatOptions,
      ): string {
        if (locale === 'pt-BR' && options?.day === '2-digit' && options?.month === '2-digit') {
          const isoDate = this.toISOString().slice(0, 10);

          if (options.timeZone === 'UTC') {
            return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
          }

          const shifted = new Date(this.getTime() - 3 * 60 * 60 * 1000);
          const day = String(shifted.getUTCDate()).padStart(2, '0');
          const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
          return `${day}/${month}`;
        }

        return originalToLocaleDateString.call(this, locale as never, options as never);
      },
    );

    const { container } = renderConcursoApp(
      '/',
      createStateWithTopics((draft) => {
        draft.selectedDate = '2026-04-23';
      }),
    );

    expect(container.querySelector('.island-collapsed-date')).toHaveTextContent('23/04');
    expect(toLocaleDateStringSpy).toHaveBeenCalled();
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
    expect(screen.getByRole('button', { name: 'Novo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Plano' })).not.toBeInTheDocument();
  });

  it('mantem a rota unica ao clicar na barra inferior mobile', async () => {
    mockMatchMedia({ compact: true, coarse: true });
    const user = userEvent.setup();
    renderConcursoApp('/');

    const novoBtn = screen.getByRole('button', { name: 'Novo' });
    await user.click(novoBtn);

    await waitFor(() => {
      expect(novoBtn).toHaveClass('floating-bottom-nav-btn-active');
    });
  });
}, 15000);
