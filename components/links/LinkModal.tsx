import React, { useState } from 'react';
import { X, Globe, Sparkles, ArrowUpRight } from 'lucide-react';
import { LinkItem, Prompt, PromptCategory } from '../../types';
import MultiPromptSelector from './MultiPromptSelector';

interface LinkModalProps {
    link: LinkItem | null;
    prompts: Prompt[];
    promptCategories: PromptCategory[];
    onClose: () => void;
    onSave: (data: Partial<LinkItem>) => void;
}

const LinkModal: React.FC<LinkModalProps> = ({ link, prompts, promptCategories, onClose, onSave }) => {
    const [formData, setFormData] = useState<{ title: string; url: string; categoryId: string; promptIds: string[] }>({
        title: link?.title || '',
        url: link?.url || '',
        categoryId: link?.categoryId || 'personal',
        promptIds: link?.promptIds || []
    });
    const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false);

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
                <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                        <h3 className="font-bold text-white">{link ? 'Editar Link' : 'Novo Link'}</h3>
                        <button onClick={onClose} title="Fechar"><X className="text-slate-400 hover:text-white" size={20} /></button>
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
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Categoria</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFormData({ ...formData, categoryId: 'personal' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.categoryId === 'personal' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                >
                                    Meus Sites
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, categoryId: 'general' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.categoryId === 'general' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                >
                                    Sites Gerais
                                </button>
                            </div>
                        </div>

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
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
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
        </>
    );
};

export default LinkModal;
