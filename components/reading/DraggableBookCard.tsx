import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Book as IBook } from '../../types';
import ProgressBar from './ProgressBar';
import { Book, MoreVertical, Edit2, Move, Trash2, Play, PauseCircle, CheckCircle2, Calendar, Minus, Plus } from 'lucide-react';

interface DraggableBookCardProps {
    book: IBook;
    viewMode: 'grid' | 'list';
    onDragStart: (e: React.DragEvent, id: string) => void;
    onUpdateProgress: (id: string, d: number) => void;
    onUpdateStatus: (id: string, s: IBook['status']) => void;
    onEdit: (b: IBook) => void;
    onDelete: (id: string) => void;
    onMove: (b: IBook) => void;
    onSelect: (b: IBook) => void;
    onPlan?: (b: IBook) => void;
}

// Progress Ring Component for compact view
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
    progress,
    size = 40,
    strokeWidth = 4
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
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
    );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: IBook['status'] }> = ({ status }) => {
    const config = useMemo(() => ({
        READING: { label: 'Lendo', className: 'book-status-badge book-status-reading' },
        PAUSED: { label: 'Pausa', className: 'book-status-badge book-status-paused' },
        COMPLETED: { label: 'Lido', className: 'book-status-badge book-status-completed' },
        TO_READ: { label: 'Ler', className: 'book-status-badge book-status-toread' },
        ABANDONED: { label: 'Dropado', className: 'book-status-badge book-status-paused' },
    }), []);

    const { label, className } = config[status] || config.TO_READ;
    return <div className={className}>{label}</div>;
};

// Compact Card for Mobile
const CompactBookCard: React.FC<{
    book: IBook;
    percentage: number;
    onSelect: () => void;
    onMenuClick: (e: React.MouseEvent) => void;
}> = React.memo(({ book, percentage, onSelect, onMenuClick }) => (
    <div
        onClick={onSelect}
        className="book-card-premium book-card-compact rounded-xl cursor-pointer touch-manipulation"
    >
        {/* Cover */}
        <div className="book-cover relative overflow-hidden rounded-l-xl">
            {book.coverUrl ? (
                <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                    <Book size={24} />
                </div>
            )}
            <div className="absolute inset-0 book-cover-overlay pointer-events-none" />
        </div>

        {/* Content */}
        <div className="book-content">
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-200 text-sm leading-tight truncate">
                        {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{book.author}</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onMenuClick(e); }}
                    className="text-slate-500 hover:text-white p-1 rounded touch-target-book"
                >
                    <MoreVertical size={16} />
                </button>
            </div>

            <div className="flex items-center justify-between gap-3 mt-auto">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ProgressRing progress={percentage} size={32} strokeWidth={3} />
                    <div className="min-w-0">
                        <div className="text-sm font-bold text-white">{percentage}%</div>
                        <div className="text-[10px] text-slate-500">
                            {book.current}/{book.total}
                        </div>
                    </div>
                </div>
                <StatusBadge status={book.status} />
            </div>
        </div>
    </div>
));

CompactBookCard.displayName = 'CompactBookCard';

// Detect if we're on mobile
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

const DraggableBookCard: React.FC<DraggableBookCardProps> = React.memo(({
    book,
    viewMode,
    onDragStart,
    onUpdateProgress,
    onUpdateStatus,
    onEdit,
    onDelete,
    onMove,
    onSelect,
    onPlan
}) => {
    const isMobile = useIsMobile();
    const isGrid = viewMode === 'grid';

    // Local state for input to avoid store updates on every keystroke
    const [localProgress, setLocalProgress] = useState(book.current);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const percentage = useMemo(() =>
        Math.round((book.current / (book.total || 1)) * 100),
        [book.current, book.total]
    );

    // Sync with external changes (drag-drop, stepper buttons)
    useEffect(() => {
        if (!isInputFocused) {
            setLocalProgress(book.current);
        }
    }, [book.current, isInputFocused]);

    // Commit progress to store on blur
    const commitProgress = useCallback(() => {
        setIsInputFocused(false);
        const delta = localProgress - book.current;
        if (delta !== 0) {
            onUpdateProgress(book.id, delta);
        }
    }, [localProgress, book.current, book.id, onUpdateProgress]);

    // Context menu handler (right click)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    }, []);

    // Open menu from button click
    const handleMenuClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            // Position menu to stay within viewport
            const menuWidth = 176;
            const x = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 16);
            setMenuPos({ x, y: rect.bottom + 4 });
        }
        setShowMenu(prev => !prev);
    }, []);

    // Close menu when clicking outside
    const closeMenu = useCallback(() => setShowMenu(false), []);

    // Use compact card on mobile
    if (isMobile && isGrid) {
        return (
            <>
                <CompactBookCard
                    book={book}
                    percentage={percentage}
                    onSelect={() => { setShowMenu(false); onSelect(book); }}
                    onMenuClick={handleMenuClick}
                />
                {/* Context Menu Portal */}
                {showMenu && createPortal(
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={closeMenu} />
                        <div
                            className="fixed w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-2 z-[101] animate-scale-in"
                            style={{ left: Math.min(menuPos.x, window.innerWidth - 208), top: menuPos.y }}
                        >
                            <button onClick={() => { closeMenu(); onEdit(book); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 text-slate-300 flex items-center gap-3 rounded-xl touch-target-book">
                                <Edit2 size={16} /> Editar
                            </button>
                            <button onClick={() => { closeMenu(); onMove(book); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 text-slate-300 flex items-center gap-3 rounded-xl touch-target-book">
                                <Move size={16} /> Mover
                            </button>
                            {onPlan && (
                                <button onClick={() => { closeMenu(); onPlan(book); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 text-amber-400 flex items-center gap-3 rounded-xl touch-target-book">
                                    <Calendar size={16} /> Ver Plano
                                </button>
                            )}
                            <div className="h-px bg-slate-700/50 my-1.5" />
                            <button onClick={() => { closeMenu(); onDelete(book.id); }} className="w-full text-left px-4 py-3 text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-3 rounded-xl touch-target-book">
                                <Trash2 size={16} /> Remover
                            </button>
                        </div>
                    </>,
                    document.body
                )}
            </>
        );
    }

    return (
        <>
            <div
                draggable={!isMobile}
                onDragStart={(e) => onDragStart(e, book.id)}
                onClick={() => { setShowMenu(false); onSelect(book); }}
                onContextMenu={handleContextMenu}
                className={`group book-card-premium rounded-2xl shadow-lg cursor-pointer active:cursor-grabbing flex touch-manipulation ${isGrid ? 'flex-col' : 'flex-row h-32 items-center'
                    }`}
            >
                {/* Cover */}
                <div className={`bg-slate-900 flex-shrink-0 overflow-hidden relative ${isGrid ? 'aspect-[2/3] w-full border-b border-slate-700/30 rounded-t-2xl' : 'h-full aspect-[2/3] border-r border-slate-700/30 rounded-l-2xl'
                    }`}>
                    {/* Skeleton loader */}
                    {!imageLoaded && book.coverUrl && (
                        <div className="absolute inset-0 bg-slate-800 animate-shimmer" />
                    )}

                    {book.coverUrl ? (
                        <img
                            src={book.coverUrl}
                            alt={book.title}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            loading="lazy"
                            decoding="async"
                            onLoad={() => setImageLoaded(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 bg-gradient-to-b from-slate-800 to-slate-850">
                            <Book size={isGrid ? 36 : 24} />
                        </div>
                    )}

                    {/* Cover overlay gradient */}
                    <div className="absolute inset-0 book-cover-overlay pointer-events-none" />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                        <StatusBadge status={book.status} />
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 p-4 flex flex-col min-w-0 ${isGrid ? '' : 'h-full justify-between'}`}>
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <h4 className={`font-bold text-slate-100 leading-tight truncate mb-0.5 ${isGrid ? 'text-sm' : 'text-base'}`} title={book.title}>
                                {book.title}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">{book.author}</p>
                        </div>

                        {/* 3 Dots Menu Button */}
                        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                                ref={menuButtonRef}
                                onClick={handleMenuClick}
                                className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors touch-target-book"
                            >
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Front Controls */}
                <div className={`${isGrid ? 'px-4 pb-4' : 'pr-4 w-48'}`} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mb-2">
                        <span className="font-medium">{isInputFocused ? localProgress : book.current} / {book.total} {book.unit === 'PAGES' ? 'pág' : 'cap'}</span>
                        <span className="font-bold text-indigo-400">{percentage}%</span>
                    </div>
                    <ProgressBar current={isInputFocused ? localProgress : book.current} total={book.total} />

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3">
                        {book.status === 'TO_READ' && (
                            <button
                                onClick={() => onUpdateStatus(book.id, 'READING')}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 transition-all shadow-lg shadow-indigo-900/30 touch-target-book"
                            >
                                <Play size={14} fill="currentColor" /> Ler Agora
                            </button>
                        )}

                        {(book.status === 'READING' || book.status === 'PAUSED') && (
                            <>
                                {book.status === 'READING' ? (
                                    <button
                                        onClick={() => onUpdateStatus(book.id, 'PAUSED')}
                                        className="p-2.5 bg-slate-700/80 hover:bg-orange-500/20 text-slate-300 hover:text-orange-500 rounded-xl transition-all touch-target-book"
                                        title="Pausar"
                                    >
                                        <PauseCircle size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onUpdateStatus(book.id, 'READING')}
                                        className="p-2.5 bg-slate-700/80 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded-xl transition-all touch-target-book"
                                        title="Retomar"
                                    >
                                        <Play size={18} />
                                    </button>
                                )}

                                {/* Stepper moderno */}
                                <div className="flex-1 stepper-mobile">
                                    <button
                                        onClick={() => onUpdateProgress(book.id, -1)}
                                        className="text-slate-400 hover:text-red-400 border-r border-slate-700/50"
                                        title="Diminuir página"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        value={localProgress}
                                        onFocus={() => setIsInputFocused(true)}
                                        onChange={(e) => setLocalProgress(Number(e.target.value))}
                                        onBlur={commitProgress}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                    />
                                    <button
                                        onClick={() => onUpdateProgress(book.id, 1)}
                                        className="text-slate-400 hover:text-emerald-400 border-l border-slate-700/50"
                                        title="Aumentar página"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => onUpdateStatus(book.id, 'COMPLETED')}
                                    className="p-2.5 bg-slate-700/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition-all touch-target-book"
                                    title="Concluir"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                            </>
                        )}

                        {book.status === 'COMPLETED' && (
                            <button
                                onClick={() => onUpdateStatus(book.id, 'READING')}
                                className="w-full py-2.5 text-xs text-slate-400 hover:text-indigo-400 font-bold flex items-center justify-center gap-1.5 bg-slate-800/80 rounded-xl hover:bg-slate-700/80 border border-slate-700/50 hover:border-indigo-500/30 transition-all touch-target-book"
                            >
                                Ler Novamente
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Context Menu Portal - Rendered outside card to avoid overflow clipping */}
            {showMenu && createPortal(
                <>
                    {/* Overlay to close menu */}
                    <div className="fixed inset-0 z-[100]" onClick={closeMenu} />
                    <div
                        className="fixed w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-2 z-[101] animate-scale-in"
                        style={{ left: menuPos.x, top: menuPos.y }}
                    >
                        <button onClick={() => { closeMenu(); onEdit(book); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 text-slate-300 flex items-center gap-3 rounded-xl touch-target-book">
                            <Edit2 size={16} /> Editar
                        </button>
                        <button onClick={() => { closeMenu(); onMove(book); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 text-slate-300 flex items-center gap-3 rounded-xl touch-target-book">
                            <Move size={16} /> Mover
                        </button>
                        {onPlan && (
                            <button onClick={() => { closeMenu(); onPlan(book); }} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 text-amber-400 flex items-center gap-3 rounded-xl touch-target-book">
                                <Calendar size={16} /> Ver Plano
                            </button>
                        )}
                        <div className="h-px bg-slate-700/50 my-1.5" />
                        <button onClick={() => { closeMenu(); onDelete(book.id); }} className="w-full text-left px-4 py-3 text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-3 rounded-xl touch-target-book">
                            <Trash2 size={16} /> Remover
                        </button>
                    </div>
                </>,
                document.body
            )}
        </>
    );
});

DraggableBookCard.displayName = 'DraggableBookCard';

export default DraggableBookCard;
