import React, { useState, useEffect, useMemo } from 'react';
import { StickyNote, Save, X, Search, Pencil, Trash2, Check } from 'lucide-react';

interface QuickNote {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

const STORAGE_KEY = 'p67_quicknotes';

const generateId = (): string => {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
    } catch {
        // fall through to fallback
    }
    return Date.now().toString();
};

const loadNotes = (): QuickNote[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (n): n is QuickNote =>
                !!n &&
                typeof n.id === 'string' &&
                typeof n.content === 'string' &&
                typeof n.createdAt === 'number' &&
                typeof n.updatedAt === 'number'
        );
    } catch {
        return [];
    }
};

const formatDate = (ts: number): string =>
    new Date(ts).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export const QuickNotesTool: React.FC = () => {
    const [notes, setNotes] = useState<QuickNote[]>(loadNotes);
    const [draft, setDraft] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    // Auto-save to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch {
            // storage unavailable or full — ignore
        }
    }, [notes]);

    const handleSave = () => {
        const content = draft.trim();
        if (!content) return;

        const now = Date.now();
        if (editingId) {
            setNotes(prev =>
                prev.map(n => (n.id === editingId ? { ...n, content, updatedAt: now } : n))
            );
        } else {
            setNotes(prev => [
                ...prev,
                { id: generateId(), content, createdAt: now, updatedAt: now },
            ]);
        }
        setDraft('');
        setEditingId(null);
    };

    const handleEdit = (note: QuickNote) => {
        setEditingId(note.id);
        setDraft(note.content);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setDraft('');
    };

    const handleDelete = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (editingId === id) {
            setEditingId(null);
            setDraft('');
        }
    };

    const sortedNotes = useMemo(
        () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt),
        [notes]
    );

    const filteredNotes = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return sortedNotes;
        return sortedNotes.filter(n => n.content.toLowerCase().includes(query));
    }, [sortedNotes, search]);

    return (
        <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300">
            {/* Editor */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-3 text-xs uppercase font-bold">
                    <StickyNote size={14} /> Nova nota
                </div>
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Escreva sua nota rápida..."
                />
                <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className="text-xs text-slate-500">
                        {draft.length} {draft.length === 1 ? 'caractere' : 'caracteres'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Check size={12} /> Salvo automaticamente
                    </span>
                    <div className="flex-1" />
                    <button
                        onClick={handleSave}
                        disabled={!draft.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <Save size={16} /> Salvar
                    </button>
                    {editingId && (
                        <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95 text-sm font-medium"
                        >
                            <X size={16} /> Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* Lista de notas */}
            {notes.length > 0 && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-3">
                        <span className="text-sm text-slate-400">
                            {filteredNotes.length} {filteredNotes.length === 1 ? 'nota' : 'notas'}
                        </span>
                        {notes.length >= 3 && (
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-48 bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="Buscar notas..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                        {filteredNotes.map((note) => (
                            <div
                                key={note.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors flex flex-col gap-2"
                            >
                                <p className="text-sm text-slate-200 whitespace-pre-wrap break-words line-clamp-4">
                                    {note.content || <em className="text-slate-500">Nota vazia</em>}
                                </p>
                                <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                                    <span className="text-xs text-slate-500">{formatDate(note.updatedAt)}</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEdit(note)}
                                            aria-label={`Editar nota: ${note.content.slice(0, 30)}`}
                                            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            aria-label={`Excluir nota: ${note.content.slice(0, 30)}`}
                                            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Estado vazio */}
            {notes.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 mt-10 py-8">
                    <StickyNote size={48} className="text-slate-700" />
                    <p className="text-slate-500">Nenhuma nota ainda. Escreva algo acima para começar!</p>
                </div>
            )}
        </div>
    );
};
