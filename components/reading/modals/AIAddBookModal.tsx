import React, { useState } from 'react';
import { Book as IBook } from '../../../types';
import { useBookAI } from '../../../hooks/useBookAI';
import { Bot, Sparkles, X, Book, CheckCircle2 } from 'lucide-react';

interface AIAddBookModalProps {
    onClose: () => void;
    onAdd: (b: IBook) => void;
    currentFolderId: string | null;
}

const AIAddBookModal: React.FC<AIAddBookModalProps> = ({ onClose, onAdd, currentFolderId }) => {
    const [prompt, setPrompt] = useState('');
    const [previewData, setPreviewData] = useState<Partial<IBook> | null>(null);

    const { generateBookFromPrompt, isLoading, error } = useBookAI();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        const result = await generateBookFromPrompt(prompt);

        if (result) {
            setPreviewData(result);
        }
    };

    const handleConfirm = () => {
        if (!previewData) return;
        onAdd({
            id: Date.now().toString(),
            title: previewData.title || 'Sem Título',
            author: previewData.author || 'Desconhecido',
            genre: previewData.genre || 'Geral',
            total: previewData.total || 0,
            current: 0,
            unit: previewData.unit || 'PAGES',
            status: 'TO_READ',
            rating: 0,
            notes: previewData.notes || '',
            folderId: currentFolderId,
            addedAt: new Date(),
            coverUrl: previewData.coverUrl
        } as IBook);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-purple-900/50 to-slate-900 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Adicionar com IA</h3>
                            <p className="text-xs text-purple-400">Gemini Powered</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto scrollbar-thin space-y-6">
                    {!previewData ? (
                        <>
                            <div className="text-center space-y-2">
                                <Sparkles size={48} className="mx-auto text-purple-500/50" />
                                <p className="text-slate-400 text-sm">
                                    Qual livro você quer adicionar? Diga o nome, autor, ou descreva o que procura.
                                </p>
                            </div>

                            <div>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="Ex: Adicionar o livro 'O Poder do Hábito'..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-purple-500 outline-none h-32 resize-none transition-all"
                                    autoFocus
                                />
                                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !prompt.trim()}
                                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} /> Identificar Livro
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4">
                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                <div className="flex gap-4">
                                    <div className="w-20 h-28 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                                        <Book size={32} className="text-slate-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{previewData.title}</h4>
                                        <p className="text-purple-400">{previewData.author}</p>
                                        <div className="flex gap-2 mt-2 text-xs text-slate-500">
                                            <span className="bg-slate-800 px-2 py-1 rounded">{previewData.genre}</span>
                                            <span className="bg-slate-800 px-2 py-1 rounded">{previewData.total} {previewData.unit === 'PAGES' ? 'pág' : 'cap'}</span>
                                        </div>
                                    </div>
                                </div>
                                {previewData.notes && (
                                    <div className="mt-3 text-sm text-slate-400 bg-slate-950/50 p-3 rounded-lg italic">
                                        "{previewData.notes}"
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPreviewData(null)}
                                    className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
                                >
                                    Tentar Outro
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Confirmar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAddBookModal;
