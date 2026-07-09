import React, { useState } from "react";
import { BookOpen, FolderSymlink } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { AulaBook } from "../../../../types";

interface BookSpineProps {
  book: AulaBook;
  height: number;
  width: number;
  colorClasses: string;
  onSelectBook?: (bookId: string) => void;
  onOpenMoveModal?: (book: AulaBook) => void;
  isDragging?: boolean;
  isPlaceholder?: boolean;
  isSortingDisabled?: boolean;
}

export const BookSpine = React.memo(function BookSpine({
  book,
  height,
  width,
  colorClasses,
  onSelectBook,
  onOpenMoveModal,
  isDragging = false,
  isPlaceholder = false,
  isSortingDisabled = false,
}: BookSpineProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleSpineClick = (e: React.MouseEvent) => {
    if (isDragging || isPlaceholder) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    onSelectBook?.(book.id);
  };

  return (
    <div
      onClick={handleSpineClick}
      onMouseEnter={() => !isDragging && !isPlaceholder && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ height: `${height}px`, width: `${width}px` }}
      className={`relative select-none flex flex-col items-center justify-between py-4 rounded-sm border-x border-t shadow-lg bg-gradient-to-b ${colorClasses} ${
        isDragging
          ? "cursor-grabbing ring-2 ring-[#D4AF37] opacity-90 scale-105"
          : isPlaceholder
          ? "opacity-25"
          : "cursor-grab active:cursor-grabbing hover:-translate-y-4 hover:shadow-[0_15px_25px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out"
      }`}
    >
      {/* 3D Curved Grooves shading overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/45 pointer-events-none rounded-sm" />
      
      {/* Left-edge ridge (simulated spine fold) */}
      <div className="absolute top-0 bottom-0 left-[3px] w-[2px] bg-white/10 shadow-[1px_0_0_rgba(0,0,0,0.5)] pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-[3px] w-[2px] bg-black/20 pointer-events-none" />

      {/* Top Gold Foil Stripe */}
      <div className="w-full h-1.5 bg-gradient-to-r from-[#B59410] via-[#FCE068] to-[#B59410] border-y border-yellow-800 shadow-[0_1px_2px_rgba(0,0,0,0.3)] relative z-10 shrink-0" />

      {/* Book Title (Vertical Text) */}
      <div className="flex-1 flex items-center justify-center py-2 relative z-10 overflow-hidden w-full px-1">
        <span 
          style={{ writingMode: "vertical-rl" }} 
          className="text-[10px] sm:text-xs font-serif font-bold text-[#FCE57F] tracking-widest text-center truncate max-h-[80%] uppercase select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        >
          {book.title}
        </span>
      </div>

      {/* Spine Details & Bottom Stripe */}
      <div className="w-full flex flex-col items-center gap-1.5 relative z-10 shrink-0">
        <span className="text-[8px] font-mono font-semibold text-white/50 tracking-wider">
          {book.chapters?.length || 0}
        </span>
        
        {/* Bottom Gold Foil Stripe */}
        <div className="w-full h-1.5 bg-gradient-to-r from-[#B59410] via-[#FCE068] to-[#B59410] border-y border-yellow-800 shadow-[0_-1px_2px_rgba(0,0,0,0.3)]" />
      </div>

      {/* Hover Info Tooltip (Premium Popover) */}
      <AnimatePresence>
        {showTooltip && !isDragging && !isPlaceholder && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-[#D4AF37]/50 backdrop-blur-md rounded-lg p-3 text-xs w-48 shadow-2xl text-slate-100 z-30 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-[#D4AF37]/50 rotate-45" />
            <h4 className="font-serif text-sm text-slate-100 mb-1 leading-snug truncate">{book.title}</h4>
            <div className="text-[10px] text-slate-400 mb-2.5 flex items-center justify-between">
              <span>{book.chapters?.length || 0} Aulas</span>
              {book.targetDate ? (
                <span className="text-[#D4AF37] font-bold">
                  Meta: {new Date(book.targetDate + "T00:00:00").toLocaleDateString("pt-BR", { month: "2-digit", day: "2-digit" })}
                </span>
              ) : (
                <span className="italic text-slate-500">Sem meta</span>
              )}
            </div>
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => onSelectBook?.(book.id)}
                className="flex-1 bg-[#D4AF37] hover:bg-[#C2A032] text-slate-950 py-1.5 px-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                Abrir
              </button>
              {onOpenMoveModal && (
                <button
                  type="button"
                  onClick={() => onOpenMoveModal(book)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 p-1.5 rounded transition-colors cursor-pointer"
                  title="Mover curso"
                >
                  <FolderSymlink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}, (prevProps, nextProps) => 
  prevProps.book === nextProps.book && 
  prevProps.height === nextProps.height && 
  prevProps.width === nextProps.width && 
  prevProps.colorClasses === nextProps.colorClasses && 
  prevProps.isDragging === nextProps.isDragging && 
  prevProps.isPlaceholder === nextProps.isPlaceholder
);

export const SortableBookSpine = React.memo(function SortableBookSpine({
  book,
  height,
  width,
  colorClasses,
  onSelectBook,
  onOpenMoveModal,
}: {
  book: AulaBook;
  height: number;
  width: number;
  colorClasses: string;
  onSelectBook: (bookId: string) => void;
  onOpenMoveModal: (book: AulaBook) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BookSpine 
        book={book} 
        height={height}
        width={width}
        colorClasses={colorClasses}
        onSelectBook={onSelectBook}
        onOpenMoveModal={onOpenMoveModal}
        isPlaceholder={isDragging}
      />
    </div>
  );
}, (prevProps, nextProps) => 
  prevProps.book === nextProps.book && 
  prevProps.height === nextProps.height && 
  prevProps.width === nextProps.width && 
  prevProps.colorClasses === nextProps.colorClasses
);
