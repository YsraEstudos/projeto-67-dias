import React, { useState, useMemo, useRef } from 'react';
import { X, Plus, Sparkles, Image as ImageIcon, Eye, Edit3, Bold, Italic, Link2, List, Code, Heading } from 'lucide-react';
import { Prompt, PromptCategory, PromptImage } from '../../types';
import { categoryIcons, colorClasses } from './constants';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';
import { MarkdownRenderer } from '../notes/MarkdownRenderer';
import { htmlToMarkdown, wrapSelection, insertLink, autoPair, insertAtCursor } from '../../utils/markdownUtils';

interface PromptModalProps {
    prompt: Prompt | null;
    categories: PromptCategory[];
    onClose: () => void;
    onSave: (data: Partial<Prompt>) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ prompt, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: prompt?.title || '',
        content: prompt?.content || '',
        category: prompt?.category || 'geral',
        images: prompt?.images || [] as PromptImage[],
    });

    const [newImageUrl, setNewImageUrl] = useState('');
    const [newImageCaption, setNewImageCaption] = useState('');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const addImage = () => {
        if (!newImageUrl.trim()) return;
        const newImage: PromptImage = {
            id: Date.now().toString(),
            url: newImageUrl.trim(),
            caption: newImageCaption.trim() || undefined,
        };
        setFormData(prev => ({ ...prev, images: [...prev.images, newImage] }));
        setNewImageUrl('');
        setNewImageCaption('');
    };

    const removeImage = (id: string) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
    };

    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Memoize initial values for comparison
    const initialValues = useMemo(() => ({
        title: prompt?.title || '',
        content: prompt?.content || '',
        category: prompt?.category || 'geral',
        images: prompt?.images || [],
    }), []);

    // Track unsaved changes
    const { hasChanges } = useUnsavedChanges({
        initialValue: initialValues,
        currentValue: formData,
    });

    // Intercept close to check for unsaved changes
    const handleClose = () => {
        if (hasChanges) {
            setShowUnsavedModal(true);
        } else {
            onClose();
        }
    };

    // Update content helper
    const updateContent = (newContent: string) => {
        setFormData(prev => ({ ...prev, content: newContent }));
    };

    /**
     * Handles paste event to convert HTML clipboard content to Markdown.
     */
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const html = e.clipboardData.getData('text/html');

        if (html && html.trim()) {
            e.preventDefault();

            const markdown = htmlToMarkdown(html);
            const textarea = textareaRef.current;

            if (textarea && markdown) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const before = formData.content.substring(0, start);
                const after = formData.content.substring(end);

                const newContent = before + markdown + after;
                updateContent(newContent);

                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        const newPos = start + markdown.length;
                        textareaRef.current.selectionStart = newPos;
                        textareaRef.current.selectionEnd = newPos;
                        textareaRef.current.focus();
                    }
                });
            }
        }
    };

    /**
     * Handles keyboard shortcuts for Markdown formatting.
     */
    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Ctrl/Cmd + B: Bold
        if (isCtrlOrCmd && e.key === 'b') {
            e.preventDefault();
            const result = wrapSelection(formData.content, start, end, '**');
            updateContent(result.text);
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = result.newStart;
                    textareaRef.current.selectionEnd = result.newEnd;
                }
            });
            return;
        }

        // Ctrl/Cmd + I: Italic
        if (isCtrlOrCmd && e.key === 'i') {
            e.preventDefault();
            const result = wrapSelection(formData.content, start, end, '*');
            updateContent(result.text);
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = result.newStart;
                    textareaRef.current.selectionEnd = result.newEnd;
                }
            });
            return;
        }

        // Ctrl/Cmd + K: Insert Link
        if (isCtrlOrCmd && e.key === 'k') {
            e.preventDefault();
            const result = insertLink(formData.content, start, end);
            updateContent(result.text);
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = result.newStart;
                    textareaRef.current.selectionEnd = result.newEnd;
                }
            });
            return;
        }

        // Tab: Insert 2 spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const result = insertAtCursor(formData.content, start, '  ');
            updateContent(result.text);
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = result.newCursor;
                    textareaRef.current.selectionEnd = result.newCursor;
                }
            });
            return;
        }

        // Auto-pairing for brackets and quotes
        const pairChars = ['[', '(', '{', '`', '"', "'"];
        if (pairChars.includes(e.key)) {
            const result = autoPair(formData.content, start, e.key);
            if (result && result.paired) {
                e.preventDefault();
                updateContent(result.text);
                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        textareaRef.current.selectionStart = result.newCursor;
                        textareaRef.current.selectionEnd = result.newCursor;
                    }
                });
            }
        }
    };

    // Toolbar action helpers
    const insertMarkdown = (wrapper: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const result = wrapSelection(formData.content, start, end, wrapper);
        updateContent(result.text);

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = result.newStart;
                textareaRef.current.selectionEnd = result.newEnd;
                textareaRef.current.focus();
            }
        });
    };

    const insertPrefix = (prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const lineStart = formData.content.lastIndexOf('\n', start - 1) + 1;
        const before = formData.content.substring(0, lineStart);
        const after = formData.content.substring(lineStart);

        updateContent(before + prefix + after);

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = start + prefix.length;
                textareaRef.current.selectionEnd = start + prefix.length;
                textareaRef.current.focus();
            }
        });
    };

    const handleInsertLink = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const result = insertLink(formData.content, start, end);
        updateContent(result.text);
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = result.newStart;
                textareaRef.current.selectionEnd = result.newEnd;
                textareaRef.current.focus();
            }
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                {/* Clickable backdrop */}
                <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
                <div className="relative bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Sparkles size={18} className="text-purple-400" />
                            {prompt ? 'Editar Prompt' : 'Novo Prompt'}
                        </h3>
                        <button onClick={handleClose} aria-label="Fechar modal de prompt">
                            <X className="text-slate-400 hover:text-white" size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-5 overflow-y-auto flex-1">
                        {/* Title */}
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-1">
                                Título do Prompt
                            </label>
                            <input
                                autoFocus
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                                placeholder="Ex: Refatorar código Python"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">
                                Categoria
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => {
                                    const colors = colorClasses[cat.color] || colorClasses.slate;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${formData.category === cat.id
                                                ? `${colors.bg} ${colors.text} border-2 ${colors.border}`
                                                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            {categoryIcons[cat.icon] || categoryIcons.default}
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content with Markdown Support */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs text-slate-500 uppercase font-bold">
                                    Conteúdo do Prompt
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                                    className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${isPreviewMode
                                            ? 'bg-purple-600 text-white'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                    title={isPreviewMode ? 'Editar' : 'Visualizar'}
                                >
                                    {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                                    {isPreviewMode ? 'Editar' : 'Preview'}
                                </button>
                            </div>

                            {isPreviewMode ? (
                                /* Markdown Preview */
                                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                                    {formData.content.trim() ? (
                                        <MarkdownRenderer content={formData.content} compact />
                                    ) : (
                                        <p className="text-slate-500 italic text-sm">Nenhum conteúdo para visualizar...</p>
                                    )}
                                </div>
                            ) : (
                                /* Editor with Toolbar */
                                <div className="space-y-2">
                                    {/* Markdown Toolbar */}
                                    <div className="flex items-center gap-1 p-1.5 bg-slate-900 rounded-lg border border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('**')}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                            title="Negrito (Ctrl+B)"
                                        >
                                            <Bold size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('*')}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                            title="Itálico (Ctrl+I)"
                                        >
                                            <Italic size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleInsertLink}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                            title="Link (Ctrl+K)"
                                        >
                                            <Link2 size={14} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-700 mx-0.5" />
                                        <button
                                            type="button"
                                            onClick={() => insertPrefix('# ')}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                            title="Título"
                                        >
                                            <Heading size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertPrefix('- ')}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                            title="Lista"
                                        >
                                            <List size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => insertMarkdown('`')}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                            title="Código inline"
                                        >
                                            <Code size={14} />
                                        </button>
                                        <span className="ml-auto text-xs text-slate-600">
                                            {formData.content.length} chars
                                        </span>
                                    </div>

                                    {/* Textarea */}
                                    <textarea
                                        ref={textareaRef}
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        onPaste={handlePaste}
                                        onKeyDown={handleTextareaKeyDown}
                                        rows={8}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none font-mono text-sm resize-none"
                                        placeholder={`Digite seu prompt aqui...\n\nUse Markdown para formatação:\n- **negrito** ou *itálico*\n- # títulos\n- - listas\n- \`código\``}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Images */}
                        <div>
                            <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                                <ImageIcon size={12} /> Imagens de Exemplo (opcional)
                            </label>

                            {/* Existing Images */}
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {formData.images.map(img => (
                                        <div key={img.id} className="relative group">
                                            <img
                                                src={img.url}
                                                alt={img.caption || 'Exemplo'}
                                                className="w-full h-20 object-cover rounded-lg border border-slate-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(img.id)}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remover imagem do prompt"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Image */}
                            <div className="flex gap-2">
                                <input
                                    value={newImageUrl}
                                    onChange={e => setNewImageUrl(e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                                    placeholder="URL da imagem..."
                                />
                                <input
                                    value={newImageCaption}
                                    onChange={e => setNewImageCaption(e.target.value)}
                                    className="w-32 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-purple-500 outline-none"
                                    placeholder="Legenda"
                                />
                                <button
                                    type="button"
                                    onClick={addImage}
                                    disabled={!newImageUrl.trim()}
                                    aria-label="Adicionar imagem de exemplo"
                                    className="px-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3 shrink-0">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={!formData.title.trim() || !formData.content.trim()}
                            onClick={() => onSave(formData)}
                            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold transition-colors shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={18} /> Salvar Prompt
                        </button>
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Confirmation Modal */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onSave={() => {
                    setShowUnsavedModal(false);
                    onSave(formData);
                }}
                onDiscard={() => {
                    setShowUnsavedModal(false);
                    onClose();
                }}
                onCancel={() => setShowUnsavedModal(false)}
            />
        </>
    );
};

export default PromptModal;
