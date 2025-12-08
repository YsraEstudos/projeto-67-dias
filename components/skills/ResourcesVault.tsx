import React, { useState } from 'react';
import { Plus, Link as LinkIcon, Trash2, Youtube, FileText } from 'lucide-react';
import { SkillResource } from '../../types';

interface ResourcesVaultProps {
    resources: SkillResource[];
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
 */
export const ResourcesVault: React.FC<ResourcesVaultProps> = ({ resources, onAdd, onRemove }) => {
    const [newResourceUrl, setNewResourceUrl] = useState('');

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

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <LinkIcon size={18} className="text-blue-400" /> Cofre de Recursos
            </h3>

            <div className="flex gap-2 mb-4">
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
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {resources.map(res => (
                    <div
                        key={res.id}
                        className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-600 group"
                    >
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                            {res.type === 'VIDEO' ? <Youtube size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <a
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-400 hover:underline truncate block font-medium"
                            >
                                {res.title || res.url}
                            </a>
                        </div>
                        <button
                            onClick={() => onRemove(res.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {resources.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">Nenhum link salvo.</p>
                )}
            </div>
        </div>
    );
};
