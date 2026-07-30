import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Grab, Book as BookIcon, Layers, Filter, X } from 'lucide-react';
import { Book } from '../../../types';
import type { ReadingCategoryFilter } from './EditorialHeader';

interface ShelfNavigationHUDProps {
  books: Book[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isInspecting: boolean;
  onToggleInspection: () => void;
  onPrevBook: () => void;
  onNextBook: () => void;
  activeCategory?: ReadingCategoryFilter;
  onSelectCategory?: (category: ReadingCategoryFilter) => void;
  onToggleShelfLevels?: () => void;
  onOpenShelfLevels?: () => void;
}

const CATEGORY_LABELS: Record<ReadingCategoryFilter, string> = {
  ALL: 'Todos',
  READING: 'Lendo',
  COMPLETED: 'Concluídos',
  TO_READ: 'Desejos',
};

export const ShelfNavigationHUD: React.FC<ShelfNavigationHUDProps> = ({
  books,
  selectedIndex,
  onSelectIndex,
  isInspecting,
  onToggleInspection,
  onPrevBook,
  onNextBook,
  activeCategory,
  onSelectCategory,
  onToggleShelfLevels,
  onOpenShelfLevels,
}) => {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [localCategory, setLocalCategory] = useState<ReadingCategoryFilter>(activeCategory || 'ALL');

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeCategory) {
      setLocalCategory(activeCategory);
    }
  }, [activeCategory]);

  const currentBook = books.length > 0 && selectedIndex >= 0 && selectedIndex < books.length
    ? books[selectedIndex]
    : null;

  const totalCount = books.length;
  const markerLimit = windowWidth < 360 ? 12 : windowWidth < 480 ? 20 : windowWidth < 768 ? 36 : 80;
  const markerStart = totalCount <= markerLimit
    ? 0
    : Math.min(Math.max(selectedIndex - Math.floor(markerLimit / 2), 0), totalCount - markerLimit);
  const markerBooks = books.slice(markerStart, markerStart + markerLimit);

  const handleToggleAndares = () => {
    if (onToggleShelfLevels) {
      onToggleShelfLevels();
    } else if (onOpenShelfLevels) {
      onOpenShelfLevels();
    } else {
      const drawerBtn = document.querySelector<HTMLButtonElement>('[aria-label="Abrir gaveta de andares"]');
      if (drawerBtn) drawerBtn.click();
    }
  };

  const handleCategorySelect = (catKey: ReadingCategoryFilter) => {
    if (onSelectCategory) {
      onSelectCategory(catKey);
    }
    setLocalCategory(catKey);
    setIsCategoryFilterOpen(false);
  };

  return (
    <>
      {/* Mobile Category Bottom Sheet (<768px) */}
      {isCategoryFilterOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCategoryFilterOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Filtros de Categoria"
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[2.25rem] border-t border-slate-700 bg-[#0D121A]/98 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-100 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-700" />

            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#F3D274]">
                <Filter className="h-4.5 w-4.5 text-[#D4AF37]" />
                Filtros de Categoria
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryFilterOpen(false)}
                aria-label="Fechar filtros de categoria"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(CATEGORY_LABELS) as ReadingCategoryFilter[]).map((catKey) => {
                const isSelected = (activeCategory || localCategory) === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => handleCategorySelect(catKey)}
                    aria-label={`Filtrar por ${CATEGORY_LABELS[catKey]}`}
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl px-4 py-3 text-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${
                      isSelected
                        ? 'border border-[#D4AF37] bg-[#D4AF37]/15 font-semibold text-[#F3D274] shadow-xs'
                        : 'border border-slate-700 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {CATEGORY_LABELS[catKey]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unified Mobile Control Hub (<768px) */}
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex w-[min(95%,520px)] -translate-x-1/2 items-center justify-between gap-1.5 rounded-2xl border border-slate-700/80 bg-[#0D121A]/95 p-2 text-slate-100 shadow-2xl backdrop-blur-md pointer-events-auto transition-all md:hidden">
        {/* a) Andares Button */}
        <button
          type="button"
          onClick={handleToggleAndares}
          aria-label="Abrir gaveta de andares"
          className="flex h-11 min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:border-[#D4AF37]/60 hover:bg-slate-800 hover:text-[#F3D274] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 shrink-0"
        >
          <Layers className="h-4 w-4 text-[#F3D274]" />
          <span>Andares</span>
        </button>

        {/* b) Active Book Pill with Prev/Next & Inspect */}
        <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
          <button
            type="button"
            onClick={onPrevBook}
            disabled={totalCount === 0 || selectedIndex <= 0}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Livro Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onToggleInspection}
            disabled={!currentBook}
            aria-label={currentBook ? `Inspecionar ${currentBook.title}` : 'Selecione um volume'}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-2 py-1.5 text-left transition hover:border-[#D4AF37]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[#D4AF37]/15 text-[#F3D274]">
              <BookIcon className="h-3 w-3" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-[11px] font-bold text-slate-100">
                {currentBook ? currentBook.title : 'Nenhum livro'}
              </h3>
              <p className="truncate text-[10px] text-slate-400">
                {currentBook ? currentBook.author : 'Selecione'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onNextBook}
            disabled={totalCount === 0 || selectedIndex >= totalCount - 1}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Próximo Livro"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onToggleInspection}
            disabled={!currentBook}
            aria-label={isInspecting ? 'Ver Estante 3D' : 'Inspecionar detalhes do livro'}
            className={`flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl transition shadow-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${
              isInspecting
                ? 'bg-[#D4AF37] text-[#080B10] ring-2 ring-[#D4AF37]/30'
                : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Eye className="h-4 w-4 text-[#F3D274]" />
          </button>
        </div>

        {/* c) Filtros Button */}
        <button
          type="button"
          onClick={() => setIsCategoryFilterOpen(true)}
          aria-label="Abrir filtros de categoria"
          className="flex h-11 min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:border-[#D4AF37]/60 hover:bg-slate-800 hover:text-[#F3D274] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 shrink-0"
        >
          <Filter className="h-4 w-4 text-[#F3D274]" />
          <span>Filtros</span>
        </button>
      </div>

      {/* Desktop / Tablet Navigation HUD (>=768px) */}
      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 hidden w-[min(94%,680px)] -translate-x-1/2 pointer-events-auto transition-all md:block">
        <div className="rounded-2xl border border-slate-700/80 bg-[#0D121A]/95 p-2.5 text-slate-100 shadow-2xl backdrop-blur-md sm:p-3 md:p-4">
          
          {/* Continuous Position Markers Track */}
          {totalCount > 0 && (
            <div className="mb-2.5 flex w-full items-center justify-between gap-1 px-1">
              <span className="font-mono text-[10px] font-semibold text-slate-400">01</span>
              <div className="mx-1.5 flex flex-1 items-center justify-center gap-0.5 overflow-x-auto scrollbar-none snap-x touch-pan-x py-1">
                {markerBooks.map((b, markerIndex) => {
                  const idx = markerStart + markerIndex;
                  const isActive = idx === selectedIndex;
                  return (
                    <button
                      key={b.id || idx}
                      type="button"
                      onClick={() => onSelectIndex(idx)}
                      title={`${b.title} (${idx + 1}/${totalCount})`}
                      aria-label={`${b.title} (${idx + 1}/${totalCount})`}
                      className="flex min-h-[44px] min-w-[20px] xs:min-w-[28px] snap-start shrink-0 items-center justify-center p-1 cursor-pointer focus:outline-none"
                    >
                      <span
                        className={`h-2 rounded-full transition-all ${
                          isActive
                            ? 'w-6 bg-[#D4AF37] ring-2 ring-[#D4AF37]/40 shadow-[0_0_8px_rgba(212,175,55,0.6)]'
                            : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="font-mono text-[10px] font-semibold text-slate-400">
                {String(totalCount).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* HUD Main Controls Bar */}
          <div className="flex items-center justify-between gap-2 xs:gap-3">
            
            {/* Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrevBook}
                disabled={totalCount === 0 || selectedIndex <= 0}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 transition-all hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Livro Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onNextBook}
                disabled={totalCount === 0 || selectedIndex >= totalCount - 1}
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-slate-200 transition-all hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Próximo Livro"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Active Book Title & Author Pill */}
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-[#0D121A]/90 px-3 py-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#F3D274]">
                <BookIcon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-serif text-xs font-bold text-slate-100">
                  {currentBook ? currentBook.title : 'Nenhum livro selecionado'}
                </h3>
                <p className="truncate text-[11px] text-slate-300">
                  {currentBook ? currentBook.author : 'Selecione um volume'}
                </p>
              </div>
            </div>

            {/* Drag Hint & Inspection Toggle Button */}
            <div className="flex items-center gap-2">
              <div 
                className="hidden items-center gap-1 rounded-xl bg-slate-900/70 px-2.5 py-2 text-[11px] text-slate-400 lg:flex"
                title="Arraste na cena 3D para rotacionar ou mudar vista"
              >
                <Grab className="h-3.5 w-3.5 text-slate-400" />
                <span>Arraste a estante</span>
              </div>

              <button
                type="button"
                onClick={onToggleInspection}
                disabled={!currentBook}
                aria-label={isInspecting ? 'Ver Estante 3D' : 'Inspecionar detalhes do livro'}
                className={`flex h-11 min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold tracking-wide transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${
                  isInspecting
                    ? 'bg-[#D4AF37] text-[#080B10] ring-2 ring-[#D4AF37]/30'
                    : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <Eye className="h-4 w-4 text-[#F3D274]" />
                <span className="hidden sm:inline">
                  {isInspecting ? 'Ver Estante' : 'Inspecionar'}
                </span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </>
  );
};

export default ShelfNavigationHUD;
