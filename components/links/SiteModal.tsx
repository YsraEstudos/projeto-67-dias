import React, { useState, useEffect, useMemo } from 'react';
import { X, Globe, Plus, Trash2, GripVertical, ExternalLink, Sparkles } from 'lucide-react';
import { Site, SiteCategory, LinkItem, Prompt, PromptCategory } from '../../types';
import { siteIcons, siteColorClasses } from './constants';
import MultiPromptSelector from './MultiPromptSelector';

interface SiteModalProps {
    site: Site | null; // null = new site
    categories: SiteCategory[];
    links: LinkItem[]; // Existing links for this site (when editing)
    prompts: Prompt[];
    promptCategories: PromptCategory[];
    defaultCategoryId: string;
    initialOpenPromptSelector?: boolean;
    onClose: () => void;
    onSave: (site: Partial<Site>, newLinks?: Partial<LinkItem>[]) => void;
}

interface NewLinkInput {
    id: string;
    title: string;
    url: string;
}

const SiteModal: React.FC<SiteModalProps> = ({
    site,
    categories,
    links,
    prompts,
    promptCategories,
    defaultCategoryId,
    initialOpenPromptSelector = false,
    onClose,
    onSave
}) => {
    const isEditing = !!site;

    const [name, setName] = useState(site?.name || '');
    const [description, setDescription] = useState(site?.description || '');
    const [categoryId, setCategoryId] = useState(site?.categoryId || defaultCategoryId);
    const [promptIds, setPromptIds] = useState<string[]>(site?.promptIds || []);
    const [newLinks, setNewLinks] = useState<NewLinkInput[]>([]);

    // Modal state for prompt selector
    const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(initialOpenPromptSelector);

    // Get category path for display
    const getCategoryPath = (catId: string): string => {
        const path: string[] = [];
        let current = categories.find(c => c.id === catId);
        while (current) {
            path.unshift(current.name);
            current = current.parentId
                ? categories.find(c => c.id === current!.parentId)
                : undefined;
        }
        return path.join(' › ');
    };

    // Build flat list with indentation for select
    const categoryOptions = useMemo(() => {
        const result: { id: string; label: string; depth: number }[] = [];

        const buildOptions = (parentId: string | null, depth: number) => {
            categories
                .filter(c => c.parentId === parentId)
                .sort((a, b) => a.order - b.order)
                .forEach(cat => {
                    result.push({
                        id: cat.id,
                        label: '  '.repeat(depth) + cat.name,
                        depth
                    });
                    buildOptions(cat.id, depth + 1);
                });
        };

        buildOptions(null, 0);
        return result;
    }, [categories]);

    // Add a new link input
    const addLinkInput = () => {
        setNewLinks([...newLinks, {
            id: `new_${Date.now()}`,
            title: '',
            url: ''
        }]);
    };

    // Update a link input
    const updateLinkInput = (id: string, field: 'title' | 'url', value: string) => {
        setNewLinks(newLinks.map(l =>
            l.id === id ? { ...l, [field]: value } : l
        ));
    };

    // Remove a link input
    const removeLinkInput = (id: string) => {
        setNewLinks(newLinks.filter(l => l.id !== id));
    };

    // Auto-fill title from URL if empty
    const handleUrlBlur = (id: string, url: string) => {
        const link = newLinks.find(l => l.id === id);
        if (link && !link.title && url) {
            try {
                const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
                const title = hostname.replace(/^www\./, '').split('.')[0];
                updateLinkInput(id, 'title', title.charAt(0).toUpperCase() + title.slice(1));
            } catch {
                // Invalid URL, ignore
            }
        }
    };

    // Helper for linked prompts display
    const linkedPrompts = promptIds
        .map(id => prompts.find(p => p.id === id))
        .filter((p): p is Prompt => p !== undefined);

    const removePrompt = (pid: string) => {
        setPromptIds(promptIds.filter(id => id !== pid));
    };

    const handleSave = () => {
        if (!name.trim()) return;

        const siteData: Partial<Site> = {
            id: site?.id || `site_${Date.now()}`,
            name: name.trim(),
            description: description.trim() || undefined,
            categoryId,
            promptIds,
            updatedAt: Date.now(),
            ...(site ? {} : { createdAt: Date.now(), order: 0 })
        };

        // Filter valid new links
        const validNewLinks = newLinks
            .filter(l => l.url.trim())
            .map(l => ({
                title: l.title.trim() || 'Link sem título',
                url: l.url.trim().startsWith('http') ? l.url.trim() : `https://${l.url.trim()}`,
                siteId: siteData.id,
                order: 0,
                clickCount: 0,
                promptIds: []
            }));

        onSave(siteData, validNewLinks.length > 0 ? validNewLinks : undefined);
    };

    // Auto-add first link input on new site
    useEffect(() => {
        if (!isEditing && newLinks.length === 0) {
            addLinkInput();
        }
    }, [isEditing]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Globe size={18} className="text-indigo-400" />
                        {isEditing ? 'Editar Site' : 'Novo Site'}
                    </h3>
                    <button onClick={onClose} aria-label="Fechar modal">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Name */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nome do Site</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            placeholder="Ex: Google, GitHub, Notion..."
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Descrição (opcional)</label>
                        <input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            placeholder="Ex: Ferramentas de produtividade..."
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Categoria</label>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                        >
                            {categoryOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {categoryId && (
                            <p className="text-xs text-slate-500 mt-1">
                                Caminho: {getCategoryPath(categoryId)}
                            </p>
                        )}
                    </div>

                    {/* PROMPT LINKING SECTION */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                            <Sparkles size={12} className="text-purple-400" /> Prompts Vinculados ao Site (opcional)
                        </label>

                        {/* Linked Prompts as Chips */}
                        {linkedPrompts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {linkedPrompts.map(prompt => (
                                    <div
                                        key={prompt.id}
                                        className="bg-purple-900/30 border border-purple-700/50 rounded-lg px-3 py-1.5 flex items-center gap-2 group"
                                    >
                                        <Sparkles size={12} className="text-purple-400" />
                                        <span className="text-sm text-purple-300">{prompt.title}</span>
                                        <button
                                            onClick={() => removePrompt(prompt.id)}
                                            className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
                                            title="Remover prompt"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Prompts Button */}
                        <button
                            onClick={() => setIsPromptSelectorOpen(true)}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-700 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-purple-400 text-sm flex items-center justify-center gap-2 transition-all"
                        >
                            <Sparkles size={16} />
                            {linkedPrompts.length === 0 ? 'Vincular Prompts' : 'Adicionar mais prompts'}
                        </button>
                    </div>

                    {/* Existing Links (when editing) */}
                    {isEditing && links.length > 0 && (
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Links Existentes</label>
                            <div className="space-y-2 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                                {links.map(link => (
                                    <div key={link.id} className="flex items-center gap-2 text-sm">
                                        <ExternalLink size={14} className="text-slate-500 shrink-0" />
                                        <span className="text-slate-300 truncate flex-1">{link.title}</span>
                                        <span className="text-slate-500 text-xs truncate max-w-32">{link.url}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Edite os links individualmente nos cards.</p>
                        </div>
                    )}

                    {/* New Links */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">
                            {isEditing ? 'Adicionar Novos Links' : 'Links'}
                        </label>
                        <div className="space-y-3">
                            {newLinks.map((link, index) => (
                                <div key={link.id} className="flex items-start gap-2 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            value={link.url}
                                            onChange={e => updateLinkInput(link.id, 'url', e.target.value)}
                                            onBlur={e => handleUrlBlur(link.id, e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                            placeholder="https://..."
                                        />
                                        <input
                                            value={link.title}
                                            onChange={e => updateLinkInput(link.id, 'title', e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white focus:border-indigo-500 outline-none"
                                            placeholder="Título do link (auto-preenchido)"
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeLinkInput(link.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addLinkInput}
                                className="w-full py-2 text-sm text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50 rounded-lg border border-dashed border-slate-600 transition-colors flex items-center justify-center gap-1"
                            >
                                <Plus size={16} /> Adicionar Link
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={!name.trim()}
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors"
                    >
                        {isEditing ? 'Salvar' : 'Criar Site'}
                    </button>
                </div>
            </div>

            {/* MULTI-PROMPT SELECTOR MODAL */}
            {isPromptSelectorOpen && (
                <MultiPromptSelector
                    prompts={prompts}
                    categories={promptCategories}
                    selectedIds={promptIds}
                    onClose={() => setIsPromptSelectorOpen(false)}
                    onSave={(ids) => {
                        setPromptIds(ids);
                        setIsPromptSelectorOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default SiteModal;
