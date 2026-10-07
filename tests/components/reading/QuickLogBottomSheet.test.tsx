import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import QuickLogBottomSheet from '../../../components/reading/modals/QuickLogBottomSheet';
import { getTodayISO } from '../../../utils/dateUtils';
import type { Book } from '../../../types';

const baseBook: Book = {
  id: 'book-1',
  title: 'Livro teste',
  author: 'Autor',
  genre: 'Estudo',
  unit: 'PAGES',
  total: 0,
  current: 3,
  status: 'READING',
  rating: 0,
  folderId: null,
  notes: '',
  addedAt: '2026-01-01',
  dailyGoal: 15,
  logs: [{ id: 'l1', date: getTodayISO(), pagesRead: 3, bookId: 'book-1' }],
};

describe('QuickLogBottomSheet', () => {
  it('allows progress on books without a configured total and shows today summary + daily goal', () => {
    const onUpdateProgress = vi.fn();
    render(
      <QuickLogBottomSheet
        isOpen
        onClose={vi.fn()}
        books={[baseBook]}
        onUpdateProgress={onUpdateProgress}
        onSetProgress={vi.fn()}
      />,
    );

    const plus = screen.getByRole('button', { name: 'Aumentar progresso de Livro teste' });
    expect(plus).not.toBeDisabled();
    fireEvent.click(plus);
    expect(onUpdateProgress).toHaveBeenCalledWith('book-1', 1);

    expect(screen.getByTestId('quick-log-today')).toHaveTextContent('Hoje: 3');
    expect(screen.getByText('Meta: 15 / dia')).toBeInTheDocument();
  });

  it('does not clamp typed values to zero when total is 0', () => {
    const onSetProgress = vi.fn();
    render(
      <QuickLogBottomSheet
        isOpen
        onClose={vi.fn()}
        books={[baseBook]}
        onUpdateProgress={vi.fn()}
        onSetProgress={onSetProgress}
      />,
    );
    const input = screen.getByLabelText('Progresso atual de Livro teste');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.blur(input);
    expect(onSetProgress).toHaveBeenCalledWith('book-1', 42);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <QuickLogBottomSheet isOpen onClose={onClose} books={[]} onUpdateProgress={vi.fn()} onSetProgress={vi.fn()} />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
