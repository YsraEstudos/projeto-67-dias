import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ShelfLevelRail from '../../../components/reading/shelf/ShelfLevelRail';

const levels = [
  { id: 'level-1', name: 'Livro X', position: 0 },
  { id: 'level-2', name: 'Livro Y', position: 1 },
];

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
});
