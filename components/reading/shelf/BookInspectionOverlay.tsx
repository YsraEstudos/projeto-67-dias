import React, { useState } from 'react';
import { X, Edit3, Plus, Minus, BookOpen, CheckCircle2, Bookmark, Clock, Star, Sparkles } from 'lucide-react';
import { Book } from '../../../types';

interface BookInspectionOverlayProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onEditBook: (book: Book) => void;
  onUpdateProgress: (bookId: string, newCurrent: number) => void;
}

const STATUS_CONFIG: Record<Book['status'], { label: string; bg: string; text: string; icon: React.FC<{ className?: string }> }> = {
  READING: { label: 'Lendo', bg: 'bg-[#EAE2D2]', text: 'text-[#3A2317]', icon: BookOpen },
  COMPLETED: { label: 'Concluído', bg: 'bg-[#D4E8D4]', text: 'text-[#1E4620]', icon: CheckCircle2 },
  TO_READ: { label: 'Desejo', bg: 'bg-[#F2E8D5]', text: 'text-[#7A541E]', icon: Bookmark },
  PAUSED: { label: 'Pausado', bg: 'bg-[#E8E4E0]', text: 'text-[#4A4744]', icon: Clock },
  ABANDONED: { label: 'Abandonado', bg: 'bg-[#F0D5D5]', text: 'text-[#612020]', icon: X },
};

export const BookInspectionOverlay: React.FC<BookInspectionOverlayProps> = ({
  book,
  isOpen,
  onClose,
  onEditBook,
  onUpdateProgress,
}) => {
  const [customDelta, setCustomDelta] = useState<number>(5);

  if (!isOpen || !book) return null;

  const totalPages = book.total > 0 ? book.total : 1;
  const currentPages = Math.min(book.current, totalPages);
  const percentage = Math.min(100, Math.round((currentPages / totalPages) * 100));

  const statusInfo = STATUS_CONFIG[book.status] || STATUS_CONFIG.TO_READ;
  const StatusIcon = statusInfo.icon;

  const handleIncrement = (amount: number) => {
    const nextVal = Math.min(book.total || 9999, Math.max(0, book.current + amount));
    onUpdateProgress(book.id, nextVal);
  };

  const handleDecrement = (amount: number) => {
    const nextVal = Math.max(0, book.current - amount);
    onUpdateProgress(book.id, nextVal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#1A1918]/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn">
      
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Inspection Drawer Card */}
      <div className="relative z-10 w-full max-w-md h-full md:h-[92vh] md:my-auto md:mr-6 bg-[#FDFBF7] text-[#1A1918] md:rounded-3xl shadow-2xl border border-[#E6DFD3] flex flex-col overflow-hidden animate-slideInRight">
        
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#E6DFD3] flex items-center justify-between bg-[#F5F0E6]/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#8C7A6B]">
              Inspeção Detalhada
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE2D2] text-[#5C5248] transition-colors cursor-pointer"
            aria-label="Fechar Inspeção"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
          
          {/* Cover & Main Details Banner */}
          <div className="flex gap-5 items-start">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-24 h-36 object-cover rounded-xl shadow-md border border-[#E2D8C6] flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-36 rounded-xl bg-[#3A2317] text-[#F3D274] flex flex-col items-center justify-center p-3 text-center shadow-md flex-shrink-0 border border-[#523321]">
                <BookOpen className="w-8 h-8 mb-2 opacity-80" />
                <span className="text-[10px] font-serif font-bold uppercase tracking-wider line-clamp-3">
                  {book.title}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F0E6] text-[#7A6857] border border-[#E2D8C6]">
                  {book.genre || 'Geral'}
                </span>
              </div>

              <h2 className="text-xl font-serif font-bold text-[#1A1918] leading-tight mb-1">
                {book.title}
              </h2>
              <p className="text-sm text-[#7A6857] font-medium mb-3">
                {book.author}
              </p>

              {/* Rating stars if available */}
              {book.rating !== undefined && book.rating > 0 && (
                <div className="flex items-center gap-1 text-[#C5A059]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < book.rating ? 'fill-[#C5A059]' : 'text-[#DCD2C4]'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reading Progress Section */}
          <div className="p-4 rounded-2xl bg-[#F5F0E6] border border-[#E2D8C6] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#3A2317] tracking-wide uppercase text-[11px]">
                Progresso de Leitura
              </span>
              <span className="font-bold text-[#3A2317]">
                {percentage}% ({book.current} / {book.total || '?'} {book.unit === 'CHAPTERS' ? 'caps' : 'págs'})
              </span>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[#E2D8C6] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-[#3A2317] transition-all duration-500 shadow-xs"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Quick Log +/- Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <span className="text-[11px] font-medium text-[#7A6857]">
                Registro Rápido de Leitura:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleDecrement(1)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#EAE2D2] text-[#3A2317] text-xs font-bold border border-[#E2D8C6] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Minus className="w-3 h-3" /> 1 pág
                </button>
                <button
                  onClick={() => handleDecrement(5)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#EAE2D2] text-[#3A2317] text-xs font-bold border border-[#E2D8C6] transition-all cursor-pointer"
                >
                  -5
                </button>
                <button
                  onClick={() => handleIncrement(1)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#3A2317] hover:bg-[#2C1A10] text-[#FAF6EE] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#F3D274]" /> +1 pág
                </button>
                <button
                  onClick={() => handleIncrement(5)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#3A2317] hover:bg-[#2C1A10] text-[#FAF6EE] text-xs font-bold transition-all cursor-pointer"
                >
                  +5
                </button>
                <button
                  onClick={() => handleIncrement(10)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#3A2317] hover:bg-[#2C1A10] text-[#FAF6EE] text-xs font-bold transition-all cursor-pointer"
                >
                  +10
                </button>
              </div>
            </div>
          </div>

          {/* Notes / Description */}
          {book.notes && (
            <div className="p-4 rounded-2xl bg-[#F5F0E6]/50 border border-[#E2D8C6]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] mb-1.5">
                Notas & Reflexões
              </h4>
              <p className="text-xs text-[#4A443E] leading-relaxed italic font-serif whitespace-pre-wrap">
                "{book.notes}"
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs text-[#7A6857]">
            <div className="p-3 rounded-xl bg-[#F5F0E6]/40 border border-[#E2D8C6]/60">
              <span className="block text-[10px] text-[#A39281] uppercase font-bold">Unidade</span>
              <span className="font-semibold text-[#1A1918]">
                {book.unit === 'CHAPTERS' ? 'Capítulos' : book.unit === 'HOURS' ? 'Horas' : 'Páginas'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F0E6]/40 border border-[#E2D8C6]/60">
              <span className="block text-[10px] text-[#A39281] uppercase font-bold">Adicionado em</span>
              <span className="font-semibold text-[#1A1918]">
                {book.addedAt ? new Date(book.addedAt).toLocaleDateString('pt-BR') : 'Hoje'}
              </span>
            </div>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#E6DFD3] bg-[#F5F0E6]/40 flex items-center justify-between gap-3">
          <button
            onClick={() => onEditBook(book)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#F5F0E6] hover:bg-[#EAE2D2] text-[#3A2317] border border-[#E2D8C6] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" /> Editar Livro
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#3A2317] hover:bg-[#2C1A10] text-[#FAF6EE] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            Fechar Inspeção
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookInspectionOverlay;
