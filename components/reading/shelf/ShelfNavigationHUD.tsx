import React from 'react';
import { ChevronLeft, ChevronRight, Eye, Grab, Book as BookIcon, Check } from 'lucide-react';
import { Book } from '../../../types';

interface ShelfNavigationHUDProps {
  books: Book[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  isInspecting: boolean;
  onToggleInspection: () => void;
  onPrevBook: () => void;
  onNextBook: () => void;
}

export const ShelfNavigationHUD: React.FC<ShelfNavigationHUDProps> = ({
  books,
  selectedIndex,
  onSelectIndex,
  isInspecting,
  onToggleInspection,
  onPrevBook,
  onNextBook,
}) => {
  const currentBook = books.length > 0 && selectedIndex >= 0 && selectedIndex < books.length
    ? books[selectedIndex]
    : null;

  const totalCount = books.length;

  return (
    <div className="absolute bottom-4 left-1/2 z-30 w-[min(92%,680px)] -translate-x-1/2 pointer-events-auto transition-all">
      <div className="rounded-2xl border border-slate-700/80 bg-[#0D121A]/92 p-3 text-slate-100 shadow-2xl backdrop-blur-md md:p-4">
        
        {/* Continuous Position Markers Track */}
        {totalCount > 0 && (
          <div className="w-full mb-3 flex items-center justify-between gap-1 px-1">
            <span className="font-mono text-[10px] text-slate-500">01</span>
            <div className="flex-1 flex items-center justify-center gap-1 mx-2 overflow-hidden h-3">
              {books.map((b, idx) => {
                const isActive = idx === selectedIndex;
                return (
                  <button
                    key={b.id || idx}
                    onClick={() => onSelectIndex(idx)}
                    title={`${b.title} (${idx + 1}/${totalCount})`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? 'w-6 bg-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                        : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                );
              })}
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {String(totalCount).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* HUD Main Controls Bar */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevBook}
              disabled={totalCount === 0 || selectedIndex <= 0}
              className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-200 transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Livro Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onNextBook}
              disabled={totalCount === 0 || selectedIndex >= totalCount - 1}
              className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-200 transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próximo Livro"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Active Book Title & Author Pill */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#F3D274]">
              <BookIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-xs font-bold text-slate-100">
                {currentBook ? currentBook.title : 'Nenhum livro selecionado'}
              </h3>
              <p className="truncate text-[11px] text-slate-400">
                {currentBook ? currentBook.author : 'Selecione um volume'}
              </p>
            </div>
          </div>

          {/* Drag Hint & Inspection Toggle Button */}
          <div className="flex items-center gap-2">
            <div 
              className="hidden items-center gap-1 rounded-xl bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-400 md:flex"
              title="Arraste na cena 3D para rotacionar ou mudar vista"
            >
              <Grab className="h-3.5 w-3.5 text-slate-500" />
              <span>Arraste a estante</span>
            </div>

            <button
              onClick={onToggleInspection}
              disabled={!currentBook}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-xs ${
                isInspecting
                  ? 'bg-[#D4AF37] text-[#080B10] ring-2 ring-[#D4AF37]/30'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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
  );
};

export default ShelfNavigationHUD;
