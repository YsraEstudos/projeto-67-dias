import React, { useState } from 'react';
import { Plus, Link as LinkIcon, Trash2, Youtube, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { SkillResource, Prompt, PromptCategory } from '../../types';
import { PromptSelectorModal } from './PromptSelectorModal';
import { PromptPreviewModal } from './PromptPreviewModal';

interface ResourcesVaultProps {
    resources: SkillResource[];
    prompts: Prompt[];
    promptCategories: PromptCategory[];
    onAdd: (resource: SkillResource) => void;
    onRemove: (id: string) => void;
}

/**
 * Extracts domain from URL for display purposes.
 */
const extractDomain = (url: string): string => {
    return url.replace(/^https?:\/\//, '').split('/')[0];
};

/**
 * Determines resource type based on URL content.
 */
const getResourceType = (url: string): SkillResource['type'] => {
    return url.includes('youtube') ? 'VIDEO' : 'OTHER';
};

/**
 * Resources vault component for managing skill learning resources/links.
 * Now supports linking prompts from the user's prompt library.
 */
export const ResourcesVault: React.FC<ResourcesVaultProps> = ({
    resources,
    prompts,
    promptCategories,
    onAdd,
    onRemove
}) => {
    const [newResourceUrl, setNewResourceUrl] = useState('');
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [previewPromptId, setPreviewPromptId] = useState<string | null>(null);

    // Get prompt IDs that are already linked
    const linkedPromptIds = resources
        .filter(r => r.type === 'PROMPT' && r.promptId)
        .map(r => r.promptId!);

    const handleAddResource = () => {
        if (!newResourceUrl.trim()) return;

        const newResource: SkillResource = {
            id: Date.now().toString(),
            title: extractDomain(newResourceUrl),
            url: newResourceUrl,
            type: getResourceType(newResourceUrl)
        };

        onAdd(newResource);
        setNewResourceUrl('');
    };

    const handleLinkPrompt = (prompt: Prompt) => {
        const newResource: SkillResource = {
            id: Date.now().toString(),
            title: prompt.title,
            url: '', // No URL for prompts
            type: 'PROMPT',
            promptId: prompt.id
        };

        onAdd(newResource);
        setIsSelectorOpen(false);
    };

    const handleResourceClick = (resource: SkillResource) => {
        if (resource.type === 'PROMPT' && resource.promptId) {
            setPreviewPromptId(resource.promptId);
        }
    };

    const getPromptById = (promptId: string) => prompts.find(p => p.id === promptId);
    const getCategoryById = (catId: string) => promptCategories.find(c => c.id === catId);

    const previewPrompt = previewPromptId ? getPromptById(previewPromptId) : null;
    const previewCategory = previewPrompt ? getCategoryById(previewPrompt.category) : undefined;

    const getResourceIcon = (resource: SkillResource) => {
        switch (resource.type) {
            case 'VIDEO':
                return <Youtube size={16} />;
            case 'PROMPT':
                return <Sparkles size={16} className="text-purple-400" />;
            default:
                return <FileText size={16} />;
        }
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <LinkIcon size={18} className="text-blue-400" /> Cofre de Recursos
            </h3>

            {/* Input Row */}
            <div className="flex gap-2 mb-3">
                <input
                    value={newResourceUrl}
                    onChange={e => setNewResourceUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddResource()}
                    placeholder="Cole um link aqui..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                />
                <button
                    onClick={handleAddResource}
                    className="bg-slate-700 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="Adicionar link"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Link Prompt Button */}
            <button
                onClick={() => setIsSelectorOpen(true)}
                className="w-full mb-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
                <Sparkles size={16} /> Linkar Prompt
            </button>

            {/* Resources List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {resources.map(res => {
                    const isPrompt = res.type === 'PROMPT';
                    const linkedPrompt = isPrompt && res.promptId ? getPromptById(res.promptId) : null;
                    const isPromptMissing = isPrompt && !linkedPrompt;

                    return (
                        <div
                            key={res.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border group transition-all ${isPrompt
                                    ? isPromptMissing
                                        ? 'bg-red-900/20 border-red-800/50'
                                        : 'bg-purple-900/20 border-purple-800/50 hover:border-purple-600 cursor-pointer'
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'
                                }`}
                            onClick={() => isPrompt && !isPromptMissing && handleResourceClick(res)}
                        >
                            <div className={`p-2 rounded-lg ${isPrompt
                                    ? isPromptMissing
                                        ? 'bg-red-900/30 text-red-400'
                                        : 'bg-purple-900/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                {isPromptMissing ? <AlertCircle size={16} /> : getResourceIcon(res)}
                            </div>
                            <div className="flex-1 min-w-0">
                                {isPrompt ? (
                                    <span className={`text-sm truncate block font-medium ${isPromptMissing ? 'text-red-400' : 'text-purple-400'
                                        }`}>
                                        {isPromptMissing ? 'Prompt removido' : linkedPrompt?.title || res.title}
                                    </span>
                                ) : (
                                    <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-blue-400 hover:underline truncate block font-medium"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {res.title || res.url}
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(res.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    );
                })}
                {resources.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">Nenhum link salvo.</p>
                )}
            </div>

            {/* Prompt Selector Modal */}
            {isSelectorOpen && (
                <PromptSelectorModal
                    prompts={prompts}
                    categories={promptCategories}
                    excludeIds={linkedPromptIds}
                    onSelect={handleLinkPrompt}
                    onClose={() => setIsSelectorOpen(false)}
                />
            )}

            {/* Prompt Preview Modal */}
            {previewPrompt && (
                <PromptPreviewModal
                    prompt={previewPrompt}
                    category={previewCategory}
                    onClose={() => setPreviewPromptId(null)}
                />
            )}
        </div>
    );
};
