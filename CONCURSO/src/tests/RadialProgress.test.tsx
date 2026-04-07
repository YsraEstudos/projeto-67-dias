import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RadialProgress } from '../components/RadialProgress';

describe('RadialProgress', () => {
  it('renderiza com valor percentual arredondado', () => {
    render(<RadialProgress progress={42.4} />);

    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('limita o progresso no intervalo de 0 a 100 para evitar valores invalidos', () => {
    const { rerender } = render(<RadialProgress progress={130} />);

    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<RadialProgress progress={-20} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('expoe semantics de progressbar para acessibilidade', () => {
    render(<RadialProgress progress={65} />);

    const progressbar = screen.getByRole('progressbar', { name: /progresso/i });
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow', '65');
  });
});
