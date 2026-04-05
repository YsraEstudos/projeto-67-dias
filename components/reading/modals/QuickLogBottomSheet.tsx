import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Minus, BookOpen } from 'lucide-react';
import { Book as IBook } from '../../../types';

interface QuickLogBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  books: IBook[];
  onUpdateProgress: (id: string, delta: number) => void;
  onSetProgress: (id: string, absoluteValue: number) => void;
}

const QuickLogItem: React.FC<{
  book: IBook;
  onUpdateProgress: (id: string, delta: number) => void;
  onSetProgress: (id: string, absoluteValue: number) => void;
}> = ({ book, onUpdateProgress, onSetProgress }) => {
  const [inputValue, setInputValue] = useState(book.current.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state with external book progress when not focused
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputValue(book.current.toString());
    }
  }, [book.current]);

  const handleBlur = () => {
    let newVal = parseInt(inputValue, 10);
    if (isNaN(newVal)) newVal = book.current;
    
    // Clamp between 0 and total
    newVal = Math.max(0, Math.min(book.total, newVal));
    setInputValue(newVal.toString());

    if (newVal !== book.current) {
       onSetProgress(book.id, newVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const isCompleted = book.current >= book.total;

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 mb-3 last:mb-0">
      {/* Cover / Title */}
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="w-10 h-14 bg-slate-900 rounded overflow-hidden flex-shrink-0 shadow-inner">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <BookOpen size={16} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-slate-200 truncate">{book.title}</h4>
          <p className="text-xs text-slate-500">
            <span className="font-medium text-indigo-400">{book.current}</span> / {book.total} {book.unit === 'PAGES' ? 'págs' : 'caps'}
          </p>
          {book.perDay > 0 && (
             <p className="text-[10px] text-slate-600 mt-0.5">Meta: {book.perDay} / dia</p>
          )}
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onUpdateProgress(book.id, -1)}
          disabled={book.current <= 0}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          <Minus size={18} />
        </button>

        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-14 h-10 text-center bg-slate-900 border border-slate-700 text-white rounded-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />

        <button
          onClick={() => onUpdateProgress(book.id, 1)}
          disabled={isCompleted}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-400 disabled:opacity-50 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};

const QuickLogBottomSheet: React.FC<QuickLogBottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  books, 
  onUpdateProgress,
  onSetProgress 
}) => {
  // Only show books currently being read
  const readingBooks = books.filter(b => b.status === 'READING');

  // Block body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="relative w-full bg-slate-900 border-t border-slate-700/50 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-pointer touch-none" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-400" />
            Registro Rápido
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto overscroll-contain">
          {readingBooks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-400 font-medium">Nenhum livro em leitura ativo.</p>
              <p className="text-xs text-slate-500 mt-1">Inicie um livro na biblioteca primeiro.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {readingBooks.map(book => (
                <QuickLogItem 
                  key={book.id} 
                  book={book} 
                  onUpdateProgress={onUpdateProgress}
                  onSetProgress={onSetProgress}
                />
              ))}
            </div>
          )}
        </div>

        {/* Safe Area Footer Spacer for iOS */}
        <div className="h-6 w-full" />
      </div>
    </div>
  );
};

export default QuickLogBottomSheet;