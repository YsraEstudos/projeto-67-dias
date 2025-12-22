import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Book as IBook } from '../../types';
import ProgressBar from './ProgressBar';
import { Book, MoreVertical, Edit2, Move, Trash2, Play, PauseCircle, CheckCircle2, Calendar } from 'lucide-react';

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

const DraggableBookCard: React.FC<DraggableBookCardProps> = React.memo(({ book, viewMode, onDragStart, onUpdateProgress, onUpdateStatus, onEdit, onDelete, onMove, onSelect, onPlan }) => {

    const isGrid = viewMode === 'grid';

    // Local state for input to avoid store updates on every keystroke
    const [localProgress, setLocalProgress] = useState(book.current);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    // Sync with external changes (drag-drop, stepper buttons)
    useEffect(() => {
        if (!isInputFocused) {
            setLocalProgress(book.current);
        }
    }, [book.current, isInputFocused]);

    // Commit progress to store on blur
    const commitProgress = () => {
        setIsInputFocused(false);
        const delta = localProgress - book.current;
        if (delta !== 0) {
            onUpdateProgress(book.id, delta);
        }
    };

    // Context menu handler (right click)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    }, []);

    // Open menu from button click
    const handleMenuClick = useCallback(() => {
        if (menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();
            setMenuPos({ x: rect.right - 160, y: rect.bottom + 4 });
        }
        setShowMenu(prev => !prev);
    }, []);

    // Close menu when clicking outside
    const closeMenu = useCallback(() => setShowMenu(false), []);

    return (
        <>
            <div
                draggable
                onDragStart={(e) => onDragStart(e, book.id)}
                onClick={() => { setShowMenu(false); onSelect(book); }}
                onContextMenu={handleContextMenu}
                className={`group relative bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl overflow-hidden shadow-md transition-all hover:-translate-y-1 cursor-pointer active:cursor-grabbing flex ${isGrid ? 'flex-col' : 'flex-row h-32 items-center'}`}
            >
                {/* Cover */}
                <div className={`bg-slate-900 flex-shrink-0 overflow-hidden relative ${isGrid ? 'aspect-[2/3] w-full border-b border-slate-700/50' : 'h-full aspect-[2/3] border-r border-slate-700/50'}`}>
                    {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800"><Book size={isGrid ? 32 : 24} /></div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-1 left-1">
                        {book.status === 'READING' && <div className="bg-indigo-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm border border-indigo-400/20">LENDO</div>}
                        {book.status === 'PAUSED' && <div className="bg-orange-500/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm border border-orange-400/20">PAUSA</div>}
                        {book.status === 'COMPLETED' && <div className="bg-emerald-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm border border-emerald-400/20">LIDO</div>}
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 p-3 flex flex-col min-w-0 ${isGrid ? '' : 'h-full justify-between'}`}>
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <h4 className={`font-bold text-slate-200 leading-tight truncate mb-0.5 ${isGrid ? 'text-sm' : 'text-base'}`} title={book.title}>{book.title}</h4>
                            <p className="text-xs text-slate-500 truncate">{book.author}</p>
                        </div>

                        {/* 3 Dots Menu Button */}
                        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                                ref={menuButtonRef}
                                onClick={handleMenuClick}
                                className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700"
                            >
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Front Controls */}
                <div className={`mt-auto ${isGrid ? 'pt-3' : 'w-full'}`} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5">
                        <span>{isInputFocused ? localProgress : book.current} / {book.total} {book.unit === 'PAGES' ? 'pág' : 'cap'}</span>
                        <span>{Math.round(((isInputFocused ? localProgress : book.current) / (book.total || 1)) * 100)}%</span>
                    </div>
                    <ProgressBar current={isInputFocused ? localProgress : book.current} total={book.total} />

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3">
                        {book.status === 'TO_READ' && (
                            <button
                                onClick={() => onUpdateStatus(book.id, 'READING')}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-xs font-medium flex justify-center items-center gap-1 transition-colors"
                            >
                                <Play size={12} fill="currentColor" /> Ler Agora
                            </button>
                        )}

                        {(book.status === 'READING' || book.status === 'PAUSED') && (
                            <>
                                {book.status === 'READING' ? (
                                    <button onClick={() => onUpdateStatus(book.id, 'PAUSED')} className="p-1.5 bg-slate-700 hover:bg-orange-500/20 text-slate-300 hover:text-orange-500 rounded transition-colors" title="Pausar">
                                        <PauseCircle size={16} />
                                    </button>
                                ) : (
                                    <button onClick={() => onUpdateStatus(book.id, 'READING')} className="p-1.5 bg-slate-700 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 rounded transition-colors" title="Retomar">
                                        <Play size={16} />
                                    </button>
                                )}

                                {/* Stepper with debounced input */}
                                <div className="flex-1 flex items-center bg-slate-900 rounded border border-slate-700/50 h-7 overflow-hidden">
                                    <button onClick={() => onUpdateProgress(book.id, -1)} className="px-2 h-full hover:bg-slate-700 text-slate-400 hover:text-white border-r border-slate-800 text-xs">-</button>
                                    <input
                                        type="number"
                                        className="w-full bg-transparent text-center text-xs text-white focus:outline-none appearance-none"
                                        value={localProgress}
                                        onFocus={() => setIsInputFocused(true)}
                                        onChange={(e) => setLocalProgress(Number(e.target.value))}
                                        onBlur={commitProgress}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                    />
                                    <button onClick={() => onUpdateProgress(book.id, 1)} className="px-2 h-full hover:bg-slate-700 text-slate-400 hover:text-white border-l border-slate-800 text-xs">+</button>
                                </div>

                                <button onClick={() => onUpdateStatus(book.id, 'COMPLETED')} className="p-1.5 bg-slate-700 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded transition-colors" title="Concluir">
                                    <CheckCircle2 size={16} />
                                </button>
                            </>
                        )}

                        {book.status === 'COMPLETED' && (
                            <button onClick={() => onUpdateStatus(book.id, 'READING')} className="w-full py-1.5 text-xs text-slate-500 hover:text-indigo-400 font-medium flex items-center justify-center gap-1 bg-slate-900 rounded hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all">
                                Ler Novamente
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Context Menu Portal - Rendered outside card to avoid overflow clipping */}
            {
                showMenu && createPortal(
                    <>
                        {/* Overlay to close menu */}
                        <div className="fixed inset-0 z-[100]" onClick={closeMenu} />
                        <div
                            className="fixed w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-[101]"
                            style={{ left: menuPos.x, top: menuPos.y }}
                        >
                            <button onClick={() => { closeMenu(); onEdit(book); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 text-slate-300 flex items-center gap-2 rounded-md">
                                <Edit2 size={14} /> Editar
                            </button>
                            <button onClick={() => { closeMenu(); onMove(book); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 text-slate-300 flex items-center gap-2 rounded-md">
                                <Move size={14} /> Mover
                            </button>
                            {onPlan && (
                                <button onClick={() => { closeMenu(); onPlan(book); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 text-amber-400 flex items-center gap-2 rounded-md">
                                    <Calendar size={14} /> Ver Plano
                                </button>
                            )}
                            <div className="h-px bg-slate-700 my-1.5"></div>
                            <button onClick={() => { closeMenu(); onDelete(book.id); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-red-900/30 text-red-400 flex items-center gap-2 rounded-md">
                                <Trash2 size={14} /> Remover
                            </button>
                        </div>
                    </>,
                    document.body
                )
            }
        </>
    );
});

DraggableBookCard.displayName = 'DraggableBookCard';

export default DraggableBookCard;
