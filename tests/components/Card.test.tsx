import { fireEvent, render, screen } from '@testing-library/react';
import { Trophy } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Card } from '../../components/Card';
import { ViewState } from '../../types';

describe('Card', () => {
  it('prefetches on hover without tying warm-up to pointerdown', () => {
    const onClick = vi.fn();
    const onWarm = vi.fn();

    render(
      <Card
        id={ViewState.CONCURSO}
        title="Concurso Público"
        subtitle="App dedicado"
        icon={Trophy}
        color="text-purple-400"
        onClick={onClick}
        onWarm={onWarm}
      />,
    );

    const card = screen.getByTestId('dashboard-card-CONCURSO');

    fireEvent.mouseEnter(card);
    expect(onWarm).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(card, { button: 0 });
    expect(onWarm).toHaveBeenCalledTimes(1);

    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledWith(ViewState.CONCURSO);
  });
});
