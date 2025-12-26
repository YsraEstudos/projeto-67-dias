import React, { useState, useRef, useEffect } from 'react';
import { Globe, ExternalLink, GripVertical, Edit2, Trash2, MousePointerClick, Sparkles } from 'lucide-react';
import { LinkItem, Prompt } from '../../types';

interface LinkCardProps {
    link: LinkItem;
    isDragging: boolean;
    getFavicon: (url: string) => string;
    onDragStart: (e: React.DragEvent, item: LinkItem) => void;
    onDragOver: (e: React.DragEvent, item: LinkItem) => void;
    onDragEnd: () => void;
    onClick: (link: LinkItem) => void;
    onEdit: (link: LinkItem) => void;
    onDelete: (id: string) => void;
    onPreviewPrompt: (id: string) => void;
    linkedPrompts: Prompt[]; // Array of linked prompts (replaces hasLinkedPrompt)
    formatUrl: (url: string) => string;
    categoryName?: string; // Optional category name for display in 'All' view
}

const LinkCard = React.memo<LinkCardProps>(({
    link,
    isDragging,
    getFavicon,
    onDragStart,
    onDragOver,
    onDragEnd,
    onClick,
    onEdit,
    onDelete,
    onPreviewPrompt,
    linkedPrompts,
    formatUrl,
    categoryName
}) => {
    const [showPromptMenu, setShowPromptMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowPromptMenu(false);
            }
        };
        if (showPromptMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPromptMenu]);

    const handlePromptButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (linkedPrompts.length === 1) {
            // Single prompt: open directly
            onPreviewPrompt(linkedPrompts[0].id);
        } else if (linkedPrompts.length > 1) {
            // Multiple prompts: toggle popover
            setShowPromptMenu(!showPromptMenu);
        }
    };

    const handleSelectPrompt = (promptId: string) => {
        setShowPromptMenu(false);
        onPreviewPrompt(promptId);
    };

    const hasLinkedPrompts = linkedPrompts.length > 0;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, link)}
            onDragOver={(e) => onDragOver(e, link)}
            onDragEnd={onDragEnd}
            className={`group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer active:cursor-grabbing ${isDragging ? 'opacity-50 border-dashed border-indigo-500' : ''}`}
            onClick={() => onClick(link)}
        >
            {/* Icon / Favicon */}
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-700/50 shrink-0">
                <img
                    src={getFavicon(link.url)}
                    alt=""
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                />
                <Globe size={24} className="text-slate-600 hidden" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-slate-200 truncate">{link.title}</h3>
                    {categoryName && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-medium shrink-0">
                            {categoryName}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    {(() => { try { return new URL(formatUrl(link.url)).hostname.replace('www.', ''); } catch { return link.url; } })()}
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                {link.clickCount > 0 && (
                    <div className="text-[10px] text-indigo-400/60 mt-1 flex items-center gap-1">
                        <MousePointerClick size={10} /> {link.clickCount} acessos
                    </div>
                )}
            </div>

            {/* Drag Handle */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-white" onClick={e => e.stopPropagation()}>
                <GripVertical size={16} />
            </div>

            {/* Menu Button */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <div className="flex gap-1">
                    {/* Prompt Button with Popover */}
                    {hasLinkedPrompts && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={handlePromptButtonClick}
                                title={linkedPrompts.length === 1 ? "Ver prompt vinculado" : `Ver ${linkedPrompts.length} prompts vinculados`}
                                className="p-1.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg transition-colors border border-purple-500 relative"
                            >
                                <Sparkles size={14} />
                                {/* Badge for multiple prompts */}
                                {linkedPrompts.length > 1 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-purple-400 text-[10px] font-bold text-purple-900 rounded-full flex items-center justify-center border border-purple-300">
                                        {linkedPrompts.length}
                                    </span>
                                )}
                            </button>

                            {/* Popover Menu for Multiple Prompts */}
                            {showPromptMenu && linkedPrompts.length > 1 && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="p-2 border-b border-slate-700">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Prompts Vinculados</span>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {linkedPrompts.map((prompt) => (
                                            <button
                                                key={prompt.id}
                                                onClick={(e) => { e.stopPropagation(); handleSelectPrompt(prompt.id); }}
                                                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-purple-600/30 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <Sparkles size={12} className="text-purple-400 shrink-0" />
                                                <span className="truncate">{prompt.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onEdit(link); }} title="Editar link" className="p-1.5 bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(link.id); }} title="Excluir link" className="p-1.5 bg-slate-900 hover:bg-red-600 hover:text-white text-slate-400 rounded-lg transition-colors border border-slate-700">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.link.id === next.link.id &&
        prev.link.title === next.link.title &&
        prev.link.url === next.link.url &&
        prev.link.clickCount === next.link.clickCount &&
        prev.link.order === next.link.order &&
        prev.link.categoryId === next.link.categoryId &&
        prev.link.promptIds.length === next.link.promptIds.length &&
        prev.link.promptIds.every((id, i) => id === next.link.promptIds[i]) &&
        prev.isDragging === next.isDragging &&
        prev.linkedPrompts.length === next.linkedPrompts.length &&
        prev.linkedPrompts.every((p, i) => p.id === next.linkedPrompts[i]?.id);
});

export default LinkCard;

