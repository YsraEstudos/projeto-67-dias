import React from 'react';
import { MoreVertical, Trash2, Copy, Download, Pin } from 'lucide-react';
import { Note, Tag } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { sanitizeFilename } from '../../utils/sanitizeFilename';
import { stripMarkdown } from '../../utils/markdownPreview';

interface NoteCardProps {
    note: Note;
    onClick: (note: Note) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onTogglePin: (id: string) => void;
    tagMap?: Record<string, Tag>;
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

export const NoteCard: React.FC<NoteCardProps> = React.memo(({ note, onClick, onDelete, onDuplicate, onTogglePin, tagMap = {} }) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const cardRef = React.useRef<HTMLDivElement>(null);
    const colorScheme = COLOR_CLASSES[note.color] || COLOR_CLASSES.blue;

    // Close menu when clicking/right-clicking outside this card
    React.useEffect(() => {
        if (!showMenu) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };

        // Use capture phase to ensure we catch the event before other handlers
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('contextmenu', handleClickOutside, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('contextmenu', handleClickOutside, true);
        };
    }, [showMenu]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(true);
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
        a.download = `${sanitizeFilename(note.title)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowMenu(false);
    };

    // Get pinned tags labels - memoized for performance
    const pinnedTagLabels = React.useMemo(() =>
        (note.pinnedToTags || []).map(tagId => {
            const tag = tagMap[tagId];
            return tag ? tag.label : tagId;
        }).filter(Boolean),
        [note.pinnedToTags, tagMap]
    );

    return (
        <div
            ref={cardRef}
            onClick={() => onClick(note)}
            onContextMenu={handleContextMenu}
            className={`relative group cursor-pointer rounded-xl border-2 ${colorScheme.border} ${colorScheme.bg} ${colorScheme.hover} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2 aspect-square md:aspect-auto overflow-hidden flex flex-col`}
        >
            {/* Top Color Bar */}
            <div className={`h-1.5 w-full ${colorScheme.text.replace('text-', 'bg-')}`} />

            {/* Action Buttons - Top Right */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                {/* Menu Button (3 dots) */}
                <button
                    onClick={handleMenuClick}
                    className={`p-1.5 rounded-lg border transition-all bg-slate-800/50 border-slate-700/50 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white hover:border-slate-600`}
                    title="Opções"
                >
                    <MoreVertical size={14} />
                </button>

                {/* Pin Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
                    className={`p-1.5 rounded-lg border transition-all ${note.isPinned
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:border-amber-500/30'
                        }`}
                    title={note.isPinned ? `Desafixar (fixada em: ${pinnedTagLabels.join(', ') || 'Geral'})` : 'Fixar'}
                >
                    <Pin size={14} className={note.isPinned ? 'fill-current' : ''} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {showMenu && (
                <>
                    {/* Overlay to close menu on outside click */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                    />
                    <div className="absolute right-3 top-12 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                </>
            )}

            <div className="p-3 md:p-5 flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-lg font-bold text-white truncate">{note.title || 'Sem título'}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="shrink-0">
                                {new Date(note.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                            {note.isPinned && pinnedTagLabels.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="text-amber-400/70 truncate">📌 {pinnedTagLabels.slice(0, 2).join(', ')}{pinnedTagLabels.length > 2 ? '...' : ''}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Preview - Lightweight */}
                <div className="text-xs md:text-sm text-slate-300 line-clamp-2 md:line-clamp-3 leading-relaxed mb-2 md:mb-4 overflow-hidden flex-1">
                    {note.content ? (
                        stripMarkdown(note.content)
                    ) : (
                        <span className="text-slate-500 italic">Nota vazia...</span>
                    )}
                </div>

                {/* Tags */}
                {note.tags.length > 0 && (
                    <div className="hidden md:flex flex-wrap gap-1.5 mt-auto">
                        {note.tags.slice(0, 3).map((tagId, idx) => {
                            // Resolve tag using map
                            const tag = tagMap[tagId];
                            const displayLabel = tag?.label || tagId;
                            const smartColor = tag?.color || 'bg-slate-700';

                            return (
                                <span
                                    key={idx}
                                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tag
                                        ? `${smartColor} text-white border-white/20`
                                        : `bg-slate-700/50 text-slate-400 border-slate-700`
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
});

NoteCard.displayName = 'NoteCard';

