import React, { useState } from 'react';
import { X, Globe, Sparkles, ArrowUpRight } from 'lucide-react';
import { LinkItem, Prompt, PromptCategory } from '../../types';
import { PromptSelectorModal } from '../skills/PromptSelectorModal';

interface LinkModalProps {
    link: LinkItem | null;
    prompts: Prompt[];
    promptCategories: PromptCategory[];
    onClose: () => void;
    onSave: (data: Partial<LinkItem>) => void;
}

const LinkModal: React.FC<LinkModalProps> = ({ link, prompts, promptCategories, onClose, onSave }) => {
    const [formData, setFormData] = useState<{ title: string; url: string; category: 'PERSONAL' | 'GENERAL'; promptId?: string }>({
        title: link?.title || '',
        url: link?.url || '',
        category: link?.category || 'PERSONAL',
        promptId: link?.promptId
    });
    const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false);

    const linkedPrompt = formData.promptId ? prompts.find(p => p.id === formData.promptId) : null;
    const linkedCategory = linkedPrompt ? promptCategories.find(c => c.id === linkedPrompt.category) : null;

    const handleSelectPrompt = (prompt: Prompt) => {
        setFormData({ ...formData, promptId: prompt.id });
        setIsPromptSelectorOpen(false);
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
                                    onClick={() => setFormData({ ...formData, category: 'PERSONAL' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.category === 'PERSONAL' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                >
                                    Meus Sites
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, category: 'GENERAL' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.category === 'GENERAL' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                >
                                    Sites Gerais
                                </button>
                            </div>
                        </div>

                        {/* PROMPT LINKING SECTION */}
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                                <Sparkles size={12} className="text-purple-400" /> Prompt Vinculado (opcional)
                            </label>
                            {linkedPrompt ? (
                                <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-3 flex items-center gap-3">
                                    <div className="p-2 bg-purple-600/20 rounded-lg">
                                        <Sparkles size={16} className="text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-purple-300 truncate">{linkedPrompt.title}</p>
                                        <p className="text-xs text-slate-500">{linkedCategory?.name || 'Geral'}</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, promptId: undefined })}
                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Desvincular prompt"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsPromptSelectorOpen(true)}
                                    className="w-full py-3 bg-slate-900 hover:bg-slate-700 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-purple-400 text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <Sparkles size={16} /> Vincular um Prompt
                                </button>
                            )}
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

            {/* PROMPT SELECTOR MODAL */}
            {isPromptSelectorOpen && (
                <PromptSelectorModal
                    prompts={prompts}
                    categories={promptCategories}
                    excludeIds={[]}
                    onSelect={handleSelectPrompt}
                    onClose={() => setIsPromptSelectorOpen(false)}
                />
            )}
        </>
    );
};

export default LinkModal;
