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
    <header className="w-full border-b border-slate-800 bg-[#0B0F16] px-4 py-3 text-slate-100 shadow-lg transition-all md:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        {/* Title & Brand Section */}
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              aria-label="Voltar ao painel principal"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:border-[#D4AF37]/60 hover:bg-slate-800 hover:text-[#F3D274]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#F3D274] shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Biblioteca Editorial
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#C5A059]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Coleção Privada
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-100 md:text-3xl">
              The Complete Shelf
            </h1>
          </div>
        </div>

        {/* Stats & Controls Center */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          {/* Reading Streak Counter */}
          <div 
            className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-slate-200"
            title={`${readingStreakDays} dias seguidos de leitura`}
          >
            <Flame className="w-4 h-4 text-[#D96B27] fill-[#D96B27]/20 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide">
              {readingStreakDays} {readingStreakDays === 1 ? 'dia' : 'dias'} de ofensiva
            </span>
          </div>

          {/* Total Books Badge */}
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-slate-200">
            <Layers className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium">
              <strong className="font-bold text-[#F3D274]">{totalBooksCount}</strong> {totalBooksCount === 1 ? 'volume' : 'volumes'}
            </span>
          </div>

          {/* View Toggle Mode if supported */}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              {is3DMode ? 'Modo 2D' : 'Modo 3D Shelf'}
            </button>
          )}

          {/* New Book Action Button */}
          <button
            onClick={onOpenAddBook}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-semibold tracking-wide text-[#080B10] shadow-md transition-all hover:bg-[#E1BE4A] hover:shadow-lg active:scale-98"
          >
            <Plus className="w-4 h-4 text-[#F3D274]" />
            <span>+ Novo Livro</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="mx-auto mt-3 flex max-w-7xl items-center gap-2 overflow-x-auto border-t border-slate-800 pt-3 scrollbar-none">
        {(Object.keys(CATEGORY_LABELS) as ReadingCategoryFilter[]).map((catKey) => {
          const isSelected = activeCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => onSelectCategory(catKey)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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
