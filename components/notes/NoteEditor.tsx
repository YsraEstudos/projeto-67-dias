import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, Eye, Edit3, Pin, Save, ChevronDown, ChevronUp, Bold, Italic, Link2, List, Code, Heading, ImagePlus, Loader2 } from 'lucide-react';
import { Note, NoteColor, Tag } from '../../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateUUID } from '../../utils/uuid';
import { htmlToMarkdown, wrapSelection, insertLink, autoPair, insertAtCursor } from '../../utils/markdownUtils';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../shared/UnsavedChangesModal';
import { isValidImageFile, fileToBase64, compressImage, generateImageMarkdown, extractImageFromClipboard } from '../../utils/imageUtils';

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

// Color classes for accent styling
const COLOR_ACCENT_CLASSES: Record<NoteColor, { bar: string; border: string; text: string }> = {
    amber: { bar: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400' },
    rose: { bar: 'bg-rose-500', border: 'border-rose-500/30', text: 'text-rose-400' },
    emerald: { bar: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    blue: { bar: 'bg-blue-500', border: 'border-blue-500/30', text: 'text-blue-400' },
    purple: { bar: 'bg-purple-500', border: 'border-purple-500/30', text: 'text-purple-400' },
    cyan: { bar: 'bg-cyan-500', border: 'border-cyan-500/30', text: 'text-cyan-400' },
    pink: { bar: 'bg-pink-500', border: 'border-pink-500/30', text: 'text-pink-400' },
    orange: { bar: 'bg-orange-500', border: 'border-orange-500/30', text: 'text-orange-400' },
};

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onClose, availableTags, onCreateTag }) => {
    const [title, setTitle] = useState(note?.title || '');
    const [content, setContent] = useState(note?.content || '');
    const [color, setColor] = useState<NoteColor>(note?.color || 'blue');
    const [tags, setTags] = useState<string[]>(note?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [tempTags, setTempTags] = useState<Tag[]>([]);

    // Pin state
    const [isPinned, setIsPinned] = useState(note?.isPinned || false);
    const [pinnedToTags, setPinnedToTags] = useState<string[]>(note?.pinnedToTags || []);

    // Fullscreen editing state
    const [isEditing, setIsEditing] = useState(!note); // New notes start in edit mode
    const [showMetadataPanel, setShowMetadataPanel] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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

    // Auto-focus when entering edit mode
    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

    // Lock body scroll when fullscreen editor is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Intercept close to check for unsaved changes
    const handleClose = () => {
        if (hasChanges) {
            setShowUnsavedModal(true);
        } else {
            onClose();
        }
    };

    // Handle Escape key to exit editing or close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isEditing && note) {
                    setIsEditing(false);
                } else {
                    handleClose();
                }
            }
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, hasChanges]);

    /**
     * Handles image upload from file input
     */
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = isValidImageFile(file);
        if (!validation.valid) {
            alert(validation.error);
            return;
        }

        setIsUploadingImage(true);
        try {
            const base64 = await fileToBase64(file);
            const compressed = await compressImage(base64, 800, 0.8);
            const markdown = generateImageMarkdown(compressed, file.name.replace(/\.[^/.]+$/, ''));

            const textarea = textareaRef.current;
            if (textarea) {
                const start = textarea.selectionStart;
                const result = insertAtCursor(content, start, markdown);
                setContent(result.text);

                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        textareaRef.current.selectionStart = result.newCursor;
                        textareaRef.current.selectionEnd = result.newCursor;
                        textareaRef.current.focus();
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            alert('Erro ao processar imagem. Tente novamente.');
        } finally {
            setIsUploadingImage(false);
            // Reset input to allow uploading same file again
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    /**
     * Handles paste event to convert HTML clipboard content to Markdown or paste images.
     */
    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        // Check for image in clipboard first
        const imageFile = await extractImageFromClipboard(e.clipboardData);
        if (imageFile) {
            e.preventDefault();
            const validation = isValidImageFile(imageFile);
            if (!validation.valid) {
                alert(validation.error);
                return;
            }

            setIsUploadingImage(true);
            try {
                const base64 = await fileToBase64(imageFile);
                const compressed = await compressImage(base64, 800, 0.8);
                const markdown = generateImageMarkdown(compressed, 'imagem-colada');

                const textarea = textareaRef.current;
                if (textarea) {
                    const start = textarea.selectionStart;
                    const result = insertAtCursor(content, start, markdown);
                    setContent(result.text);

                    requestAnimationFrame(() => {
                        if (textareaRef.current) {
                            textareaRef.current.selectionStart = result.newCursor;
                            textareaRef.current.selectionEnd = result.newCursor;
                            textareaRef.current.focus();
                        }
                    });
                }
            } catch (error) {
                console.error('Erro ao processar imagem colada:', error);
            } finally {
                setIsUploadingImage(false);
            }
            return;
        }

        // Handle HTML paste (existing logic)
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

            if (!tags.includes(tag.id)) {
                setTags([...tags, tag.id]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
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

    // Toolbar action helpers
    const insertMarkdown = (wrapper: string, placeholder?: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const result = wrapSelection(content, start, end, wrapper);
        setContent(result.text);

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
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const before = content.substring(0, lineStart);
        const after = content.substring(lineStart);

        setContent(before + prefix + after);

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = start + prefix.length;
                textareaRef.current.selectionEnd = start + prefix.length;
                textareaRef.current.focus();
            }
        });
    };

    const colorAccent = COLOR_ACCENT_CLASSES[color];

    return (
        <>
            {/* Fullscreen Immersive View */}
            <div className="fixed inset-0 z-50 bg-slate-950 animate-in fade-in duration-300 flex flex-col overflow-hidden">
                {/* Floating Action Bar - Top Right */}
                <div className="fixed top-6 right-6 z-50 flex items-center gap-1 bg-slate-800/80 backdrop-blur-md rounded-xl p-1.5 border border-slate-700/50 shadow-2xl transition-opacity duration-300">
                    {/* Edit/View Toggle */}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2.5 rounded-lg transition-all ${isEditing
                            ? 'bg-purple-600 text-white'
                            : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}
                        title={isEditing ? 'Visualizar' : 'Editar nota'}
                    >
                        {isEditing ? <Eye size={18} /> : <Edit3 size={18} />}
                    </button>

                    {/* Pin Toggle */}
                    <button
                        onClick={() => {
                            setIsPinned(!isPinned);
                            if (!isPinned && pinnedToTags.length === 0 && tags.length > 0) {
                                setPinnedToTags([tags[0]]);
                            }
                        }}
                        className={`p-2.5 rounded-lg transition-all ${isPinned
                            ? 'text-amber-400 bg-amber-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                        title={isPinned ? 'Desafixar nota' : 'Fixar nota'}
                    >
                        <Pin size={18} className={isPinned ? 'fill-current' : ''} />
                    </button>

                    {/* Color Picker Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`p-2.5 rounded-lg transition-all hover:bg-slate-700 ${colorAccent.text}`}
                            title="Cor da nota"
                        >
                            <div className={`w-4 h-4 rounded-full ${colorAccent.bar}`} />
                        </button>

                        {showColorPicker && (
                            <div className="absolute top-full right-0 mt-2 p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex gap-1.5 animate-in fade-in slide-in-from-top-2">
                                {COLOR_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.color}
                                        onClick={() => {
                                            setColor(opt.color);
                                            setShowColorPicker(false);
                                        }}
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${color === opt.color
                                            ? 'border-white scale-110 shadow-lg'
                                            : 'border-transparent opacity-70 hover:opacity-100'
                                            } ${opt.class}`}
                                        title={opt.label}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 bg-slate-600 mx-1" />

                    {/* Save Button - Only when has changes */}
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all animate-in fade-in"
                            title="Salvar (Ctrl+S)"
                        >
                            <Save size={18} />
                        </button>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="p-2.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                        title="Fechar (Esc)"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    <div className="max-w-4xl mx-auto py-16 px-8">
                        {/* Color Accent Bar */}
                        <div className={`w-24 h-1.5 rounded-full mb-8 ${colorAccent.bar} transition-colors`} />

                        {/* Title - Editable or Display */}
                        {isEditing ? (
                            <input
                                ref={titleInputRef}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Título da nota..."
                                className="text-4xl font-bold text-white bg-transparent border-none outline-none w-full mb-8 leading-tight placeholder:text-slate-600"
                            />
                        ) : (
                            <h1
                                onClick={() => setIsEditing(true)}
                                className="text-4xl font-bold text-white mb-8 leading-tight cursor-text hover:text-slate-200 transition-colors"
                            >
                                {title || 'Sem título'}
                            </h1>
                        )}

                        {/* Content Area */}
                        {isEditing ? (
                            <div className="space-y-4">
                                {/* Markdown Toolbar */}
                                <div className="flex items-center gap-1 p-2 bg-slate-900/50 rounded-xl border border-slate-800 sticky top-0 z-10">
                                    <button
                                        onClick={() => insertMarkdown('**')}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Negrito (Ctrl+B)"
                                    >
                                        <Bold size={16} />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('*')}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Itálico (Ctrl+I)"
                                    >
                                        <Italic size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const textarea = textareaRef.current;
                                            if (!textarea) return;
                                            const start = textarea.selectionStart;
                                            const end = textarea.selectionEnd;
                                            const result = insertLink(content, start, end);
                                            setContent(result.text);
                                            requestAnimationFrame(() => {
                                                if (textareaRef.current) {
                                                    textareaRef.current.selectionStart = result.newStart;
                                                    textareaRef.current.selectionEnd = result.newEnd;
                                                    textareaRef.current.focus();
                                                }
                                            });
                                        }}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Link (Ctrl+K)"
                                    >
                                        <Link2 size={16} />
                                    </button>
                                    <div className="w-px h-5 bg-slate-700 mx-1" />
                                    <button
                                        onClick={() => insertPrefix('# ')}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Título"
                                    >
                                        <Heading size={16} />
                                    </button>
                                    <button
                                        onClick={() => insertPrefix('- ')}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Lista"
                                    >
                                        <List size={16} />
                                    </button>
                                    <button
                                        onClick={() => insertMarkdown('`')}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                        title="Código inline"
                                    >
                                        <Code size={16} />
                                    </button>
                                    <div className="w-px h-5 bg-slate-700 mx-1" />
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={isUploadingImage}
                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                        title="Inserir imagem"
                                    >
                                        {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                                    </button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />

                                    <span className="ml-auto text-xs text-slate-500">
                                        {content.length} caracteres
                                    </span>
                                </div>

                                {/* Textarea */}
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onPaste={handlePaste}
                                    onKeyDown={handleTextareaKeyDown}
                                    placeholder="Comece a escrever sua nota... Use Markdown para formatação!"
                                    className="w-full min-h-[60vh] bg-transparent text-white text-lg leading-relaxed resize-none outline-none placeholder:text-slate-600 font-sans"
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditing(true)}
                                className="prose prose-invert prose-lg max-w-none cursor-text hover:bg-slate-900/20 rounded-xl -mx-4 px-4 py-2 transition-colors"
                            >
                                {content.trim() ? (
                                    <MarkdownRenderer content={content} />
                                ) : (
                                    <p className="text-slate-500 italic text-lg">Clique para editar esta nota...</p>
                                )}
                            </div>
                        )}

                        {/* Tags Display (always visible) */}
                        {tags.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-slate-800">
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tagStr, idx) => {
                                        const { label, color: tagColor } = getTagDisplay(tagStr);
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

                {/* Bottom Metadata Panel */}
                <div className={`border-t border-slate-800 bg-slate-900/95 backdrop-blur transition-all ${showMetadataPanel ? 'max-h-96' : 'max-h-14'}`}>
                    {/* Toggle Header */}
                    <button
                        onClick={() => setShowMetadataPanel(!showMetadataPanel)}
                        className="w-full px-6 py-3 flex items-center justify-between text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="text-sm font-medium flex items-center gap-2">
                            {tags.length > 0 && (
                                <span className="px-2 py-0.5 bg-slate-800 rounded text-xs">{tags.length} tags</span>
                            )}
                            {isPinned && (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs flex items-center gap-1">
                                    <Pin size={10} /> Fixada
                                </span>
                            )}
                            <span className="text-slate-500">Metadados e Tags</span>
                        </span>
                        {showMetadataPanel ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>

                    {/* Expanded Panel */}
                    {showMetadataPanel && (
                        <div className="px-6 pb-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                            {/* Tags Section */}
                            <div>
                                <label className="block text-xs text-slate-500 uppercase font-bold mb-3">Tags</label>

                                {/* Available Smart Tags */}
                                {availableTags.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {availableTags.map(tag => {
                                            const isSelected = tags.includes(tag.id);
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

                                {/* New Tag Input */}
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder="Nova tag (Enter para adicionar)..."
                                    className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                />

                                {/* Selected Tags with Remove */}
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {tags.map((tagStr, idx) => {
                                            const { label, color: tagColor, isSmart } = getTagDisplay(tagStr);
                                            return (
                                                <span
                                                    key={idx}
                                                    className={`text-xs px-3 py-1.5 ${isSmart ? tagColor : 'bg-slate-700'} text-slate-100 rounded-full flex items-center gap-2 border border-white/10`}
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

                            {/* Pin Section */}
                            {isPinned && tags.length > 0 && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                    <p className="text-xs text-slate-500 mb-2">Fixar em quais tags:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tagStr) => {
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
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Save/Cancel Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-lg flex items-center gap-2"
                                >
                                    {isPinned && <Pin size={14} />}
                                    Salvar Nota
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
