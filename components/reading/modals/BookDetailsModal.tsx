import React from 'react';
import { Book as IBook } from '../../../types';
import { X, Book, BookOpen, Calendar, Star, StickyNote, Edit2 } from 'lucide-react';
import ProgressBar from '../ProgressBar';

interface BookDetailsModalProps {
    book: IBook;
    onClose: () => void;
    onEdit: () => void;
}

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({ book, onClose, onEdit }) => {
    const percentage = Math.round((book.current / (book.total || 1)) * 100);

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
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute -bottom-12 left-6 sm:left-8 flex items-end gap-6 w-full pr-6">
                        {/* Cover Card */}
                        <div className="w-32 h-48 sm:w-40 sm:h-60 bg-slate-800 rounded-lg shadow-2xl shadow-black/50 border-4 border-slate-900 overflow-hidden flex-shrink-0 relative z-10">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800"><Book size={48} /></div>
                            )}
                        </div>

                        {/* Title Info (Desktop) */}
                        <div className="hidden sm:block pb-14 text-shadow-sm flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold bg-indigo-500 text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                                    {book.genre || 'Geral'}
                                </span>
                                {book.status === 'COMPLETED' && <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">Lido</span>}
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
                            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Progresso Atual</span>
                                        <div className="text-2xl font-bold text-white mt-0.5">
                                            {percentage}% <span className="text-sm text-slate-500 font-normal">concluído</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm text-indigo-400 font-mono">{book.current}</span>
                                        <span className="text-xs text-slate-600"> / {book.total}</span>
                                    </div>
                                </div>
                                <ProgressBar current={book.current} total={book.total} />
                                <div className="mt-3 flex gap-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded"><BookOpen size={12} /> {book.unit === 'PAGES' ? 'Páginas' : 'Capítulos'}</span>
                                    {book.addedAt && (
                                        <span className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded"><Calendar size={12} /> Adicionado em {new Date(book.addedAt).toLocaleDateString('pt-BR')}</span>
                                    )}
                                </div>
                            </div>

                            {/* Rating if exists */}
                            {book.rating > 0 && (
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={20}
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
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-900/20"
                    >
                        Fechar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BookDetailsModal;
