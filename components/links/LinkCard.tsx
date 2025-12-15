import React from 'react';
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
    hasLinkedPrompt: boolean;
    formatUrl: (url: string) => string;
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
    hasLinkedPrompt,
    formatUrl
}) => {
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
                <h3 className="font-bold text-slate-200 truncate">{link.title}</h3>
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
                    {/* Prompt Badge */}
                    {hasLinkedPrompt && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPreviewPrompt(link.promptId!); }}
                            title="Ver prompt vinculado"
                            className="p-1.5 bg-purple-600/80 hover:bg-purple-500 text-white rounded-lg transition-colors border border-purple-500"
                        >
                            <Sparkles size={14} />
                        </button>
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
        prev.link.category === next.link.category &&
        prev.link.promptId === next.link.promptId &&
        prev.isDragging === next.isDragging &&
        prev.hasLinkedPrompt === next.hasLinkedPrompt;
});

export default LinkCard;
