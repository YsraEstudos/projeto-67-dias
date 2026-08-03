import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type React from 'react';
import ShelfLevelRail from '../../../components/reading/shelf/ShelfLevelRail';

const levels = [
  { id: 'level-1', name: 'Livro X', position: 0 },
  { id: 'level-2', name: 'Livro Y', position: 1 },
];

function renderRail(overrides: Partial<React.ComponentProps<typeof ShelfLevelRail>> = {}) {
  return render(
    <ShelfLevelRail
      levels={levels}
      bookCounts={new Map([['level-1', 2], ['level-2', 1]])}
      activeLevelId="level-1"
      draggingBookId={null}
      dragTargetLevelId={null}
      onSelectLevel={vi.fn()}
      onRenameLevel={vi.fn()}
      onAddLevel={vi.fn()}
      onDeleteLevel={vi.fn()}
      {...overrides}
    />,
  );
}

describe('ShelfLevelRail', () => {
  it('edits a level name from its label box and creates a new level', () => {
    const onRenameLevel = vi.fn();
    const onAddLevel = vi.fn();

    render(
      <ShelfLevelRail
        levels={levels}
        bookCounts={new Map([['level-1', 2], ['level-2', 1]])}
        activeLevelId="level-1"
        draggingBookId={null}
        dragTargetLevelId={null}
        onSelectLevel={vi.fn()}
        onRenameLevel={onRenameLevel}
        onAddLevel={onAddLevel}
        onDeleteLevel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Livro X' }));
    const input = screen.getByRole('textbox', { name: 'Nome de Livro X' });
    fireEvent.change(input, { target: { value: 'Livro de TI' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Novo andar' }));

    expect(onRenameLevel).toHaveBeenCalledWith('level-1', 'Livro de TI');
    expect(onAddLevel).toHaveBeenCalledTimes(1);
  });

  it('collapses the desktop rail by default and expands on hover, focus or drag', () => {
    renderRail();

    // Collapsed by default: the peek tab announces it and the panel content
    // stays in the document (for a11y) without intercepting shelf clicks.
    const expandTab = screen.getByRole('button', { name: 'Expandir painel de andares' });
    expect(expandTab).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Livro X' })).toBeInTheDocument();

    // Hover over the rail (tab or panel) expands it…
    const rail = screen.getByTestId('shelf-level-rail-desktop');
    fireEvent.mouseEnter(rail);
    expect(screen.getByRole('button', { name: 'Recolher painel de andares' })).toHaveAttribute('aria-expanded', 'true');

    // …leaving collapses it again…
    fireEvent.mouseLeave(rail);
    expect(screen.getByRole('button', { name: 'Expandir painel de andares' })).toHaveAttribute('aria-expanded', 'false');

    // …keyboard focus expands it too (focus-within)…
    fireEvent.focus(screen.getByRole('button', { name: 'Expandir painel de andares' }));
    expect(screen.getByRole('button', { name: 'Recolher painel de andares' })).toHaveAttribute('aria-expanded', 'true');

    // …and clicking the tab toggles it back to collapsed.
    fireEvent.click(screen.getByRole('button', { name: 'Recolher painel de andares' }));
    expect(screen.getByRole('button', { name: 'Expandir painel de andares' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the desktop panel expanded while a book is being dragged', () => {
    renderRail({ draggingBookId: 'book-1', dragTargetLevelId: 'level-2' });

    expect(screen.getByRole('button', { name: 'Recolher painel de andares' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Solte sobre um andar/)).toBeInTheDocument();
  });
});
