import React, { useState, useRef, useMemo } from 'react';
import { X, Eye, Edit3, Pin, Maximize2 } from 'lucide-react';
import { Note, NoteColor, Tag } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateUUID } from '../../utils/uuid';
import { htmlToMarkdown, wrapSelection, insertLink, autoPair, insertAtCursor } from '../../utils/markdownUtils';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';

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

// Color classes for focus mode border accent
const COLOR_ACCENT_CLASSES: Record<NoteColor, string> = {
    amber: 'border-amber-500/30',
    rose: 'border-rose-500/30',
    emerald: 'border-emerald-500/30',
    blue: 'border-blue-500/30',
    purple: 'border-purple-500/30',
    cyan: 'border-cyan-500/30',
    pink: 'border-pink-500/30',
    orange: 'border-orange-500/30',
};

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose, availableTags, onCreateTag }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [color, setColor] = useState<NoteColor>(note?.color || 'blue');
    const [tags, setTags] = useState<string[]>(note?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [tempTags, setTempTags] = useState<Tag[]>([]); // To avoid UI flicker before props update

    // New states for pin and preview
    const [isPinned, setIsPinned] = useState(note?.isPinned || false);
    const [pinnedToTags, setPinnedToTags] = useState<string[]>(note?.pinnedToTags || []);
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split' | 'focus'>(note ? 'focus' : 'edit');
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Ref for textarea to manage cursor position
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Memoize initial values for comparison
    const initialValues = useMemo(() => ({
        title: note?.title || '',
        content: note?.content || '',
        color: note?.color || 'blue',
        tags: note?.tags || [],
        isPinned: note?.isPinned || false,
        pinnedToTags: note?.pinnedToTags || [],
    }), []);

    // Track unsaved changes
    const { hasChanges } = useUnsavedChanges({
        initialValue: initialValues,
        currentValue: { title, content, color, tags, isPinned, pinnedToTags },
    });

    // Intercept close to check for unsaved changes
    const handleClose = () => {
        if (hasChanges) {
            setShowUnsavedModal(true);
        } else {
            onClose();
        }
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
                const before = content.substring(0, start);
                const after = content.substring(end);

                const newContent = before + markdown + after;
                setContent(newContent);

                // Set cursor position after inserted content
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
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Ctrl/Cmd + B: Bold
        if (isCtrlOrCmd && e.key === 'b') {
            e.preventDefault();
            const result = wrapSelection(content, start, end, '**');
            setContent(result.text);
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
            const result = wrapSelection(content, start, end, '*');
            setContent(result.text);
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
            const result = insertLink(content, start, end);
            setContent(result.text);
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
            const result = insertAtCursor(content, start, '  ');
            setContent(result.text);
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
            const result = autoPair(content, start, e.key);
            if (result && result.paired) {
                e.preventDefault();
                setContent(result.text);
                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        textareaRef.current.selectionStart = result.newCursor;
                        textareaRef.current.selectionEnd = result.newCursor;
                    }
                });
            }
        }
    };

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



    // Get all available tags for pinning (smart tags + tags already in note)
    const availableTagsForPin = [
        ...availableTags,
        ...tempTags,
        ...tags
            .filter(t => !availableTags.find(at => at.id === t) && !tempTags.find(tt => tt.id === t))
            .map(t => ({ id: t, label: t, color: 'bg-slate-600', createdAt: 0 }))
    ];

    return (
        <>
            {/* Focus Mode - Immersive fullscreen view */}
            {viewMode === 'focus' && (
                <div className="fixed inset-0 z-50 bg-slate-950 animate-in fade-in duration-300">
                    {/* Floating Action Bar - Transparent by default, opaque on hover */}
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-1 bg-slate-800/50 backdrop-blur-md rounded-xl p-1.5 border border-slate-700/50 opacity-30 hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={() => setViewMode('edit')}
                            className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                            title="Editar nota"
                        >
                            <Edit3 size={18} />
                        </button>
                        <button
                            onClick={() => {
                                setIsPinned(!isPinned);
                                if (!isPinned && pinnedToTags.length === 0 && tags.length > 0) {
                                    setPinnedToTags([tags[0]]);
                                }
                            }}
                            className={`p-2.5 hover:bg-slate-700 rounded-lg transition-colors ${isPinned ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
                            title={isPinned ? 'Desafixar nota' : 'Fixar nota'}
                        >
                            <Pin size={18} className={isPinned ? 'fill-current' : ''} />
                        </button>
                        <div className="w-px h-6 bg-slate-600 mx-1" />
                        <button
                            onClick={handleClose}
                            className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                            title="Fechar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Focus Mode Content */}
                    <div className="h-full overflow-y-auto scrollbar-thin">
                        <div className="max-w-4xl mx-auto py-16 px-8">
                            {/* Title */}
                            <h1 className="text-4xl font-bold text-white mb-8 leading-tight">
                                {title || 'Sem título'}
                            </h1>

                            {/* Color accent bar */}
                            <div className={`w-24 h-1 rounded-full mb-10 ${COLOR_OPTIONS.find(c => c.color === color)?.class || 'bg-blue-500'}`} />

                            {/* Content */}
                            <div className="prose prose-invert prose-lg max-w-none">
                                {content.trim() ? (
                                    <MarkdownRenderer content={content} />
                                ) : (
                                    <p className="text-slate-500 italic text-lg">Esta nota está vazia...</p>
                                )}
                            </div>

                            {/* Footer info */}
                            {tags.length > 0 && (
                                <div className="mt-16 pt-8 border-t border-slate-800">
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tagStr, idx) => {
                                            const smartTag = availableTags.find(t => t.id === tagStr) || tempTags.find(t => t.id === tagStr);
                                            const label = smartTag?.label || tagStr;
                                            const tagColor = smartTag?.color || 'bg-slate-700';
                                            return (
                                                <span
                                                    key={idx}
                                                    className={`text-xs px-3 py-1.5 ${tagColor} text-slate-100 rounded-full border border-white/10`}
                                                >
                                                    {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Regular Editor Modal */}
            {viewMode !== 'focus' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    {/* Clickable backdrop */}
                    <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
                    <div className="relative bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-white text-xl">{!note ? 'Nova Nota' : viewMode === 'preview' ? 'Visualizar Nota' : 'Editar Nota'}</h3>


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
                                {note && (
                                    <button
                                        onClick={() => setViewMode('focus')}
                                        className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                                        title="Modo foco (tela cheia)"
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                )}
                                <button onClick={handleClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
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
                                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-lg font-semibold outline-none ${viewMode === 'preview' ? 'cursor-default' : 'focus:border-purple-500'}`}
                                    autoFocus={viewMode !== 'preview'}
                                    readOnly={viewMode === 'preview'}
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
                                                ref={textareaRef}
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                onPaste={handlePaste}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Escreva sua nota aqui... Use **negrito**, *itálico*, # títulos, - listas, etc. Cole texto formatado para converter automaticamente!"
                                                className={`w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm leading-relaxed focus:border-purple-500 outline-none resize-none font-mono ${viewMode === 'split' ? 'h-64' : 'h-48'}`}
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
                            <button onClick={handleClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg flex items-center justify-center gap-2">
                                {isPinned && <Pin size={14} />}
                                Salvar Nota
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unsaved Changes Confirmation Modal */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onSave={() => {
                    setShowUnsavedModal(false);
                    handleSave();
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
