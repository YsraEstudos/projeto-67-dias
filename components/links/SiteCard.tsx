import React, { useState } from 'react';
import { Globe, ExternalLink, Plus, ChevronDown, ChevronUp, Edit2, Trash2, MoreVertical, GripVertical, Sparkles } from 'lucide-react';
import { Site, LinkItem, Prompt } from '../../types';

interface SiteCardProps {
    site: Site;
    links: LinkItem[];
    sitePrompts?: Prompt[]; // Prompts linked directly to the site
    linkedPromptsMap: Map<string, Prompt[]>;
    isDragging?: boolean;
    onEditSite: (site: Site) => void;
    onDeleteSite: (siteId: string) => void;
    onAddLink: (siteId: string) => void;
    onLinkPrompt: (siteId: string) => void;
    onClickLink: (link: LinkItem) => void;
    onEditLink: (link: LinkItem) => void;
    onDeleteLink: (linkId: string) => void;
    onPreviewPrompt: (promptId: string) => void;
    getFavicon: (url: string) => string;
    formatUrl: (url: string) => string;
    // Drag handlers for site
    onDragStart?: (e: React.DragEvent, site: Site) => void;
    onDragOver?: (e: React.DragEvent, site: Site) => void;
    onDragEnd?: () => void;
}

const SiteCard: React.FC<SiteCardProps> = ({
    site,
    links,
    sitePrompts = [],
    linkedPromptsMap,
    isDragging = false,
    onEditSite,
    onDeleteSite,
    onAddLink,
    onLinkPrompt,
    onClickLink,
    onEditLink,
    onDeleteLink,
    onPreviewPrompt,
    getFavicon,
    formatUrl,
    onDragStart,
    onDragOver,
    onDragEnd
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    const hasMultipleLinks = links.length > 1;
    const primaryLink = links[0];
    const faviconUrl = site.faviconUrl || (primaryLink ? getFavicon(primaryLink.url) : '');

    return (
        <div
            draggable={!!onDragStart}
            onDragStart={onDragStart ? (e) => onDragStart(e, site) : undefined}
            onDragOver={onDragOver ? (e) => { e.preventDefault(); onDragOver(e, site); } : undefined}
            onDragEnd={onDragEnd}
            className={`group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl
                transition-all duration-300 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/30 hover:z-10
                ${isDragging ? 'opacity-50 scale-95' : 'hover:-translate-y-1'}
            `}
        >
            {/* Site Header */}
            <div className="p-4 flex items-start gap-3">
                {/* Drag Handle */}
                {onDragStart && (
                    <div className="pt-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors md:opacity-0 md:group-hover:opacity-100">
                        <GripVertical size={16} />
                    </div>
                )}

                {/* Favicon */}
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-700/50 shrink-0">
                    <img
                        src={faviconUrl}
                        alt=""
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <Globe size={24} className="text-slate-600 hidden" />
                </div>

                {/* Site Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-200 truncate">{site.name}</h3>
                    {site.description && (
                        <p className="text-xs text-slate-500 truncate">{site.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                        {links.length} {links.length === 1 ? 'link' : 'links'}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {hasMultipleLinks && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 min-w-32 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => { onEditSite(site); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> Editar Site
                                </button>
                                <button
                                    onClick={() => { onLinkPrompt(site.id); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Sparkles size={14} /> Vincular Prompt
                                </button>
                                <button
                                    onClick={() => { onAddLink(site.id); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Plus size={14} /> Adicionar Link
                                </button>
                                <hr className="my-1 border-slate-700" />
                                <button
                                    onClick={() => { onDeleteSite(site.id); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Excluir Site
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Site Prompts */}
            {sitePrompts.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {sitePrompts.map(prompt => (
                        <button
                            key={prompt.id}
                            onClick={(e) => { e.stopPropagation(); onPreviewPrompt(prompt.id); }}
                            className="bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/30 text-emerald-400 hover:text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all group/prompt shadow-sm"
                            title={prompt.title}
                        >
                            <Sparkles size={12} className="text-purple-400 group-hover/prompt:text-purple-300" />
                            <span className="max-w-[150px] truncate">{prompt.title}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Links List */}
            {(isExpanded || links.length === 1) && links.length > 0 && (
                <div className="border-t border-slate-700/50">
                    {links.map((link, index) => {
                        const linkedPrompts = linkedPromptsMap.get(link.id) || [];
                        return (
                            <div
                                key={link.id}
                                className={`group/link flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/30 cursor-pointer transition-colors
                                    ${index < links.length - 1 ? 'border-b border-slate-700/30' : ''}
                                    ${index === links.length - 1 ? 'rounded-b-2xl' : ''}
                                `}
                                onClick={() => onClickLink(link)}
                            >
                                <span className="text-sm text-slate-400 flex-1 truncate">
                                    {link.title}
                                </span>

                                {/* Prompts indicator */}
                                {linkedPrompts.length > 0 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                        {linkedPrompts.length}
                                    </span>
                                )}

                                {/* Link actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditLink(link); }}
                                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteLink(link.id); }}
                                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <ExternalLink size={14} className="text-slate-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Link Button (when expanded or no links) */}
            {(isExpanded || links.length === 0) && (
                <button
                    onClick={() => onAddLink(site.id)}
                    className="w-full px-4 py-2 text-sm text-slate-500 hover:text-indigo-400 hover:bg-slate-700/30 
                        border-t border-slate-700/50 flex items-center justify-center gap-1 transition-colors"
                >
                    <Plus size={14} /> Adicionar Link
                </button>
            )}
        </div>
    );
};

export default React.memo(SiteCard);
