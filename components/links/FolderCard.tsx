import React, { useState } from 'react';
import { Folder, FolderOpen, ExternalLink, Plus, ChevronDown, ChevronUp, Edit2, Trash2, MoreVertical, GripVertical } from 'lucide-react';
import { SiteFolder, LinkItem, Prompt } from '../../types';
import { siteColorClasses } from './constants';

interface FolderCardProps {
    folder: SiteFolder;
    links: LinkItem[];
    linkedPromptsMap: Map<string, Prompt[]>;
    isDragging?: boolean;
    onEditFolder: (folder: SiteFolder) => void;
    onDeleteFolder: (folderId: string) => void;
    onAddLinkToFolder: (siteId: string, folderId: string) => void;
    onClickLink: (link: LinkItem) => void;
    onEditLink: (link: LinkItem) => void;
    onDeleteLink: (linkId: string) => void;
    onToggleCollapse: (folderId: string) => void;
    onPreviewPrompt: (promptId: string) => void;
    getFavicon: (url: string) => string;
    formatUrl: (url: string) => string;
    // Drag handlers for folder
    onDragStart?: (e: React.DragEvent, folder: SiteFolder) => void;
    onDragOver?: (e: React.DragEvent, folder: SiteFolder) => void;
    onDragEnd?: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
    folder,
    links,
    linkedPromptsMap,
    isDragging = false,
    onEditFolder,
    onDeleteFolder,
    onAddLinkToFolder,
    onClickLink,
    onEditLink,
    onDeleteLink,
    onToggleCollapse,
    onPreviewPrompt,
    getFavicon,
    formatUrl,
    onDragStart,
    onDragOver,
    onDragEnd
}) => {
    const [menuOpen, setMenuOpen] = useState(false);

    // Use folder color or default to indigo
    const colorConfig = siteColorClasses[folder.color || 'indigo'] || siteColorClasses.indigo;
    const isExpanded = !folder.isCollapsed;

    return (
        <div
            draggable={!!onDragStart}
            onDragStart={onDragStart ? (e) => onDragStart(e, folder) : undefined}
            onDragOver={onDragOver ? (e) => { e.preventDefault(); onDragOver(e, folder); } : undefined}
            onDragEnd={onDragEnd}
            className={`group relative bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-2xl
                overflow-hidden transition-all duration-300 hover:border-slate-600/50 
                ${isDragging ? 'opacity-50 scale-95' : ''}
            `}
        >
            {/* Folder Header */}
            <div className={`p-3 flex items-center gap-3 ${isExpanded ? 'bg-slate-800/40' : ''}`}>
                {/* Drag Handle */}
                {onDragStart && (
                    <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors md:opacity-0 md:group-hover:opacity-100">
                        <GripVertical size={14} />
                    </div>
                )}

                {/* Folder Icon */}
                <div className={`p-2 rounded-lg bg-slate-900 border border-slate-700/50 ${colorConfig.text}`}>
                    {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
                </div>

                {/* Folder Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggleCollapse(folder.id)}>
                    <h4 className="font-bold text-slate-300 text-sm truncate">{folder.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {links.length} {links.length === 1 ? 'link' : 'links'}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onToggleCollapse(folder.id)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <MoreVertical size={14} />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-32 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => { onEditFolder(folder); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Edit2 size={12} /> Editar Pasta
                                </button>
                                <button
                                    onClick={() => { onAddLinkToFolder(folder.siteId, folder.id); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Plus size={12} /> Adicionar Link
                                </button>
                                <hr className="my-1 border-slate-700" />
                                <button
                                    onClick={() => { if (confirm(`Excluir pasta "${folder.name}"? Links marcados com ela voltarão para a raiz do site.`)) onDeleteFolder(folder.id); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Trash2 size={12} /> Excluir Pasta
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Links List */}
            {isExpanded && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    {links.length > 0 ? (
                        <div className="divide-y divide-slate-700/30">
                            {links.map((link) => {
                                const linkedPrompts = linkedPromptsMap.get(link.id) || [];
                                return (
                                    <div
                                        key={link.id}
                                        className="group/link flex items-center gap-3 px-4 py-2 hover:bg-slate-700/20 cursor-pointer transition-colors"
                                        onClick={() => onClickLink(link)}
                                    >
                                        <div className="w-1 h-1 rounded-full bg-slate-600 group-hover/link:bg-indigo-500 transition-colors" />
                                        <span className="text-xs text-slate-400 flex-1 truncate">
                                            {link.title}
                                        </span>

                                        {/* Prompts indicator */}
                                        {linkedPrompts.length > 0 && (
                                            <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-400">
                                                {linkedPrompts.length}
                                            </span>
                                        )}

                                        {/* Link actions */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditLink(link); }}
                                                className="p-1 text-slate-500 hover:text-white hover:bg-slate-600 rounded transition-colors"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteLink(link.id); }}
                                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                            <ExternalLink size={12} className="text-slate-600" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-[10px] text-slate-600 italic">Pasta vazia</p>
                            <button
                                onClick={() => onAddLinkToFolder(folder.siteId, folder.id)}
                                className="mt-1 text-[10px] text-indigo-400 hover:underline"
                            >
                                Adicionar link
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(FolderCard);
