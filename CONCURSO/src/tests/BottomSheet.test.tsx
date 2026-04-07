import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from '../components/BottomSheet';

describe('BottomSheet', () => {
  it('nao renderiza quando fechado', () => {
    const onClose = vi.fn();

    render(
      <BottomSheet isOpen={false} onClose={onClose} title="Novo item">
        <div>Conteudo</div>
      </BottomSheet>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Conteudo')).not.toBeInTheDocument();
  });

  it('renderiza como dialog acessivel e bloqueia scroll do body quando aberto', () => {
    const onClose = vi.fn();

    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Novo item">
        <div>Conteudo</div>
      </BottomSheet>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Novo item' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body).toHaveClass('bottom-sheet-open');
  });

  it('fecha ao clicar no backdrop e no botao de fechar', () => {
    const onClose = vi.fn();

    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Novo item">
        <div>Conteudo</div>
      </BottomSheet>,
    );

    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'));
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('fecha ao arrastar para baixo acima do limiar', () => {
    const onClose = vi.fn();

    render(
      <BottomSheet isOpen={true} onClose={onClose} title="Novo item">
        <div>Conteudo</div>
      </BottomSheet>,
    );

    const container = screen.getByRole('dialog', { name: 'Novo item' });

    fireEvent.touchStart(container, {
      touches: [{ clientY: 100 }],
    });
    fireEvent.touchMove(container, {
      touches: [{ clientY: 260 }],
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
