import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardView from '../../../components/reading/DashboardView';
import type { Book } from '../../../types';

const makeBook = (id: string, status: Book['status']): Book => ({
  id,
  title: `Livro ${id}`,
  author: 'Autor',
  genre: 'Estudo',
  unit: 'PAGES',
  total: 100,
  current: 10,
  status,
  rating: 0,
  folderId: null,
  notes: '',
  addedAt: '2026-01-01',
});

const handlers = {
  viewMode: 'grid' as const,
  onUpdateProgress: vi.fn(),
  onUpdateStatus: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onMove: vi.fn(),
  onSelect: vi.fn(),
};

describe('DashboardView', () => {
  it('shows abandoned books in their own column instead of hiding them', () => {
    render(<DashboardView books={[makeBook('a', 'ABANDONED')]} {...handlers} />);
    expect(screen.getByRole('heading', { name: 'Abandonados' })).toBeInTheDocument();
  });

  it('omits the abandoned column when there are none', () => {
    render(<DashboardView books={[makeBook('a', 'READING')]} {...handlers} />);
    expect(screen.queryByRole('heading', { name: 'Abandonados' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lendo' })).toBeInTheDocument();
  });
});
