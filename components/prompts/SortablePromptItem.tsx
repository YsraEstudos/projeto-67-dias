import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Copy, Check, ChevronDown, Star, StarOff, GripVertical, Image as ImageIcon
} from 'lucide-react';
import { Prompt, PromptCategory } from '../../types';
import { colorClasses, categoryIcons } from './constants';

interface SortablePromptItemProps {
    prompt: Prompt;
    isExpanded: boolean;
    isCopied: boolean;
    category: PromptCategory | undefined;
    onToggleExpand: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onCopyClick: (prompt: Prompt) => void;
    onEdit: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
    renderContent: (prompt: Prompt) => React.ReactNode;
}

const SortablePromptItem: React.FC<SortablePromptItemProps> = ({
    prompt,
    isExpanded,
    isCopied,
    category,
    onToggleExpand,
    onToggleFavorite,
    onCopyClick,
    renderContent
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: prompt.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    const colors = colorClasses[category?.color || 'slate'];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-xl shadow-purple-900/10' : 'hover:border-slate-600'
                } ${isDragging ? 'shadow-2xl ring-2 ring-purple-500/50' : ''}`}
        >
            {/* Header */}
            <div className="p-4 flex items-center gap-3 group">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 transition-colors touch-none"
                    title="Arraste para reordenar"
                >
                    <GripVertical size={18} />
                </div>

                {/* Clickable area for expand */}
                <div
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                    onClick={() => onToggleExpand(prompt.id)}
                >
                    {/* Category Badge */}
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${colors.badge}`}>
                        {categoryIcons[category?.icon || 'default']}
                        {category?.name || 'Geral'}
                    </div>

                    {/* Title */}
                    <h4 className="flex-1 font-semibold text-white truncate">{prompt.title}</h4>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                        {prompt.images.length > 0 && (
                            <span className="flex items-center gap-1">
                                <ImageIcon size={12} /> {prompt.images.length}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Copy size={12} /> {prompt.copyCount}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => onToggleFavorite(prompt.id)}
                        aria-label={prompt.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        className={`p-2 rounded-lg transition-colors ${prompt.isFavorite
                                ? 'text-amber-400 bg-amber-500/10'
                                : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700'
                            }`}
                    >
                        {prompt.isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                    </button>
                    <button
                        onClick={() => onCopyClick(prompt)}
                        aria-label={isCopied ? 'Prompt copiado' : 'Copiar prompt'}
                        className={`p-2 rounded-lg transition-all ${isCopied
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-slate-500 hover:text-white hover:bg-slate-700'
                            }`}
                        title="Copiar prompt"
                    >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>

                {/* Expand Icon */}
                <div
                    className={`p-1 text-slate-500 transition-transform duration-300 cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
                    onClick={() => onToggleExpand(prompt.id)}
                >
                    <ChevronDown size={20} />
                </div>
            </div>

            {/* Expandable Content */}
            <div
                className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
            >
                <div className="overflow-hidden">
                    {renderContent(prompt)}
                </div>
            </div>
        </div>
    );
};

export default React.memo(SortablePromptItem);
