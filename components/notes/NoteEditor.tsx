import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Note, NoteColor } from '../../types';
import { getGeminiModel } from '../../services/gemini';
import { Type } from '@google/genai';

interface NoteEditorProps {
    note: Note | null;
    onSave: (note: Note) => void;
    onClose: () => void;
}

const COLOR_OPTIONS: { color: NoteColor; label: string; class: string }[] = [
    { color: 'amber', label: 'Âmbar', class: 'bg-amber-500' },
    { color: 'rose', label: 'Rosa', class: 'bg-rose-500' },
    { color: 'emerald', label: 'Esmeralda', class: 'bg-emerald-500' },
    { color: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { color: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { color: 'cyan', label: 'Ciano', class: 'bg-cyan-500' },
    { color: 'pink', label: 'Rosa Pink', class: 'bg-pink-500' },
    { color: 'orange', label: 'Laranja', class: 'bg-orange-500' },
];

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [color, setColor] = useState<NoteColor>(note?.color || 'blue');
    const [tags, setTags] = useState<string[]>(note?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);

    const handleSave = () => {
        const savedNote: Note = {
            id: note?.id || Date.now().toString(),
            title: title.trim() || 'Sem título',
            content: content.trim(),
            color,
            tags,
            createdAt: note?.createdAt || Date.now(),
            updatedAt: Date.now(),
            aiProcessed: note?.aiProcessed,
            aiSummary: note?.aiSummary,
        };
        onSave(savedNote);
        onClose();
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleAIAction = async (action: 'summarize' | 'expand' | 'improve' | 'suggest-tags') => {
        if (!content.trim()) {
            alert('Escreva algum conteúdo primeiro!');
            return;
        }

        setAiLoading(true);
        setAiResult(null);

        try {
            const models = getGeminiModel();
            let prompt = '';
            let schema: any = { type: Type.OBJECT, properties: {} };

            switch (action) {
                case 'summarize':
                    prompt = `Crie um resumo conciso (2-3 frases) do seguinte texto em português:\n\n${content}`;
                    schema.properties = { summary: { type: Type.STRING } };
                    break;
                case 'expand':
                    prompt = `Expanda o seguinte texto com mais detalhes e contexto, mantendo o tom original (português):\n\n${content}`;
                    schema.properties = { expanded: { type: Type.STRING } };
                    break;
                case 'improve':
                    prompt = `Melhore a escrita do seguinte texto corrigindo gramática, clareza e fluidez (português):\n\n${content}`;
                    schema.properties = { improved: { type: Type.STRING } };
                    break;
                case 'suggest-tags':
                    prompt = `Sugira 3-5 tags/palavras-chave relevantes para o seguinte texto (em português, minúsculas, uma palavra cada):\n\n${content}`;
                    schema.properties = { tags: { type: Type.ARRAY, items: { type: Type.STRING } } };
                    break;
            }

            const response = await models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            });

            if (response.text) {
                const data = JSON.parse(response.text);

                if (action === 'summarize') {
                    setAiResult(data.summary);
                    // Update note metadata
                    const updatedNote = note || ({} as Note);
                    updatedNote.aiSummary = data.summary;
                    updatedNote.aiProcessed = true;
                } else if (action === 'expand' || action === 'improve') {
                    setAiResult(data.expanded || data.improved);
                } else if (action === 'suggest-tags') {
                    const newTags = data.tags.filter((t: string) => !tags.includes(t));
                    setTags([...tags, ...newTags]);
                    setAiResult(`Tags adicionadas: ${newTags.join(', ')}`);
                }
            }
        } catch (error) {
            console.error('AI Error:', error);
            alert('Erro ao processar com IA. Tente novamente.');
        } finally {
            setAiLoading(false);
        }
    };

    const applyAIResult = () => {
        if (aiResult) {
            setContent(aiResult);
            setAiResult(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white text-xl">{note ? 'Editar Nota' : 'Nova Nota'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                    {/* Title */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Título</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Digite o título da nota..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-lg font-semibold focus:border-purple-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Conteúdo</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Escreva sua nota aqui..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm leading-relaxed focus:border-purple-500 outline-none resize-none h-48"
                        />
                        <div className="text-xs text-slate-500 mt-1 text-right">{content.length} caracteres</div>
                    </div>

                    {/* AI Actions */}
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-purple-400" />
                            <span className="text-sm font-bold text-slate-300">Assistente IA</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleAIAction('summarize')}
                                disabled={aiLoading}
                                className="text-xs bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 px-3 py-2 rounded-lg border border-purple-500/30 transition-colors disabled:opacity-50"
                            >
                                ✨ Resumir
                            </button>
                            <button
                                onClick={() => handleAIAction('expand')}
                                disabled={aiLoading}
                                className="text-xs bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 px-3 py-2 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-50"
                            >
                                📝 Expandir
                            </button>
                            <button
                                onClick={() => handleAIAction('improve')}
                                disabled={aiLoading}
                                className="text-xs bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 px-3 py-2 rounded-lg border border-emerald-500/30 transition-colors disabled:opacity-50"
                            >
                                ✍️ Melhorar
                            </button>
                            <button
                                onClick={() => handleAIAction('suggest-tags')}
                                disabled={aiLoading}
                                className="text-xs bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-3 py-2 rounded-lg border border-amber-500/30 transition-colors disabled:opacity-50"
                            >
                                🏷️ Sugerir Tags
                            </button>
                        </div>

                        {aiLoading && (
                            <div className="flex items-center gap-2 mt-3 text-purple-400 text-sm">
                                <Loader2 size={16} className="animate-spin" />
                                Processando com IA...
                            </div>
                        )}

                        {aiResult && (
                            <div className="mt-3 bg-slate-950/50 border border-purple-500/30 rounded-lg p-3 animate-in slide-in-from-bottom-2">
                                <div className="text-xs text-purple-400 font-bold mb-2">Resultado da IA:</div>
                                <div className="text-sm text-slate-200 leading-relaxed mb-3">{aiResult}</div>
                                <div className="flex gap-2">
                                    <button onClick={applyAIResult} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg font-medium">
                                        Aplicar
                                    </button>
                                    <button onClick={() => setAiResult(null)} className="text-xs text-slate-400 hover:text-white">
                                        Descartar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-3">Cor da Nota</label>
                        <div className="flex gap-3 flex-wrap">
                            {COLOR_OPTIONS.map((opt) => (
                                <button
                                    key={opt.color}
                                    onClick={() => setColor(opt.color)}
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${color === opt.color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                                        } ${opt.class}`}
                                    title={opt.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Tags</label>
                        <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="Digite uma tag e pressione Enter..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-purple-500 outline-none"
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs px-3 py-1.5 bg-slate-700 text-slate-200 rounded-full flex items-center gap-2 border border-slate-600 animate-in zoom-in-95"
                                    >
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg">
                        Salvar Nota
                    </button>
                </div>
            </div>
        </div>
    );
};
