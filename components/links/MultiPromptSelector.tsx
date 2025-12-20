import React, { useState, useMemo } from 'react';
import { X, Search, Check, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
import { Prompt, PromptCategory } from '../../types';

interface MultiPromptSelectorProps {
    prompts: Prompt[];
    categories: PromptCategory[];
    selectedIds: string[];
    onClose: () => void;
    onSave: (ids: string[]) => void;
}

const MultiPromptSelector: React.FC<MultiPromptSelectorProps> = ({
    prompts,
    categories,
    selectedIds: initialSelectedIds,
    onClose,
    onSave,
}) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(categories.map(c => c.id))
    );

    // Group prompts by category
    const promptsByCategory = useMemo(() => {
        const map: Record<string, Prompt[]> = {};
        for (const cat of categories) {
            map[cat.id] = [];
        }
        map['uncategorized'] = [];

        for (const prompt of prompts) {
            const catId = prompt.category || 'uncategorized';
            if (!map[catId]) map[catId] = [];
            map[catId].push(prompt);
        }

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            for (const catId of Object.keys(map)) {
                map[catId] = map[catId].filter(
                    p => p.title.toLowerCase().includes(query) ||
                        p.content.toLowerCase().includes(query)
                );
            }
        }

        return map;
    }, [prompts, categories, searchQuery]);

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(catId)) {
                newSet.delete(catId);
            } else {
                newSet.add(catId);
            }
            return newSet;
        });
    };

    const togglePrompt = (promptId: string) => {
        setSelectedIds(prev =>
            prev.includes(promptId)
                ? prev.filter(id => id !== promptId)
                : [...prev, promptId]
        );
    };

    const selectAllInCategory = (catId: string) => {
        const promptsInCat = promptsByCategory[catId] || [];
        const allSelected = promptsInCat.every(p => selectedIds.includes(p.id));

        if (allSelected) {
            // Deselect all in category
            setSelectedIds(prev => prev.filter(id => !promptsInCat.some(p => p.id === id)));
        } else {
            // Select all in category
            const newIds = promptsInCat.map(p => p.id);
            setSelectedIds(prev => [...new Set([...prev, ...newIds])]);
        }
    };

    const getCategoryById = (id: string) => categories.find(c => c.id === id);

    const colorClasses: Record<string, string> = {
        slate: 'bg-slate-500/20 border-slate-500 text-slate-400',
        emerald: 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
        blue: 'bg-blue-500/20 border-blue-500 text-blue-400',
        purple: 'bg-purple-500/20 border-purple-500 text-purple-400',
        amber: 'bg-amber-500/20 border-amber-500 text-amber-400',
        rose: 'bg-rose-500/20 border-rose-500 text-rose-400',
        cyan: 'bg-cyan-500/20 border-cyan-500 text-cyan-400',
        pink: 'bg-pink-500/20 border-pink-500 text-pink-400',
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" />
                        Vincular Prompts
                        {selectedIds.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-600 rounded-full text-xs">
                                {selectedIds.length} selecionado{selectedIds.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </h3>
                    <button onClick={onClose} aria-label="Fechar">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-700 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar prompts..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:border-purple-500 outline-none"
                        />
                    </div>
                </div>

                {/* Categories and Prompts */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {categories.map(cat => {
                        const catPrompts = promptsByCategory[cat.id] || [];
                        if (catPrompts.length === 0) return null;

                        const isExpanded = expandedCategories.has(cat.id);
                        const allSelected = catPrompts.every(p => selectedIds.includes(p.id));
                        const someSelected = catPrompts.some(p => selectedIds.includes(p.id));

                        return (
                            <div key={cat.id} className="rounded-xl border border-slate-700 overflow-hidden">
                                {/* Category Header */}
                                <div
                                    className={`flex items-center gap-2 p-3 bg-slate-900/50 cursor-pointer hover:bg-slate-900 ${colorClasses[cat.color] || colorClasses.slate
                                        } border-l-4`}
                                    onClick={() => toggleCategory(cat.id)}
                                >
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span className="font-medium flex-1">{cat.name}</span>
                                    <span className="text-xs text-slate-500">{catPrompts.length} prompts</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); selectAllInCategory(cat.id); }}
                                        className={`px-2 py-1 rounded text-xs transition-colors ${allSelected
                                                ? 'bg-purple-600 text-white'
                                                : someSelected
                                                    ? 'bg-purple-600/30 text-purple-300'
                                                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                            }`}
                                    >
                                        {allSelected ? 'Remover todos' : 'Selecionar todos'}
                                    </button>
                                </div>

                                {/* Prompts List */}
                                {isExpanded && (
                                    <div className="divide-y divide-slate-700/50">
                                        {catPrompts.map(prompt => {
                                            const isSelected = selectedIds.includes(prompt.id);
                                            return (
                                                <div
                                                    key={prompt.id}
                                                    onClick={() => togglePrompt(prompt.id)}
                                                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected
                                                            ? 'bg-purple-900/20'
                                                            : 'hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-purple-600 border-purple-600'
                                                            : 'border-slate-600'
                                                        }`}>
                                                        {isSelected && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">{prompt.title}</p>
                                                        <p className="text-xs text-slate-500 truncate">{prompt.content.slice(0, 60)}...</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Uncategorized prompts */}
                    {promptsByCategory['uncategorized']?.length > 0 && (
                        <div className="rounded-xl border border-slate-700 overflow-hidden">
                            <div className="p-3 bg-slate-900/50 font-medium text-slate-400">
                                Sem Categoria ({promptsByCategory['uncategorized'].length})
                            </div>
                            <div className="divide-y divide-slate-700/50">
                                {promptsByCategory['uncategorized'].map(prompt => {
                                    const isSelected = selectedIds.includes(prompt.id);
                                    return (
                                        <div
                                            key={prompt.id}
                                            onClick={() => togglePrompt(prompt.id)}
                                            className={`flex items-center gap-3 p-3 cursor-pointer ${isSelected ? 'bg-purple-900/20' : 'hover:bg-slate-800'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-600'
                                                }`}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <p className="text-sm text-white truncate flex-1">{prompt.title}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {Object.values(promptsByCategory).every(arr => arr.length === 0) && (
                        <div className="text-center py-8 text-slate-500">
                            Nenhum prompt encontrado
                        </div>
                    )}
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
                        onClick={() => onSave(selectedIds)}
                        className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={16} />
                        Confirmar ({selectedIds.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultiPromptSelector;
