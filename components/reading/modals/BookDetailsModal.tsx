import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Book as IBook } from '../../../types';
import { X, Book, BookOpen, Calendar, Star, StickyNote, Edit2, ChevronDown } from 'lucide-react';
import ProgressBar from '../ProgressBar';

interface BookDetailsModalProps {
    book: IBook;
    onClose: () => void;
    onEdit: () => void;
}

// Progress Ring for details view
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
    progress,
    size = 80,
    strokeWidth = 6
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="progress-ring">
                <circle
                    className="progress-ring-bg"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="progress-ring-fill text-indigo-500"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{progress}%</span>
            </div>
        </div>
    );
};

// Hook to detect mobile
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({ book, onClose, onEdit }) => {
    const percentage = Math.round((book.current / (book.total || 1)) * 100);
    const isMobile = useIsMobile();
    const [isClosing, setIsClosing] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const currentY = useRef<number>(0);

    // Handle close with animation
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(onClose, 250);
    }, [onClose]);

    // Touch handlers for swipe-to-close
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startY.current = e.touches[0].clientY;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0 && sheetRef.current) {
            sheetRef.current.style.transform = `translateY(${diff}px)`;
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        const diff = currentY.current - startY.current;

        if (diff > 100) {
            handleClose();
        } else if (sheetRef.current) {
            sheetRef.current.style.transform = '';
        }

        startY.current = 0;
        currentY.current = 0;
    }, [handleClose]);

    // Days remaining calculation
    const daysRemaining = book.deadline
        ? Math.max(0, Math.ceil((new Date(book.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const pagesRemaining = book.total - book.current;
    const pagesPerDay = daysRemaining && daysRemaining > 0
        ? Math.ceil(pagesRemaining / daysRemaining)
        : null;

    // Mobile Bottom Sheet
    if (isMobile) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            >
                <div
                    ref={sheetRef}
                    className={`bottom-sheet ${isClosing ? 'animate-sheet-down' : 'animate-sheet-up'} w-full`}
                    onClick={e => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Handle bar */}
                    <div className="bottom-sheet-handle touch-manipulation" />

                    {/* Header with cover */}
                    <div className="flex items-center gap-4 px-5 pb-4 border-b border-slate-700/50">
                        {/* Mini Cover */}
                        <div className="w-16 h-24 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <Book size={24} />
                                </div>
                            )}
                        </div>

                        {/* Title & Progress */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-white truncate">{book.title}</h2>
                            <p className="text-sm text-slate-400 truncate">{book.author}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <ProgressRing progress={percentage} size={48} strokeWidth={4} />
                                <div>
                                    <div className="text-sm text-slate-300">
                                        <span className="font-bold text-white">{book.current}</span> / {book.total}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {book.unit === 'PAGES' ? 'páginas' : book.unit === 'CHAPTERS' ? 'capítulos' : 'horas'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 p-5">
                        {pagesPerDay && (
                            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold text-indigo-400">{pagesPerDay}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">pág/dia</div>
                            </div>
                        )}
                        {daysRemaining !== null && (
                            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                                <div className="text-lg font-bold text-amber-400">{daysRemaining}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">dias</div>
                            </div>
                        )}
                        <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                            <div className="text-lg font-bold text-emerald-400">{pagesRemaining}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">restantes</div>
                        </div>
                        {book.rating > 0 && (
                            <div className="bg-slate-800/50 rounded-xl p-3 text-center col-span-3">
                                <div className="flex items-center justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={18}
                                            className={star <= book.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    {book.notes && (
                        <div className="px-5 pb-5">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2">
                                <StickyNote size={14} /> Notas
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 max-h-32 overflow-y-auto">
                                <p className="text-sm text-slate-300 whitespace-pre-line">{book.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 p-5 pt-0 pb-safe">
                        <button
                            onClick={onEdit}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-800 text-slate-200 font-bold transition-colors border border-slate-700 touch-target-book"
                        >
                            <Edit2 size={18} /> Editar
                        </button>
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/30 touch-target-book"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Desktop Modal (existing design with improvements)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER WITH BLURRED BACKDROP */}
                <div className="relative h-48 sm:h-56 bg-slate-800 flex-shrink-0">
                    {/* Backdrop Image */}
                    {book.coverUrl && (
                        <div className="absolute inset-0 overflow-hidden">
                            <img
                                src={book.coverUrl}
                                alt=""
                                className="w-full h-full object-cover opacity-30 blur-xl scale-110"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2.5 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute -bottom-12 left-6 sm:left-8 flex items-end gap-6 w-full pr-6">
                        {/* Cover Card */}
                        <div className="w-32 h-48 sm:w-40 sm:h-60 bg-slate-800 rounded-xl shadow-2xl shadow-black/50 border-4 border-slate-900 overflow-hidden flex-shrink-0 relative z-10">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-gradient-to-b from-slate-800 to-slate-850"><Book size={48} /></div>
                            )}
                        </div>

                        {/* Title Info (Desktop) */}
                        <div className="hidden sm:block pb-14 text-shadow-sm flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold bg-indigo-500/90 text-white px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider backdrop-blur-sm">
                                    {book.genre || 'Geral'}
                                </span>
                                {book.status === 'COMPLETED' && <span className="text-xs font-bold bg-emerald-500/90 text-white px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider backdrop-blur-sm">Lido</span>}
                            </div>
                            <h2 className="text-2xl font-bold text-white leading-tight truncate" title={book.title}>{book.title}</h2>
                            <p className="text-slate-300 font-medium">{book.author}</p>
                        </div>
                    </div>
                </div>

                {/* BODY CONTENT */}
                <div className="flex-1 overflow-y-auto pt-16 px-6 sm:px-8 pb-8 scrollbar-thin">
                    {/* Title Info (Mobile) */}
                    <div className="block sm:hidden mb-6">
                        <h2 className="text-xl font-bold text-white leading-tight">{book.title}</h2>
                        <p className="text-slate-400">{book.author}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Stats & Details */}
                        <div className="space-y-6">
                            {/* Progress Section */}
                            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
                                <div className="flex items-center gap-5">
                                    <ProgressRing progress={percentage} size={80} strokeWidth={6} />
                                    <div className="flex-1">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Progresso Atual</span>
                                        <div className="text-2xl font-bold text-white mt-1">
                                            {book.current} <span className="text-sm text-slate-500 font-normal">/ {book.total}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {book.unit === 'PAGES' ? 'páginas' : book.unit === 'CHAPTERS' ? 'capítulos' : 'horas'}
                                        </div>
                                    </div>
                                </div>
                                <ProgressBar current={book.current} total={book.total} />
                                <div className="mt-4 flex gap-2 text-xs text-slate-500 flex-wrap">
                                    <span className="flex items-center gap-1 bg-slate-900/50 px-2.5 py-1.5 rounded-lg"><BookOpen size={12} /> {book.unit === 'PAGES' ? 'Páginas' : book.unit === 'CHAPTERS' ? 'Capítulos' : 'Horas'}</span>
                                    {book.addedAt && (
                                        <span className="flex items-center gap-1 bg-slate-900/50 px-2.5 py-1.5 rounded-lg"><Calendar size={12} /> {new Date(book.addedAt).toLocaleDateString('pt-BR')}</span>
                                    )}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            {(daysRemaining !== null || pagesPerDay) && (
                                <div className="grid grid-cols-3 gap-3">
                                    {pagesPerDay && (
                                        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/30">
                                            <div className="text-lg font-bold text-indigo-400">{pagesPerDay}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">pág/dia</div>
                                        </div>
                                    )}
                                    {daysRemaining !== null && (
                                        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/30">
                                            <div className="text-lg font-bold text-amber-400">{daysRemaining}</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">dias</div>
                                        </div>
                                    )}
                                    <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700/30">
                                        <div className="text-lg font-bold text-emerald-400">{pagesRemaining}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">restantes</div>
                                    </div>
                                </div>
                            )}

                            {/* Rating if exists */}
                            {book.rating > 0 && (
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={22}
                                            className={star <= book.rating ? "fill-yellow-500 text-yellow-500" : "text-slate-700"}
                                        />
                                    ))}
                                    <span className="text-sm text-slate-500 ml-2">Avaliação Pessoal</span>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Notes */}
                        <div className="flex flex-col h-full">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <StickyNote size={16} /> Minhas Anotações
                            </h3>
                            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-5 relative group min-h-[150px]">
                                {book.notes ? (
                                    <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                                        {book.notes}
                                    </p>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 italic text-sm">
                                        <StickyNote size={24} className="mb-2 opacity-50" />
                                        Nenhuma anotação ainda.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700"
                    >
                        <Edit2 size={18} /> Editar / Adicionar Notas
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium transition-all shadow-lg shadow-indigo-900/20"
                    >
                        Fechar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BookDetailsModal;
