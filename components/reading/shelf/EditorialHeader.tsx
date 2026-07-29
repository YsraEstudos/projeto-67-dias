import React from 'react';
import { Plus, Flame, BookOpen, Layers, Sparkles } from 'lucide-react';
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
}) => {
  return (
    <header className="w-full bg-[#FDFBF7] text-[#1A1918] border-b border-[#E6DFD3] px-6 py-5 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        {/* Title & Brand Section */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#3A2317] flex items-center justify-center text-[#F3D274] shadow-md border border-[#523321]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#8C7A6B]">
                Biblioteca Editorial
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-[#C5A059]" />
              <span className="text-[10px] tracking-wider uppercase font-medium text-[#A39281]">
                Coleção Privada
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1918] tracking-tight">
              The Complete Shelf
            </h1>
          </div>
        </div>

        {/* Stats & Controls Center */}
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          {/* Reading Streak Counter */}
          <div 
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F0E6] border border-[#E2D8C6] text-[#3A2317]"
            title={`${readingStreakDays} dias seguidos de leitura`}
          >
            <Flame className="w-4 h-4 text-[#D96B27] fill-[#D96B27]/20 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide">
              {readingStreakDays} {readingStreakDays === 1 ? 'dia' : 'dias'} de ofensiva
            </span>
          </div>

          {/* Total Books Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F0E6] border border-[#E2D8C6] text-[#1A1918]">
            <Layers className="w-4 h-4 text-[#7A6857]" />
            <span className="text-xs font-medium">
              <strong className="font-bold text-[#3A2317]">{totalBooksCount}</strong> {totalBooksCount === 1 ? 'volume' : 'volumes'}
            </span>
          </div>

          {/* View Toggle Mode if supported */}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-[#E2D8C6] bg-[#FDFBF7] hover:bg-[#F5F0E6] text-[#3A2317] transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              {is3DMode ? 'Modo 2D' : 'Modo 3D Shelf'}
            </button>
          )}

          {/* New Book Action Button */}
          <button
            onClick={onOpenAddBook}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3A2317] hover:bg-[#2C1A10] text-[#FAF6EE] text-xs font-semibold tracking-wide shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F3D274]" />
            <span>+ Novo Livro</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-[#E6DFD3]/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {(Object.keys(CATEGORY_LABELS) as ReadingCategoryFilter[]).map((catKey) => {
          const isSelected = activeCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => onSelectCategory(catKey)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#3A2317] text-[#FAF6EE] font-semibold shadow-xs border border-[#3A2317]'
                  : 'bg-[#F5F0E6]/80 hover:bg-[#EFE7D8] text-[#5C5248] border border-[#E2D8C6]'
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
