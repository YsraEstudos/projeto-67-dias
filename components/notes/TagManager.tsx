
import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Tag as TagIcon } from 'lucide-react';
import { Tag } from '../../types';
import { generateUUID } from '../../utils/uuid';

interface TagManagerProps {
    tags: Tag[];
    onSaveTag: (tag: Tag) => void;
    onDeleteTag: (tagId: string) => void;
    onClose: () => void;
}

const TAG_COLORS = [
    'bg-slate-600',
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
];

export const TagManager: React.FC<TagManagerProps> = ({ tags, onSaveTag, onDeleteTag, onClose }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState(TAG_COLORS[0]);

    // Initialize edit mode
    const handleEdit = (tag: Tag) => {
        setEditingId(tag.id);
        setTagName(tag.label);
        setTagColor(tag.color);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTagName('');
        setTagColor(TAG_COLORS[0]);
    };

    const handleSave = () => {
        if (!tagName.trim()) return;

        const newTag: Tag = {
            id: editingId || generateUUID(),
            label: tagName.trim(),
            color: tagColor,
            createdAt: editingId ? tags.find(t => t.id === editingId)?.createdAt || Date.now() : Date.now()
        };

        onSaveTag(newTag);
        handleCancelEdit();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <TagIcon className="text-purple-400" size={20} />
                        <h3 className="font-bold text-white text-lg">Gerenciar Tags</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors" title="Fechar">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 space-y-6">

                    {/* Editor Form */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            {editingId ? 'Editar Tag' : 'Nova Tag'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                placeholder="Nome da tag..."
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                autoFocus={!editingId}
                            />
                            <button
                                onClick={handleSave}
                                disabled={!tagName.trim()}
                                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                {editingId ? 'Salvar' : 'Adicionar'}
                            </button>
                        </div>

                        {/* Color Picker */}
                        <div>
                            <span className="text-xs text-slate-500 mb-2 block">Cor da Etiqueta</span>
                            <div className="flex flex-wrap gap-2">
                                {TAG_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setTagColor(color)}
                                        className={`w-6 h-6 rounded-full transition-transform ${color} ${tagColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
                                        title={`Selecionar cor ${color.replace('bg-', '')}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {editingId && (
                            <button onClick={handleCancelEdit} className="text-xs text-slate-400 hover:text-white underline">
                                Cancelar edição e criar nova
                            </button>
                        )}
                    </div>

                    {/* Tag List */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Tags Existentes ({tags.length})
                        </label>

                        {tags.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-4 italic">Nenhuma tag criada ainda.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                                {tags.map(tag => (
                                    <div key={tag.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${tag.color}`} />
                                            <span className="text-sm text-slate-200">{tag.label}</span>
                                        </div>
                                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(tag)}
                                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                                                title="Editar tag"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteTag(tag.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                                title="Excluir tag"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
