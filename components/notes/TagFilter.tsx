import React from 'react';
import { X, Filter } from 'lucide-react';
import { NoteColor } from '../../types';

interface TagFilterProps {
    allTags: string[];
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
    onClearAll: () => void;
    tagCounts: Record<string, number>;
}

export const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTags, onToggleTag, onClearAll, tagCounts }) => {
    if (allTags.length === 0) return null;

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-300">Filtrar por Tags</span>
                </div>
                {selectedTags.length > 0 && (
                    <button onClick={onClearAll} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1">
                        <X size={12} /> Limpar ({selectedTags.length})
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    const count = tagCounts[tag] || 0;

                    return (
                        <button
                            key={tag}
                            onClick={() => onToggleTag(tag)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${isSelected
                                    ? 'bg-purple-600 text-white border-2 border-purple-500 shadow-lg shadow-purple-900/30 scale-105'
                                    : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-purple-500/50 hover:text-purple-400'
                                }`}
                        >
                            {tag} <span className="opacity-70">({count})</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
