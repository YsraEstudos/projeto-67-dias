import React, { useState, useMemo } from 'react';
import { X, Globe, Sparkles, ArrowUpRight, Folder } from 'lucide-react';
import { LinkItem, Prompt, PromptCategory, SiteCategory, SiteFolder, Site } from '../../types';
import MultiPromptSelector from './MultiPromptSelector';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';

interface LinkModalProps {
    link: LinkItem | null;
    prompts: Prompt[];
    promptCategories: PromptCategory[];
    siteCategories: SiteCategory[];
    sites: Site[];
    folders: SiteFolder[];
    defaultSiteId?: string;
    defaultFolderId?: string | null;
    onClose: () => void;
    onSave: (data: Partial<LinkItem>) => void;
}

const LinkModal: React.FC<LinkModalProps> = ({ link, prompts, promptCategories, siteCategories, sites, folders, defaultSiteId, defaultFolderId, onClose, onSave }) => {
    const [formData, setFormData] = useState<{ title: string; url: string; siteId: string; folderId: string | null; promptIds: string[] }>({
        title: link?.title || '',
        url: link?.url || '',
        siteId: link?.siteId || defaultSiteId || (sites.length > 0 ? sites[0].id : ''),
        folderId: link?.folderId ?? defaultFolderId ?? null,
        promptIds: link?.promptIds || []
    });
    const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Memoize initial values for comparison
    const initialValues = useMemo(() => ({
        title: link?.title || '',
        url: link?.url || '',
        siteId: link?.siteId || defaultSiteId || (sites.length > 0 ? sites[0].id : ''),
        folderId: link?.folderId ?? defaultFolderId ?? null,
        promptIds: link?.promptIds || [],
    }), [link, sites, defaultSiteId, defaultFolderId]);

    // Get folders for the selected site
    const siteFolders = useMemo(() =>
        folders.filter(f => f.siteId === formData.siteId).sort((a, b) => a.order - b.order),
        [folders, formData.siteId]
    );

    // Track unsaved changes
    const { hasChanges } = useUnsavedChanges({
        initialValue: initialValues,
        currentValue: formData,
    });


    // Intercept close to check for unsaved changes
    const handleClose = () => {
        if (hasChanges) {
            setShowUnsavedModal(true);
        } else {
            onClose();
        }
    };

    // Get linked prompts data for display
    const linkedPrompts = formData.promptIds
        .map(id => prompts.find(p => p.id === id))
        .filter((p): p is Prompt => p !== undefined);

    const removePrompt = (promptId: string) => {
        setFormData({ ...formData, promptIds: formData.promptIds.filter(id => id !== promptId) });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                {/* Clickable backdrop */}
                <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
                <div className="relative bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                        <h3 className="font-bold text-white">{link ? 'Editar Link' : 'Novo Link'}</h3>
                        <button onClick={handleClose} title="Fechar"><X className="text-slate-400 hover:text-white" size={20} /></button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Título do Site</label>
                            <input
                                autoFocus
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                placeholder="Ex: Github"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">URL (Endereço)</label>
                            <div className="relative">
                                <input
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:border-indigo-500 outline-none font-mono text-sm"
                                    placeholder="google.com"
                                />
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Site</label>
                            <select
                                value={formData.siteId}
                                onChange={(e) => setFormData({ ...formData, siteId: e.target.value, folderId: null })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                            >
                                {sites.map(site => (
                                    <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                            </select>
                        </div>
                        {siteFolders.length > 0 && (
                            <div>
                                <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                                    <Folder size={12} className="text-indigo-400" /> Pasta (opcional)
                                </label>
                                <select
                                    value={formData.folderId || ''}
                                    onChange={(e) => setFormData({ ...formData, folderId: e.target.value || null })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Raiz do Site</option>
                                    {siteFolders.map(folder => (
                                        <option key={folder.id} value={folder.id}>📁 {folder.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* PROMPT LINKING SECTION */}
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                                <Sparkles size={12} className="text-purple-400" /> Prompts Vinculados (opcional)
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
                    </div>

                    <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                        <button onClick={handleClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                        <button
                            disabled={!formData.title || !formData.url}
                            onClick={() => onSave(formData)}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                        >
                            <ArrowUpRight size={18} /> Salvar
                        </button>
                    </div>
                </div>
            </div>

            {/* MULTI-PROMPT SELECTOR MODAL */}
            {isPromptSelectorOpen && (
                <MultiPromptSelector
                    prompts={prompts}
                    categories={promptCategories}
                    selectedIds={formData.promptIds}
                    onClose={() => setIsPromptSelectorOpen(false)}
                    onSave={(ids) => {
                        setFormData({ ...formData, promptIds: ids });
                        setIsPromptSelectorOpen(false);
                    }}
                />
            )}

            {/* Unsaved Changes Confirmation Modal */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onSave={() => {
                    setShowUnsavedModal(false);
                    onSave(formData);
                }}
                onDiscard={() => {
                    setShowUnsavedModal(false);
                    onClose();
                }}
                onCancel={() => setShowUnsavedModal(false)}
            />
        </>
    );
};

export default LinkModal;
