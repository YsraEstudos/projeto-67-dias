import React from 'react';
import { Plus, Flame, BookOpen, Layers, Sparkles, ArrowLeft } from 'lucide-react';
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
  return (
    <header className="w-full border-b border-slate-800 bg-[#0B0F16] px-3 py-2.5 pt-[max(0.75rem,env(safe-area-inset-top))] text-slate-100 shadow-lg transition-all sm:px-4 md:px-6 md:py-3">
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

      {/* Category Filter Chips Bar */}
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
    </header>
  );
};

export default EditorialHeader;

