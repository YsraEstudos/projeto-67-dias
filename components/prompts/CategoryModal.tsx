import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { categoryIcons, colorClasses } from './constants';

interface CategoryModalProps {
    onClose: () => void;
    onSave: (name: string, color: string, icon: string) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('slate');
    const [icon, setIcon] = useState('default');

    const colors = ['slate', 'emerald', 'blue', 'purple', 'amber', 'rose', 'cyan', 'pink'];
    const icons = [
        'default', 'code', 'creative', 'chat', 'writing', 'ideas', 'ai', 'magic',
        'business', 'education', 'health', 'music', 'gaming', 'web', 'photo', 'shopping',
        'marketing', 'math', 'bookmark', 'productivity', 'startup', 'goals', 'social', 'security',
        'tools', 'design', 'layers', 'terminal', 'database', 'hardware'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <FolderPlus size={18} className="text-purple-400" />
                        Nova Categoria
                    </h3>
                    <button onClick={onClose} aria-label="Fechar modal de categorias">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Nome</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder="Ex: Marketing"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Cor</label>
                        <div className="flex flex-wrap gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    aria-label={`Selecionar cor ${c}`}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c ? 'scale-110 border-white' : 'border-transparent'
                                        } ${colorClasses[c].bg}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Ícone</label>
                        <div className="flex flex-wrap gap-2">
                            {icons.map(i => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    aria-label={`Selecionar ícone ${i}`}
                                    className={`p-2.5 rounded-lg border transition-all ${icon === i
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {categoryIcons[i]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </button>
                    <button
                        disabled={!name.trim()}
                        onClick={() => onSave(name.trim(), color, icon)}
                        className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors"
                    >
                        Criar Categoria
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryModal;
