import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

import {
  calculateShelfCameraDistance,
  getShelfCameraVerticalTarget,
  getShelfLevelFromPointer,
  calculateTouchDistance,
  calculateTouchCenter,
  clampZoomScale,
  CompleteShelfScene,
} from '../../../components/reading/shelf/CompleteShelfScene';
import EditorialHeader from '../../../components/reading/shelf/EditorialHeader';
import ShelfLevelRail from '../../../components/reading/shelf/ShelfLevelRail';
import ShelfNavigationHUD from '../../../components/reading/shelf/ShelfNavigationHUD';
import BookInspectionOverlay from '../../../components/reading/shelf/BookInspectionOverlay';
import { calculateBookDimensions } from '../../../components/views/ReadingView';
import type { Book, ReadingShelfLevel } from '../../../types';

const sampleBooks: Book[] = [
  {
    id: 'book-1',
    title: 'O Iluminado',
    author: 'Stephen King',
    genre: 'Terror',
    unit: 'PAGES',
    total: 400,
    current: 150,
    status: 'READING',
    rating: 5,
    folderId: null,
    notes: 'Excelente suspense',
    addedAt: '2026-01-01',
  },
  {
    id: 'book-[#2]',
    title: 'Duna',
    author: 'Frank Herbert',
    genre: 'Ficção Científica',
    unit: 'PAGES',
    total: 680,
    current: 680,
    status: 'COMPLETED',
    rating: 5,
    folderId: null,
    notes: 'Obra-prima',
    addedAt: '2026-02-01',
  },
];

const sampleLevels: ReadingShelfLevel[] = [
  { id: 'level-1', name: 'Andar Térreo', position: 0 },
  { id: 'level-2', name: 'Primeiro Andar', position: 1 },
];

describe('Property-Based & Pure Function Tests for Mobile 3D Shelf', () => {
  it('property-based: calculateShelfCameraDistance returns valid finite distance >= MIN_DISTANCE for random viewports', () => {
    // Generate 100 random viewport and shelf dimensions
    for (let i = 0; i < 100; i++) {
      const width = Math.floor(Math.random() * 3500) + 300; // 300px to 3800px
      const height = Math.floor(Math.random() * 2000) + 200; // 200px to 2200px
      const shelfWidth = Math.random() * 40 + 5; // 5 to 45 units

      const distance = calculateShelfCameraDistance(width, height, shelfWidth);

      expect(Number.isNaN(distance)).toBe(false);
      expect(Number.isFinite(distance)).toBe(true);
      expect(distance).toBeGreaterThanOrEqual(8.5);
    }
  });

  it('property-based: calculateShelfCameraDistance yields larger or equal distance for portrait vs landscape viewports', () => {
    for (let i = 0; i < 50; i++) {
      const a = Math.floor(Math.random() * 1000) + 400;
      const b = Math.floor(Math.random() * 1000) + 1200;
      const small = Math.min(a, b);
      const large = Math.max(a, b);
      const shelfWidth = 14;

      const landscapeDist = calculateShelfCameraDistance(large, small, shelfWidth);
      const portraitDist = calculateShelfCameraDistance(small, large, shelfWidth);

      expect(portraitDist).toBeGreaterThanOrEqual(landscapeDist);
    }
  });

  it('property-based: calculateTouchDistance and calculateTouchCenter behave correctly for random multi-touch inputs', () => {
    for (let i = 0; i < 100; i++) {
      const t1 = { clientX: Math.random() * 1000 - 500, clientY: Math.random() * 1000 - 500 };
      const t2 = { clientX: Math.random() * 1000 - 500, clientY: Math.random() * 1000 - 500 };

      const dist = calculateTouchDistance(t1, t2);
      const center = calculateTouchCenter(t1, t2);

      expect(dist).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(dist)).toBe(true);
      expect(center.x).toBeCloseTo((t1.clientX + t2.clientX) / 2);
      expect(center.y).toBeCloseTo((t1.clientY + t2.clientY) / 2);
    }
  });

  it('property-based: clampZoomScale strictly bounds zoom between min and max limits for any distance ratio', () => {
    for (let i = 0; i < 100; i++) {
      const currentZoom = Math.random() * 4;
      const ratio = Math.random() * 5 - 1; // can be negative, 0, NaN, or positive

      const clamped = clampZoomScale(currentZoom, ratio, 0.4, 3.0);

      expect(clamped).toBeGreaterThanOrEqual(0.4);
      expect(clamped).toBeLessThanOrEqual(3.0);
    }
  });
});

describe('Mobile UI Responsiveness & Accessibility (a11y) Tests', () => {
  it('EditorialHeader renders safe area top padding, compact titles, and accessible filter buttons', () => {
    render(
      <EditorialHeader
        activeCategory="ALL"
        onSelectCategory={vi.fn()}
        totalBooksCount={12}
        readingStreakDays={5}
        onOpenAddBook={vi.fn()}
        is3DMode
        onToggleViewMode={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    const navBackButton = screen.getAllByRole('button', { name: 'Voltar ao painel principal' })[0];
    expect(navBackButton).toBeInTheDocument();
    expect(navBackButton.className).toContain('min-h-[44px]');

    const addBookBtn = screen.getByRole('button', { name: 'Adicionar novo livro' });
    expect(addBookBtn).toBeInTheDocument();
    expect(addBookBtn.className).toContain('min-h-[44px]');

    const filterAllBtn = screen.getByRole('button', { name: 'Filtrar por Todos' });
    expect(filterAllBtn).toBeInTheDocument();
    expect(filterAllBtn.className).toContain('min-h-[44px]');
  });

  it('ShelfLevelRail renders floating drawer button for mobile viewports', () => {
    render(
      <ShelfLevelRail
        levels={sampleLevels}
        bookCounts={new Map([['level-1', 1], ['level-2', 1]])}
        activeLevelId="level-1"
        draggingBookId={null}
        dragTargetLevelId={null}
        onSelectLevel={vi.fn()}
        onRenameLevel={vi.fn()}
        onAddLevel={vi.fn()}
        onDeleteLevel={vi.fn()}
      />,
    );

    const mobileBtn = screen.getByRole('button', { name: 'Abrir gaveta de andares' });
    expect(mobileBtn).toBeInTheDocument();
    expect(mobileBtn.className).toContain('min-h-[44px]');

    // Click mobile button to open drawer
    fireEvent.click(mobileBtn);
    expect(screen.getByRole('dialog', { name: 'Andares da Estante' })).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: 'Fechar gaveta de andares' });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: 'Andares da Estante' })).not.toBeInTheDocument();
  });

  it('ShelfLevelRail renders Quick Floor Assignment Bar on mobile when dragging a book and moves on 1-tap', () => {
    const onMove = vi.fn();
    render(
      <ShelfLevelRail
        levels={sampleLevels}
        bookCounts={new Map([['level-1', 1], ['level-2', 1]])}
        activeLevelId="level-1"
        draggingBookId="book-1"
        dragTargetLevelId="level-2"
        onSelectLevel={vi.fn()}
        onRenameLevel={vi.fn()}
        onAddLevel={vi.fn()}
        onDeleteLevel={vi.fn()}
        onMoveBookToShelfLevel={onMove}
      />,
    );

    const moveLevel2Btn = screen.getByRole('button', { name: 'Mover para Primeiro Andar' });
    expect(moveLevel2Btn).toBeInTheDocument();
    expect(moveLevel2Btn.className).toContain('min-h-[44px]');

    fireEvent.click(moveLevel2Btn);
    expect(onMove).toHaveBeenCalledWith('book-1', 'level-2');
  });

  it('ShelfNavigationHUD provides accessible 44x44px touch targets for navigation and inspection', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToggle = vi.fn();

    render(
      <ShelfNavigationHUD
        books={sampleBooks}
        selectedIndex={0}
        onSelectIndex={vi.fn()}
        isInspecting={false}
        onToggleInspection={onToggle}
        onPrevBook={onPrev}
        onNextBook={onNext}
      />,
    );

    const prevBtns = screen.getAllByRole('button', { name: 'Livro Anterior' });
    const nextBtns = screen.getAllByRole('button', { name: 'Próximo Livro' });
    const inspectBtns = screen.getAllByRole('button', { name: 'Inspecionar detalhes do livro' });

    expect(prevBtns).toHaveLength(1);
    expect(nextBtns).toHaveLength(1);
    expect(prevBtns[0].className).toContain('min-h-[44px]');
    expect(nextBtns[0].className).toContain('min-h-[44px]');
    expect(inspectBtns[0].className).toContain('min-h-[44px]');

    fireEvent.click(inspectBtns[0]);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('EditorialHeader opens MobileOptionsSheet with accessible 44x44px controls', () => {
    const onAdd = vi.fn();
    const onToggleMode = vi.fn();

    render(
      <EditorialHeader
        activeCategory="ALL"
        onSelectCategory={vi.fn()}
        totalBooksCount={12}
        readingStreakDays={5}
        onOpenAddBook={onAdd}
        is3DMode
        onToggleViewMode={onToggleMode}
      />,
    );

    const optionsBtn = screen.getByRole('button', { name: 'Abrir menu de opções' });
    expect(optionsBtn).toBeInTheDocument();
    expect(optionsBtn.className).toContain('min-h-[44px]');

    fireEvent.click(optionsBtn);

    const sheetDialog = screen.getByRole('dialog', { name: 'Menu de opções da estante' });
    expect(sheetDialog).toBeInTheDocument();

    expect(screen.getByText('Ofensiva de Leitura')).toBeInTheDocument();
    expect(screen.getByText('Total de Livros')).toBeInTheDocument();

    const toggleBtn = screen.getAllByRole('button', { name: 'Alternar para Modo 2D' });
    fireEvent.click(toggleBtn[0]);
    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });

  it('ShelfNavigationHUD renders Unified Mobile Control Hub and opens CategoryBottomSheet with exact chip styling', () => {
    const onSelectCat = vi.fn();

    render(
      <ShelfNavigationHUD
        books={sampleBooks}
        selectedIndex={0}
        onSelectIndex={vi.fn()}
        isInspecting={false}
        onToggleInspection={vi.fn()}
        onPrevBook={vi.fn()}
        onNextBook={vi.fn()}
        activeCategory="ALL"
        onSelectCategory={onSelectCat}
      />,
    );

    const andaresBtn = screen.getByRole('button', { name: 'Abrir gaveta de andares' });
    expect(andaresBtn).toBeInTheDocument();
    expect(andaresBtn.className).toContain('min-h-[44px]');

    const filtrosBtn = screen.getByRole('button', { name: 'Abrir filtros de categoria' });
    expect(filtrosBtn).toBeInTheDocument();
    expect(filtrosBtn.className).toContain('min-h-[44px]');

    fireEvent.click(filtrosBtn);

    const sheetDialog = screen.getByRole('dialog', { name: 'Filtros de Categoria' });
    expect(sheetDialog).toBeInTheDocument();

    const selectedChip = screen.getByRole('button', { name: 'Filtrar por Todos' });
    expect(selectedChip.className).toContain('border border-[#D4AF37] bg-[#D4AF37]/15 font-semibold text-[#F3D274] shadow-xs');

    const readingChip = screen.getByRole('button', { name: 'Filtrar por Lendo' });
    fireEvent.click(readingChip);
    expect(onSelectCat).toHaveBeenCalledWith('READING');
  });

  it('BookInspectionOverlay renders drag handle and touch-friendly progress buttons on mobile overlay', () => {
    const onSave = vi.fn();
    const onProgress = vi.fn();

    render(
      <BookInspectionOverlay
        book={sampleBooks[0]}
        isOpen
        onClose={vi.fn()}
        onSaveBook={onSave}
        onUpdateProgress={onProgress}
      />,
    );

    const panel = screen.getByTestId('book-inspection-panel');
    expect(panel).toBeInTheDocument();

    const add5Btn = screen.getByRole('button', { name: 'Adicionar 5 páginas' });
    expect(add5Btn).toBeInTheDocument();
    expect(add5Btn.className).toContain('min-h-[44px]');

    fireEvent.click(add5Btn);
    expect(onProgress).toHaveBeenCalledWith('book-1', 155);
  });

  it('extractDominantColor returns no color when canvas pixels are unavailable', async () => {
    const { extractDominantColor } = await import('../../../components/reading/shelf/BookMesh');
    const mockImg = document.createElement('img');
    const hex = extractDominantColor(mockImg);
    expect(hex).toBeNull();
  });

  it('calculates page-count based book dimensions correctly across all tiers', () => {
    // <= 150 pages tier
    expect(calculateBookDimensions(100)).toEqual({ pages: 100, thickness: 0.30, height: 2.1, width: 1.4 });
    expect(calculateBookDimensions(150)).toEqual({ pages: 150, thickness: 0.30, height: 2.1, width: 1.4 });

    // 151 - 500 pages tier
    expect(calculateBookDimensions(151)).toEqual({ pages: 151, thickness: 0.50, height: 2.6, width: 1.7 });
    expect(calculateBookDimensions(500)).toEqual({ pages: 500, thickness: 0.50, height: 2.6, width: 1.7 });

    // > 500 pages tier
    expect(calculateBookDimensions(501)).toEqual({ pages: 501, thickness: 0.85, height: 3.1, width: 2.0 });
    expect(calculateBookDimensions(1000)).toEqual({ pages: 1000, thickness: 0.85, height: 3.1, width: 2.0 });
  });

  it('ShelfNavigationHUD removes desktop navigation arrows and the drag hint', () => {
    render(
      <ShelfNavigationHUD
        books={sampleBooks}
        selectedIndex={0}
        onSelectIndex={vi.fn()}
        isInspecting={false}
        onToggleInspection={vi.fn()}
        onPrevBook={vi.fn()}
        onNextBook={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Andar Anterior (▲)' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Próximo Andar (▼)' })).not.toBeInTheDocument();
    expect(screen.queryByText('Arraste a estante')).not.toBeInTheDocument();
  });
});
