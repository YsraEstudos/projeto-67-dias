import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BookInspectionOverlay from '../../../components/reading/shelf/BookInspectionOverlay';
import type { Book } from '../../../types';

const book: Book = {
  id: 'book-1',
  title: 'Livro teste',
  author: 'Autor teste',
  genre: 'Estudo',
  unit: 'PAGES',
  total: 144,
  current: 20,
  status: 'READING',
  rating: 3,
  folderId: null,
  notes: '',
  addedAt: '2026-07-29',
};

describe('BookInspectionOverlay', () => {
  it('shows the cover and saves editable reading details from the focused view', () => {
    const onSaveBook = vi.fn();

    render(
      <BookInspectionOverlay
        book={book}
        isOpen
        onClose={vi.fn()}
        onSaveBook={onSaveBook}
        onUpdateProgress={vi.fn()}
      />,
    );

    expect(screen.getByTestId('book-inspection-panel')).toHaveClass('absolute');
    expect(screen.getByRole('heading', { name: 'Preencha os detalhes do livro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Livro teste' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Livro atualizado' } });
    fireEvent.change(screen.getByLabelText('Notas e reflexões'), { target: { value: 'Ideia principal' } });
    fireEvent.change(screen.getByLabelText('Total'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar detalhes' }));

    expect(onSaveBook).toHaveBeenCalledWith('book-1', expect.objectContaining({
      title: 'Livro atualizado',
      notes: 'Ideia principal',
      total: 200,
      current: 20,
    }));
  });
});
