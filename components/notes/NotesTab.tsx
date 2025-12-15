import React, { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Search, StickyNote, Pin, ChevronRight } from 'lucide-react';
import { Note, Tag } from '../../types';
import { useNotesStore } from '../../stores/notesStore';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { TagFilter } from './TagFilter';
import { TagManager } from './TagManager';
import { generateUUID } from '../../utils/uuid';

type SortOption = 'recent' | 'oldest' | 'alphabetical' | 'color';

interface NotesTabProps {
    isAuthLoading?: boolean;
}

export const NotesTab: React.FC<NotesTabProps> = ({ isAuthLoading = false }) => {
    // Zustand store
    // Zustand store
    const { notes, tags } = useNotesStore(useShallow(state => ({
        notes: state.notes,
        tags: state.tags
    })));

    const {
        addNote,
        updateNote,
        deleteNote,
        addTag,
        updateTag,
        deleteTag
    } = useNotesStore(useShallow(state => ({
        addNote: state.addNote,
        updateNote: state.updateNote,
        deleteNote: state.deleteNote,
        addTag: state.addTag,
        updateTag: state.updateTag,
        deleteTag: state.deleteTag
    })));


    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);

    // Derive all unique tags from notes + global tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => note.tags.forEach(tagStr => {
            const smartTag = tags.find(t => t.id === tagStr);
            if (smartTag) {
                tagSet.add(smartTag.label);
            } else {
                tagSet.add(tagStr);
            }
        }));
        tags.forEach(tag => tagSet.add(tag.label));
        return Array.from(tagSet).sort();
    }, [notes, tags]);

    // Tag counts
    const tagCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        notes.forEach(note => {
            note.tags.forEach(tagStr => {
                const smartTag = tags.find(t => t.id === tagStr);
                const resolvedTag = smartTag ? smartTag.label : tagStr;
                counts[resolvedTag] = (counts[resolvedTag] || 0) + 1;
            });
        });
        return counts;
    }, [notes, tags]);

    const resolveTagToLabel = (tagStr: string): string => {
        const smartTag = tags.find(t => t.id === tagStr);
        return smartTag ? smartTag.label : tagStr;
    };

    // Separate pinned and unpinned notes
    const pinnedNotes = useMemo(() => {
        return notes.filter(note => note.isPinned);
    }, [notes]);

    // Group pinned notes by tag
    const pinnedByTag = useMemo(() => {
        const groups: Record<string, Note[]> = {};

        pinnedNotes.forEach(note => {
            const pinnedToTags = note.pinnedToTags || [];
            if (pinnedToTags.length === 0) {
                // If pinned but no specific tag, group under "Geral"
                if (!groups['__general__']) groups['__general__'] = [];
                groups['__general__'].push(note);
            } else {
                pinnedToTags.forEach(tagId => {
                    const label = resolveTagToLabel(tagId);
                    if (!groups[label]) groups[label] = [];
                    if (!groups[label].find(n => n.id === note.id)) {
                        groups[label].push(note);
                    }
                });
            }
        });

        return groups;
    }, [pinnedNotes, tags]);

    // Filtered and sorted notes (excluding pinned if showing pinned section)
    const filteredNotes = useMemo(() => {
        let filtered = showPinnedOnly ? notes.filter(n => n.isPinned) : notes;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (note) =>
                    note.title.toLowerCase().includes(term) ||
                    note.content.toLowerCase().includes(term) ||
                    note.tags.some((tag) => resolveTagToLabel(tag).toLowerCase().includes(term))
            );
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter((note) =>
                note.tags.some((tag) => selectedTags.includes(resolveTagToLabel(tag)))
            );
        }

        const sorted = [...filtered];
        switch (sortBy) {
            case 'recent':
                sorted.sort((a, b) => b.updatedAt - a.updatedAt);
                break;
            case 'oldest':
                sorted.sort((a, b) => a.updatedAt - b.updatedAt);
                break;
            case 'alphabetical':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'color':
                sorted.sort((a, b) => a.color.localeCompare(b.color));
                break;
        }

        return sorted;
    }, [notes, searchTerm, selectedTags, sortBy, tags, showPinnedOnly]);

    const handleSaveNote = useCallback((note: Note) => {
        const existing = notes.find((n) => n.id === note.id);
        if (existing) {
            updateNote(note.id, note);
        } else {
            addNote(note);
        }
    }, [notes, addNote, updateNote]);

    const handleDeleteNote = useCallback((id: string) => {
        deleteNote(id);
    }, [deleteNote]);

    const handleDuplicateNote = useCallback((id: string) => {
        const note = notes.find((n) => n.id === id);
        if (!note) return;
        const duplicate: Note = {
            ...note,
            id: Date.now().toString(),
            title: `${note.title} (Cópia)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPinned: false,
            pinnedToTags: [],
        };
        addNote(duplicate);
    }, [notes, addNote]);

    const handleToggleTag = useCallback((tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    }, []);

    const handleClearAllTags = useCallback(() => {
        setSelectedTags([]);
    }, []);

    const handleSaveTag = useCallback((tag: Tag) => {
        const existing = tags.find(t => t.id === tag.id);
        if (existing) {
            updateTag(tag.id, tag);
        } else {
            addTag(tag);
        }
    }, [tags, addTag, updateTag]);

    const handleDeleteTag = useCallback((tagId: string) => {
        if (confirm('Tem certeza que deseja excluir esta tag?')) {
            deleteTag(tagId);
        }
    }, [deleteTag]);


    const openCreateModal = useCallback(() => setIsCreating(true), []);
    const closeEditor = useCallback(() => {
        setIsCreating(false);
        setEditingNote(null);
    }, []);

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
        );
    }

    const pinnedTagKeys = Object.keys(pinnedByTag).sort((a, b) => {
        if (a === '__general__') return 1;
        if (b === '__general__') return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <StickyNote size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Minhas Notas</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>{notes.length} nota{notes.length !== 1 ? 's' : ''}</span>
                            {pinnedNotes.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="text-amber-400">{pinnedNotes.length} fixada{pinnedNotes.length !== 1 ? 's' : ''}</span>
                                </>
                            )}
                            <span>•</span>
                            <button onClick={() => setIsTagManagerOpen(true)} className="hover:text-purple-400 hover:underline transition-colors">
                                Gerenciar Tags
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-900/20 font-bold transition-all hover:scale-105"
                >
                    <Plus size={18} /> Nova Nota
                </button>
            </div>

            {/* Search and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar notas por título, conteúdo ou tags..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:border-purple-500 outline-none"
                    />
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Ordenar notas por"
                    title="Ordenar notas"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 outline-none"
                >
                    <option value="recent">🕒 Mais Recentes</option>
                    <option value="oldest">📅 Mais Antigas</option>
                    <option value="alphabetical">🔤 Alfabética</option>
                    <option value="color">🎨 Por Cor</option>
                </select>

                {pinnedNotes.length > 0 && (
                    <button
                        onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${showPinnedOnly
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <Pin size={16} />
                        {showPinnedOnly ? 'Mostrando fixadas' : 'Ver fixadas'}
                    </button>
                )}
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
                <div className="mb-6">
                    <TagFilter
                        allTags={allTags}
                        selectedTags={selectedTags}
                        onToggleTag={handleToggleTag}
                        onClearAll={handleClearAllTags}
                        tagCounts={tagCounts}
                    />
                </div>
            )}

            {/* Pinned Notes Section */}
            {pinnedTagKeys.length > 0 && !searchTerm && selectedTags.length === 0 && !showPinnedOnly && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Pin size={18} className="text-amber-400" />
                        <h3 className="text-lg font-bold text-white">Notas Fixadas</h3>
                    </div>

                    <div className="space-y-4">
                        {pinnedTagKeys.map(tagKey => {
                            const notesInTag = pinnedByTag[tagKey];
                            const displayLabel = tagKey === '__general__' ? 'Geral' : tagKey;
                            const tagData = tags.find(t => t.label === tagKey);

                            return (
                                <div key={tagKey} className="bg-slate-800/50 rounded-xl p-4 border border-amber-500/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span
                                            className={`w-3 h-3 rounded-full ${tagData?.color || 'bg-slate-600'}`}
                                        />
                                        <span className="text-sm font-medium text-slate-300">
                                            {displayLabel}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            ({notesInTag.length})
                                        </span>
                                        <ChevronRight size={14} className="text-slate-600 ml-auto" />
                                    </div>

                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                                        {notesInTag.map(note => (
                                            <div key={note.id} className="flex-shrink-0 w-72">
                                                <NoteCard
                                                    note={note}
                                                    onClick={setEditingNote}
                                                    onDelete={handleDeleteNote}
                                                    onDuplicate={handleDuplicateNote}
                                                    availableTags={tags}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <hr className="border-slate-800 my-6" />
                </div>
            )}

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                    <StickyNote size={64} className="text-slate-700 mb-4" />
                    <p className="text-slate-500 text-lg mb-2">
                        {notes.length === 0 ? 'Nenhuma nota criada ainda' : 'Nenhuma nota encontrada com os filtros atuais'}
                    </p>
                    <p className="text-slate-600 text-sm mb-6">
                        {notes.length === 0 ? 'Comece criando sua primeira nota!' : 'Tente ajustar os filtros ou a busca'}
                    </p>
                    {notes.length === 0 && (
                        <button
                            onClick={openCreateModal}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
                        >
                            Criar Primeira Nota
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {!showPinnedOnly && pinnedTagKeys.length > 0 && !searchTerm && selectedTags.length === 0 && (
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Todas as Notas</h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onClick={setEditingNote}
                                onDelete={handleDeleteNote}
                                onDuplicate={handleDuplicateNote}
                                availableTags={tags}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Editor Modal */}
            {(isCreating || editingNote) && (
                <NoteEditor
                    note={editingNote}
                    onSave={handleSaveNote}
                    onClose={closeEditor}
                    availableTags={tags}
                    onCreateTag={(label) => {
                        const existing = tags.find(t => t.label.toLowerCase() === label.toLowerCase());
                        if (existing) return existing;

                        const colors = ['bg-slate-600', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
                        const randomColor = colors[Math.floor(Math.random() * colors.length)];

                        const newTag: Tag = {
                            id: generateUUID(),
                            label: label,
                            color: randomColor,
                            createdAt: Date.now()
                        };
                        handleSaveTag(newTag);
                        return newTag;
                    }}
                />
            )}

            {isTagManagerOpen && (
                <TagManager
                    tags={tags}
                    onSaveTag={handleSaveTag}
                    onDeleteTag={handleDeleteTag}
                    onClose={() => setIsTagManagerOpen(false)}
                />
            )}
        </div>
    );
};
