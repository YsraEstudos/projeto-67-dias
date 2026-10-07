import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({ writeToFirestore: vi.fn() }));
vi.mock('../../../components/reading/shelf/CompleteShelfScene', () => ({
  default: () => <div data-testid="shelf-scene" />,
}));

import { ReadingView } from '../../../components/views/ReadingView';
import { useReadingStore } from '../../../stores/readingStore';
import type { Book } from '../../../types';

const book: Book = {
  id: 'book-1',
  title: 'Livro sem total',
  author: 'Autor',
  genre: 'Estudo',
  unit: 'PAGES',
  total: 0,
  current: 0,
  status: 'READING',
  rating: 0,
  folderId: null,
  notes: '',
  addedAt: '2026-01-01',
  logs: [],
};

describe('ReadingView', () => {
  beforeEach(() => {
    useReadingStore.getState()._reset();
    useReadingStore.getState()._hydrateFromFirestore({ books: [book], folders: [] });
  });

  it('opens the quick log sheet and logs progress for books without a total', async () => {
    render(<ReadingView />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir registro rápido de leitura' }));
    expect(await screen.findByRole('dialog', { name: 'Registro rápido de leitura' }, { timeout: 10000 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar progresso de Livro sem total' }));

    const updated = useReadingStore.getState().books[0];
    expect(updated.current).toBe(1);
    expect(updated.logs?.[0]?.pagesRead).toBe(1);
  }, 30000);
});
