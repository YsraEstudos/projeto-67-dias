import React, { useState } from 'react';
import { Plus, Flame, BookOpen, Layers, Sparkles, ArrowLeft, MoreVertical, X } from 'lucide-react';
import { Book } from '../../../types';

export type ReadingCategoryFilter = 'ALL' | 'READING' | 'COMPLETED' | 'TO_READ';

interface EditorialHeaderProps {
  activeCategory: ReadingCategoryFilter;
  onSelectCategory: (category: ReadingCategoryFilter) => void;
  totalBooksCount: number;
  readingStreakDays: number;
  onOpenAddBook: () => void;
  is3DMode?: boolean;
  onToggleViewMode?: () => void;
  onExit?: () => void;
}

const CATEGORY_LABELS: Record<ReadingCategoryFilter, { label: string; countKey?: Book['status'] }> = {
  ALL: { label: 'Todos' },
  READING: { label: 'Lendo', countKey: 'READING' },
  COMPLETED: { label: 'Concluídos', countKey: 'COMPLETED' },
  TO_READ: { label: 'Desejos', countKey: 'TO_READ' },
};

export const EditorialHeader: React.FC<EditorialHeaderProps> = ({
  activeCategory,
  onSelectCategory,
  totalBooksCount,
  readingStreakDays,
  onOpenAddBook,
  is3DMode = true,
  onToggleViewMode,
  onExit,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  return (
    <header className="w-full border-b border-slate-800 bg-[#0B0F16] text-slate-100 shadow-lg transition-all">
      {/* Mobile Top Bar (<768px) */}
      <div className="flex items-center justify-between px-3 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        <div className="flex items-center gap-2 min-w-0">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              aria-label="Voltar ao painel principal"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-[#D4AF37]/60 hover:bg-slate-800 hover:text-[#F3D274] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-10 w-10 min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F3D274] shadow-md">
            <BookOpen className="h-5 w-5" />
          </div>
          <h1 className="truncate font-serif text-base min-[360px]:text-lg font-bold tracking-tight text-slate-100">
            The Complete Shelf
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              aria-label={is3DMode ? 'Alternar para Modo 2D' : 'Alternar para Modo 3D Shelf'}
              className="flex h-11 min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3.5 py-2 text-xs font-bold text-[#F3D274] transition-all hover:bg-[#D4AF37]/25 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 active:scale-95 shadow-sm"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-[#F3D274]" />
              <span>{is3DMode ? 'Modo 2D' : 'Modo 3D'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOptionsOpen(true)}
            aria-label="Abrir menu de opções"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-[#D4AF37]/60 hover:bg-slate-800 hover:text-[#F3D274] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Options Bottom Sheet */}
      {isOptionsOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOptionsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Menu de opções da estante"
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[2.25rem] border-t border-slate-700 bg-[#0D121A]/98 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-100 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-700" />

            <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#F3D274]">
                <BookOpen className="h-4.5 w-4.5 text-[#D4AF37]" />
                Opções da Estante
              </div>
              <button
                type="button"
                onClick={() => setIsOptionsOpen(false)}
                aria-label="Fechar menu de opções"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Reading Streak Badge */}
              <div className="flex min-h-[44px] items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-200">
                <div className="flex items-center gap-3">
                  <Flame className="h-5 w-5 text-[#D96B27] fill-[#D96B27]/20 animate-pulse shrink-0" />
                  <span className="text-xs font-semibold tracking-wide">Ofensiva de Leitura</span>
                </div>
                <span className="rounded-full bg-[#D96B27]/20 px-3 py-1 text-xs font-bold text-[#D96B27]">
                  {readingStreakDays} {readingStreakDays === 1 ? 'dia' : 'dias'}
                </span>
              </div>

              {/* Total Books Badge */}
              <div className="flex min-h-[44px] items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-200">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold tracking-wide">Total de Livros</span>
                </div>
                <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-xs font-bold text-[#F3D274]">
                  {totalBooksCount} {totalBooksCount === 1 ? 'volume' : 'volumes'}
                </span>
              </div>

              {/* View Toggle Mode */}
              {onToggleViewMode && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleViewMode();
                    setIsOptionsOpen(false);
                  }}
                  aria-label={is3DMode ? 'Alternar para Modo 2D' : 'Alternar para Modo 3D Shelf'}
                  className="flex min-h-[44px] min-w-[44px] w-full items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[#C5A059] shrink-0" />
                    <span>Alternar Visualização</span>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                    {is3DMode ? 'Modo 2D' : 'Modo 3D Shelf'}
                  </span>
                </button>
              )}

              {/* Add Book Action Button */}
              <button
                type="button"
                onClick={() => {
                  onOpenAddBook();
                  setIsOptionsOpen(false);
                }}
                aria-label="Adicionar novo livro"
                className="flex min-h-[44px] min-w-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] px-4 py-3.5 text-xs font-bold tracking-wide text-[#080B10] shadow-md transition-all hover:bg-[#E1BE4A] active:scale-98 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/80"
              >
                <Plus className="h-5 w-5 text-[#080B10]" />
                <span>+ Novo Livro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Tablet Header Layout (>=768px) */}
      <div className="hidden px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:block sm:px-4 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 md:flex-row md:items-center md:gap-5">
          {/* Title & Brand Section */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                aria-label="Voltar ao painel principal"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-[#D4AF37]/60 hover:bg-slate-800 hover:text-[#F3D274] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F3D274] shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 xs:gap-2">
                <span className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400 xs:text-[10px] xs:tracking-[0.2em]">
                  Biblioteca Editorial
                </span>
                <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-[#C5A059]" />
                <span className="hidden truncate text-[9px] font-medium uppercase tracking-wider text-slate-500 min-[360px]:inline xs:text-[10px]">
                  Coleção Privada
                </span>
              </div>
              <h1 className="truncate font-serif text-xl font-bold tracking-tight text-slate-100 min-[360px]:text-2xl md:text-3xl">
                The Complete Shelf
              </h1>
            </div>
          </div>

          {/* Stats & Controls Center */}
          <div className="flex flex-wrap items-center gap-2 min-[360px]:gap-2.5 md:gap-4">
            {/* Reading Streak Counter */}
            <div 
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-slate-200"
              title={`${readingStreakDays} dias seguidos de leitura`}
              aria-label={`${readingStreakDays} dias seguidos de leitura`}
            >
              <Flame className="h-4 w-4 shrink-0 text-[#D96B27] fill-[#D96B27]/20 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide">
                {readingStreakDays} {readingStreakDays === 1 ? 'dia' : 'dias'} <span className="hidden min-[360px]:inline">de ofensiva</span>
              </span>
            </div>

            {/* Total Books Badge */}
            <div 
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-slate-200"
              aria-label={`Total de ${totalBooksCount} ${totalBooksCount === 1 ? 'volume' : 'volumes'}`}
            >
              <Layers className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-xs font-medium">
                <strong className="font-bold text-[#F3D274]">{totalBooksCount}</strong> {totalBooksCount === 1 ? 'volume' : 'volumes'}
              </span>
            </div>

            {/* View Toggle Mode if supported */}
            {onToggleViewMode && (
              <button
                type="button"
                onClick={onToggleViewMode}
                aria-label={is3DMode ? 'Alternar para Modo 2D' : 'Alternar para Modo 3D Shelf'}
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#C5A059]" />
                <span>{is3DMode ? 'Modo 2D' : 'Modo 3D Shelf'}</span>
              </button>
            )}

            {/* New Book Action Button */}
            <button
              type="button"
              onClick={onOpenAddBook}
              aria-label="Adicionar novo livro"
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold tracking-wide text-[#080B10] shadow-md transition-all hover:bg-[#E1BE4A] hover:shadow-lg active:scale-98 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/80"
            >
              <Plus className="h-4 w-4 text-[#080B10]" />
              <span>+ Novo Livro</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips Bar — only in 2D mode; the 3D shelf keeps the view unobstructed */}
        {!is3DMode && (
          <div className="mx-auto mt-2.5 flex max-w-7xl items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-2.5 pb-1 touch-pan-x scrollbar-none snap-x snap-mandatory">
            {(Object.keys(CATEGORY_LABELS) as ReadingCategoryFilter[]).map((catKey) => {
              const isSelected = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => onSelectCategory(catKey)}
                  aria-label={`Filtrar por ${CATEGORY_LABELS[catKey].label}`}
                  className={`flex min-h-[44px] min-w-[44px] snap-start shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs font-medium transition-all whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${
                    isSelected
                      ? 'border border-[#D4AF37] bg-[#D4AF37]/15 font-semibold text-[#F3D274] shadow-xs'
                      : 'border border-slate-700 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {CATEGORY_LABELS[catKey].label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

export default EditorialHeader;

