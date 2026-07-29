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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl pointer-events-auto transition-all">
      <div className="bg-[#FDFBF7]/95 backdrop-blur-md border border-[#E6DFD3] rounded-2xl shadow-xl p-3 md:p-4 text-[#1A1918]">
        
        {/* Continuous Position Markers Track */}
        {totalCount > 0 && (
          <div className="w-full mb-3 flex items-center justify-between gap-1 px-1">
            <span className="text-[10px] font-mono text-[#8C7A6B]">01</span>
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
                        ? 'w-6 bg-[#3A2317] ring-2 ring-[#C5A059]'
                        : 'w-1.5 bg-[#DCD2C4] hover:bg-[#A39281]'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-mono text-[#8C7A6B]">
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
              className="p-2 rounded-xl bg-[#F5F0E6] hover:bg-[#EAE2D2] disabled:opacity-40 disabled:cursor-not-allowed text-[#3A2317] transition-all cursor-pointer"
              aria-label="Livro Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onNextBook}
              disabled={totalCount === 0 || selectedIndex >= totalCount - 1}
              className="p-2 rounded-xl bg-[#F5F0E6] hover:bg-[#EAE2D2] disabled:opacity-40 disabled:cursor-not-allowed text-[#3A2317] transition-all cursor-pointer"
              aria-label="Próximo Livro"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Active Book Title & Author Pill */}
          <div className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-[#F5F0E6]/80 border border-[#E2D8C6] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#3A2317] flex-shrink-0 flex items-center justify-center text-[#F3D274]">
              <BookIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-serif font-bold text-[#1A1918] truncate">
                {currentBook ? currentBook.title : 'Nenhum livro selecionado'}
              </h3>
              <p className="text-[11px] text-[#7A6857] truncate">
                {currentBook ? currentBook.author : 'Selecione um volume'}
              </p>
            </div>
          </div>

          {/* Drag Hint & Inspection Toggle Button */}
          <div className="flex items-center gap-2">
            <div 
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F5F0E6]/50 text-[#8C7A6B] text-[11px]"
              title="Arraste na cena 3D para rotacionar ou mudar vista"
            >
              <Grab className="w-3.5 h-3.5 text-[#A39281]" />
              <span>Arraste a estante</span>
            </div>

            <button
              onClick={onToggleInspection}
              disabled={!currentBook}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-xs ${
                isInspecting
                  ? 'bg-[#C5A059] text-[#1A1918] ring-2 ring-[#3A2317]'
                  : 'bg-[#3A2317] hover:bg-[#2C1A10] text-[#FAF6EE]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Eye className="w-4 h-4 text-[#F3D274]" />
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
