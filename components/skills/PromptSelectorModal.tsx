import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles, Star, Check } from 'lucide-react';
import { Prompt, PromptCategory } from '../../types';

interface PromptSelectorModalProps {
    prompts: Prompt[];
    categories: PromptCategory[];
    excludeIds: string[];
    onSelect: (prompt: Prompt) => void;
    onClose: () => void;
}

/**
 * Modal for selecting a prompt to link to a skill's resource vault.
 * Supports search, category filtering, and shows preview of selected prompt.
 */
export const PromptSelectorModal: React.FC<PromptSelectorModalProps> = ({
    prompts,
    categories,
    excludeIds,
    onSelect,
    onClose
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);

    // Filter prompts
    const filteredPrompts = useMemo(() => {
        return prompts.filter(p => {
            // Exclude already linked prompts
            if (excludeIds.includes(p.id)) return false;

            // Search filter
            const matchesSearch = searchQuery
                ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.content.toLowerCase().includes(searchQuery.toLowerCase())
                : true;

            // Category filter
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [prompts, excludeIds, searchQuery, selectedCategory]);

    const getCategoryName = (catId: string) => {
        return categories.find(c => c.id === catId)?.name || 'Geral';
    };

    const hoveredPrompt = prompts.find(p => p.id === hoveredPromptId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" />
                        Linkar Prompt
                    </h3>
                    <button onClick={onClose} title="Fechar" className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="p-4 border-b border-slate-700/50 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar prompts..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none"
                            autoFocus
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:text-white'
                                }`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-700 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Prompt List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredPrompts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Sparkles size={32} className="mb-2 opacity-50" />
                                <p className="text-sm">Nenhum prompt encontrado</p>
                            </div>
                        ) : (
                            filteredPrompts.map(prompt => (
                                <div
                                    key={prompt.id}
                                    onClick={() => onSelect(prompt)}
                                    onMouseEnter={() => setHoveredPromptId(prompt.id)}
                                    onMouseLeave={() => setHoveredPromptId(null)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${hoveredPromptId === prompt.id
                                        ? 'bg-purple-600/20 border-purple-500'
                                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {prompt.isFavorite && (
                                            <Star size={14} className="text-amber-400 fill-amber-400" />
                                        )}
                                        <span className="font-medium text-white text-sm">{prompt.title}</span>
                                        <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                            {getCategoryName(prompt.category)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                        {prompt.content.slice(0, 100)}...
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Preview Panel */}
                    {hoveredPrompt && (
                        <div className="w-64 border-l border-slate-700 p-4 bg-slate-900/30 hidden lg:block overflow-y-auto">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Preview</h4>
                            <h5 className="font-medium text-white text-sm mb-2">{hoveredPrompt.title}</h5>
                            <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono bg-slate-900/50 p-2 rounded-lg max-h-48 overflow-y-auto">
                                {hoveredPrompt.content}
                            </pre>
                            <button
                                onClick={() => onSelect(hoveredPrompt)}
                                className="w-full mt-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Check size={14} /> Selecionar
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-3 border-t border-slate-700 bg-slate-900/50 text-center text-xs text-slate-500">
                    {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} disponíve{filteredPrompts.length !== 1 ? 'is' : 'l'}
                    {excludeIds.length > 0 && ` • ${excludeIds.length} já linkado${excludeIds.length !== 1 ? 's' : ''}`}
                </div>
            </div>
        </div>
    );
};
