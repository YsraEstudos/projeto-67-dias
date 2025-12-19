import React, { useState } from 'react';
import { X, Sparkles, Loader2, Eye, Edit3, Pin } from 'lucide-react';
import { Note, NoteColor, Tag } from '../../types';
interface GeminiModule {
    getGeminiModel: () => any;
}

interface GenAIModule {
    Type: any;
}
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateUUID } from '../../utils/uuid';

interface NoteEditorProps {
    note: Note | null;
    onSave: (note: Note) => void;
    onClose: () => void;
    availableTags: Tag[];
    onCreateTag: (label: string) => Tag;
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

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose, availableTags, onCreateTag }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [color, setColor] = useState<NoteColor>(note?.color || 'blue');
    const [tags, setTags] = useState<string[]>(note?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<string | null>(null);
    const [tempTags, setTempTags] = useState<Tag[]>([]); // To avoid UI flicker before props update

    // New states for pin and preview
    const [isPinned, setIsPinned] = useState(note?.isPinned || false);
    const [pinnedToTags, setPinnedToTags] = useState<string[]>(note?.pinnedToTags || []);
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');

    const handleSave = () => {
        const savedNote: Note = {
            id: note?.id || generateUUID(),
            title: title.trim() || 'Sem título',
            content: content.trim(),
            color,
            tags,
            isPinned,
            pinnedToTags: isPinned ? pinnedToTags : [],
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
            const label = tagInput.trim();
            const tag = onCreateTag(label);
            setTempTags(prev => [...prev, tag]);

            // Add ID to note tags
            if (!tags.includes(tag.id)) {
                setTags([...tags, tag.id]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
        // Also remove from pinned tags if present
        setPinnedToTags(pinnedToTags.filter(t => t !== tagToRemove));
    };

    const handleToggleSmartTag = (tag: Tag) => {
        if (tags.includes(tag.id)) {
            setTags(tags.filter(t => t !== tag.id));
            setPinnedToTags(pinnedToTags.filter(t => t !== tag.id));
        } else {
            setTags([...tags, tag.id]);
        }
    };

    const handleTogglePinnedTag = (tagId: string) => {
        if (pinnedToTags.includes(tagId)) {
            setPinnedToTags(pinnedToTags.filter(t => t !== tagId));
        } else {
            setPinnedToTags([...pinnedToTags, tagId]);
        }
    };

    const getTagDisplay = (tagStr: string) => {
        const smartTag = availableTags.find(t => t.id === tagStr) || tempTags.find(t => t.id === tagStr);
        if (smartTag) return { label: smartTag.label, color: smartTag.color, isSmart: true };

        const smartTagByLabel = availableTags.find(t => t.label.toLowerCase() === tagStr.toLowerCase())
            || tempTags.find(t => t.label.toLowerCase() === tagStr.toLowerCase());
        if (smartTagByLabel) return { label: smartTagByLabel.label, color: smartTagByLabel.color, isSmart: true };

        return { label: tagStr, color: 'bg-slate-700', isSmart: false };
    };

    const handleAIAction = async (action: 'summarize' | 'expand' | 'improve' | 'suggest-tags') => {
        if (!content.trim()) {
            alert('Escreva algum conteúdo primeiro!');
            return;
        }

        setAiLoading(true);
        setAiResult(null);

        try {
            // Dynamic import for performance
            const [geminiModule, genAIModule] = await Promise.all([
                import('../../services/gemini') as Promise<GeminiModule>,
                import('@google/genai') as Promise<GenAIModule>
            ]);

            const { getGeminiModel } = geminiModule;
            const { Type } = genAIModule;

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
                    const updatedNote = note || ({} as Note);
                    updatedNote.aiSummary = data.summary;
                    updatedNote.aiProcessed = true;
                } else if (action === 'expand' || action === 'improve') {
                    setAiResult(data.expanded || data.improved);
                } else if (action === 'suggest-tags') {
                    const newTagIds: string[] = [];
                    const newTempTags: Tag[] = [];

                    data.tags.forEach((t: string) => {
                        const tag = onCreateTag(t);
                        newTempTags.push(tag);
                        if (!tags.includes(tag.id)) {
                            newTagIds.push(tag.id);
                        }
                    });

                    setTempTags(prev => [...prev, ...newTempTags]);
                    setTags([...tags, ...newTagIds]);
                    setAiResult(`Tags adicionadas: ${data.tags.join(', ')}`);
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

    // Get all available tags for pinning (smart tags + tags already in note)
    const availableTagsForPin = [
        ...availableTags,
        ...tempTags,
        ...tags
            .filter(t => !availableTags.find(at => at.id === t) && !tempTags.find(tt => tt.id === t))
            .map(t => ({ id: t, label: t, color: 'bg-slate-600', createdAt: 0 }))
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white text-xl">{note ? 'Editar Nota' : 'Nova Nota'}</h3>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('edit')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'edit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Edit3 size={12} /> Editar
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'split' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Split
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'preview' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Eye size={12} /> Preview
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
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

                    {/* Content Editor/Preview */}
                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">
                            Conteúdo <span className="text-purple-400 font-normal">(suporta Markdown)</span>
                        </label>

                        <div className={`${viewMode === 'split' ? 'grid grid-cols-2 gap-4' : ''}`}>
                            {/* Editor */}
                            {(viewMode === 'edit' || viewMode === 'split') && (
                                <div>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Escreva sua nota aqui... Use **negrito**, *itálico*, # títulos, - listas, etc."
                                        className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm leading-relaxed focus:border-purple-500 outline-none resize-none font-mono ${viewMode === 'split' ? 'h-64' : 'h-48'
                                            }`}
                                    />
                                    <div className="text-xs text-slate-500 mt-1 text-right">{content.length} caracteres</div>
                                </div>
                            )}

                            {/* Preview */}
                            {(viewMode === 'preview' || viewMode === 'split') && (
                                <div className={`bg-slate-900 border border-slate-700 rounded-xl p-4 overflow-y-auto ${viewMode === 'split' ? 'h-64' : 'h-48'
                                    }`}>
                                    {content.trim() ? (
                                        <MarkdownRenderer content={content} />
                                    ) : (
                                        <p className="text-slate-500 italic text-sm">Preview aparecerá aqui...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pin Section */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Pin size={16} className={isPinned ? 'text-amber-400' : 'text-slate-500'} />
                                <span className="text-sm font-bold text-slate-300">Fixar Nota</span>
                            </div>
                            <button
                                onClick={() => {
                                    setIsPinned(!isPinned);
                                    if (!isPinned && pinnedToTags.length === 0 && tags.length > 0) {
                                        // Auto-select first tag when enabling pin
                                        setPinnedToTags([tags[0]]);
                                    }
                                }}
                                className={`relative w-12 h-6 rounded-full transition-colors ${isPinned ? 'bg-amber-500' : 'bg-slate-700'
                                    }`}
                            >
                                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${isPinned ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {isPinned && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-slate-500 mb-2">Fixar em quais tags:</p>
                                <div className="flex flex-wrap gap-2">
                                    {tags.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">Adicione tags primeiro para fixar</p>
                                    ) : (
                                        tags.map((tagStr) => {
                                            const { label, color: tagColor } = getTagDisplay(tagStr);
                                            const isSelected = pinnedToTags.includes(tagStr);
                                            return (
                                                <button
                                                    key={tagStr}
                                                    onClick={() => handleTogglePinnedTag(tagStr)}
                                                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${isSelected
                                                        ? `${tagColor} text-white border-amber-400 shadow-md ring-2 ring-amber-400/30`
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                                        }`}
                                                >
                                                    {isSelected && <Pin size={10} />}
                                                    {label}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
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

                        {/* Smart Tag Selector */}
                        {availableTags.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                                {availableTags.map(tag => {
                                    const isSelected = tags.includes(tag.id) || tags.includes(tag.label);
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleToggleSmartTag(tag)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${isSelected
                                                ? `${tag.color} text-white border-white/50 shadow-md`
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                                                }`}
                                        >
                                            {tag.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Nova tag manual (Enter)..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-purple-500 outline-none"
                            />
                        </div>

                        {/* Selected Tags Display */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {tags.map((tagStr, idx) => {
                                    const { label, color: tagColor, isSmart } = getTagDisplay(tagStr);
                                    return (
                                        <span
                                            key={idx}
                                            className={`text-xs px-3 py-1.5 ${isSmart ? tagColor : 'bg-slate-700'} text-slate-100 rounded-full flex items-center gap-2 border border-white/10 animate-in zoom-in-95`}
                                        >
                                            {label}
                                            <button onClick={() => handleRemoveTag(tagStr)} className="hover:text-red-300 transition-colors">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
                        {isPinned && <Pin size={14} />}
                        Salvar Nota
                    </button>
                </div>
            </div>
        </div>
    );
};
