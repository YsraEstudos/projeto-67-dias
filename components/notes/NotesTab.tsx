import React, { useState, useMemo } from 'react';
import { Plus, Search, StickyNote, Palette, Calendar } from 'lucide-react';
import { Note, NoteColor } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { TagFilter } from './TagFilter';

type SortOption = 'recent' | 'oldest' | 'alphabetical' | 'color';

export const NotesTab: React.FC = () => {
    const [notes, setNotes] = useStorage<Note[]>('p67_notes', []);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('recent');

    // Derive all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [notes]);

    // Tag counts
    const tagCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        notes.forEach(note => {
            note.tags.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return counts;
    }, [notes]);

    // Filtered and sorted notes
    const filteredNotes = useMemo(() => {
        let filtered = notes;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (note) =>
                    note.title.toLowerCase().includes(term) ||
                    note.content.toLowerCase().includes(term) ||
                    note.tags.some((tag) => tag.toLowerCase().includes(term))
            );
        }

        // Filter by selected tags (OR logic)
        if (selectedTags.length > 0) {
            filtered = filtered.filter((note) => note.tags.some((tag) => selectedTags.includes(tag)));
        }

        // Sort
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
    }, [notes, searchTerm, selectedTags, sortBy]);

    const handleSaveNote = (note: Note) => {
        const existing = notes.find((n) => n.id === note.id);
        if (existing) {
            setNotes(notes.map((n) => (n.id === note.id ? note : n)));
        } else {
            setNotes([note, ...notes]);
        }
    };

    const handleDeleteNote = (id: string) => {
        setNotes(notes.filter((n) => n.id !== id));
    };

    const handleDuplicateNote = (id: string) => {
        const note = notes.find((n) => n.id === id);
        if (note) {
            const duplicate: Note = {
                ...note,
                id: Date.now().toString(),
                title: `${note.title} (Cópia)`,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setNotes([duplicate, ...notes]);
        }
    };

    const handleToggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

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
                        <p className="text-sm text-slate-400">{notes.length} nota{notes.length !== 1 ? 's' : ''} no total</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-900/20 font-bold transition-all hover:scale-105"
                >
                    <Plus size={18} /> Nova Nota
                </button>
            </div>

            {/* Search and Sort */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 outline-none"
                >
                    <option value="recent">🕒 Mais Recentes</option>
                    <option value="oldest">📅 Mais Antigas</option>
                    <option value="alphabetical">🔤 Alfabética</option>
                    <option value="color">🎨 Por Cor</option>
                </select>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
                <div className="mb-6">
                    <TagFilter
                        allTags={allTags}
                        selectedTags={selectedTags}
                        onToggleTag={handleToggleTag}
                        onClearAll={() => setSelectedTags([])}
                        tagCounts={tagCounts}
                    />
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
                            onClick={() => setIsCreating(true)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
                        >
                            Criar Primeira Nota
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredNotes.map((note, index) => (
                        <div key={note.id} style={{ animationDelay: `${index * 50}ms` }}>
                            <NoteCard
                                note={note}
                                onClick={() => setEditingNote(note)}
                                onDelete={handleDeleteNote}
                                onDuplicate={handleDuplicateNote}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Modal */}
            {(isCreating || editingNote) && (
                <NoteEditor
                    note={editingNote}
                    onSave={handleSaveNote}
                    onClose={() => {
                        setIsCreating(false);
                        setEditingNote(null);
                    }}
                />
            )}
        </div>
    );
};
