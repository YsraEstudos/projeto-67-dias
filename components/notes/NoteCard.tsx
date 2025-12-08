import React from 'react';
import { Sparkles, MoreVertical, Trash2, Copy, Download } from 'lucide-react';
import { Note, Tag } from '../../types';

interface NoteCardProps {
    note: Note;
    onClick: () => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    availableTags?: Tag[];
}

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; hover: string }> = {
    amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-400', hover: 'hover:border-amber-500/40' },
    rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400', hover: 'hover:border-rose-500/40' },
    emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', hover: 'hover:border-emerald-500/40' },
    blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', hover: 'hover:border-blue-500/40' },
    purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-400', hover: 'hover:border-purple-500/40' },
    cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-400', hover: 'hover:border-cyan-500/40' },
    pink: { bg: 'bg-pink-500/5', border: 'border-pink-500/20', text: 'text-pink-400', hover: 'hover:border-pink-500/40' },
    orange: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', hover: 'hover:border-orange-500/40' },
};

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onDelete, onDuplicate, availableTags = [] }) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const colorScheme = COLOR_CLASSES[note.color] || COLOR_CLASSES.blue;

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja deletar esta nota?')) {
            onDelete(note.id);
        }
        setShowMenu(false);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDuplicate(note.id);
        setShowMenu(false);
    };

    const handleExport = (e: React.MouseEvent) => {
        e.stopPropagation();
        const blob = new Blob([`# ${note.title}\n\n${note.content}\n\nTags: ${note.tags.join(', ')}`], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowMenu(false);
    };

    return (
        <div
            onClick={onClick}
            className={`relative group cursor-pointer rounded-xl border-2 ${colorScheme.border} ${colorScheme.bg} ${colorScheme.hover} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden animate-in fade-in slide-in-from-bottom-2`}
        >
            {/* Top Color Bar */}
            <div className={`h-1.5 w-full ${colorScheme.text.replace('text-', 'bg-')}`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{note.title || 'Sem título'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(note.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* AI Badge */}
                    {note.aiProcessed && (
                        <div className="flex-shrink-0 p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20" title="Processada por IA">
                            <Sparkles size={14} className="text-purple-400" />
                        </div>
                    )}

                    {/* Menu Button */}
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={handleMenuClick}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-8 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <button onClick={handleDuplicate} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 w-full text-left">
                                    <Copy size={14} /> Duplicar
                                </button>
                                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 w-full text-left">
                                    <Download size={14} /> Exportar
                                </button>
                                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 w-full text-left">
                                    <Trash2 size={14} /> Deletar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Preview */}
                <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {note.content || 'Nota vazia...'}
                </p>

                {/* Tags */}
                {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {note.tags.slice(0, 3).map((tagStr, idx) => {
                            // Resolve tag
                            const smartTag = availableTags.find(t => t.id === tagStr);
                            const smartTagByName = availableTags.find(t => t.label.toLowerCase() === tagStr.toLowerCase());

                            const displayLabel = smartTag?.label || smartTagByName?.label || tagStr;
                            const isSmart = !!(smartTag || smartTagByName);
                            const smartColor = smartTag?.color || smartTagByName?.color;

                            return (
                                <span
                                    key={idx}
                                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${isSmart
                                            ? `${smartColor} text-white border-white/20`
                                            : `${colorScheme.border} ${colorScheme.text}`
                                        }`}
                                >
                                    {displayLabel}
                                </span>
                            );
                        })}
                        {note.tags.length > 3 && (
                            <span className="text-xs px-2 py-0.5 text-slate-500">+{note.tags.length - 3}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
