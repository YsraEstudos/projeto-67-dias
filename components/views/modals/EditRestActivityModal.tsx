import React, { useState, useMemo } from 'react';
import { Pencil, X, Link as LinkIcon, ExternalLink, Trash2, Plus } from 'lucide-react';
import { RestActivity, RestActivityLink } from '../../../types';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { UnsavedChangesModal } from '../../shared/UnsavedChangesModal';

interface EditRestActivityModalProps {
    activity: RestActivity;
    onClose: () => void;
    onSave: (updated: RestActivity) => void;
}

const EditRestActivityModal: React.FC<EditRestActivityModalProps> = ({ activity, onClose, onSave }) => {
    const [title, setTitle] = useState(activity.title);
    const [notes, setNotes] = useState(activity.notes || '');
    const [type, setType] = useState(activity.type);
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>(activity.daysOfWeek || []);
    const [links, setLinks] = useState<RestActivityLink[]>(activity.links || []);
    const [newLinkLabel, setNewLinkLabel] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Memoize initial values for comparison
    const initialValues = useMemo(() => ({
        title: activity.title,
        notes: activity.notes || '',
        type: activity.type,
        daysOfWeek: activity.daysOfWeek || [],
        links: activity.links || [],
    }), []);

    // Track unsaved changes
    const { hasChanges } = useUnsavedChanges({
        initialValue: initialValues,
        currentValue: { title, notes, type, daysOfWeek, links },
    });

    // Intercept close to check for unsaved changes
    const handleClose = () => {
        if (hasChanges) {
            setShowUnsavedModal(true);
        } else {
            onClose();
        }
    };

    const handleAddLink = () => {
        if (!newLinkUrl.trim()) return;

        // Adiciona https:// se não tiver protocolo
        let url = newLinkUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const newLink: RestActivityLink = {
            id: Date.now().toString(),
            label: newLinkLabel.trim() || url,
            url
        };

        setLinks(prev => [...prev, newLink]);
        setNewLinkLabel('');
        setNewLinkUrl('');
    };

    const handleUpdateLink = (id: string, label: string, url: string) => {
        setLinks(prev => prev.map(link =>
            link.id === id ? { ...link, label: label || url, url } : link
        ));
        setEditingLinkId(null);
    };

    const handleDeleteLink = (id: string) => {
        setLinks(prev => prev.filter(link => link.id !== id));
    };

    const handleSave = () => {
        if (!title.trim()) return;
        if (type === 'WEEKLY' && daysOfWeek.length === 0) return;

        const updated: RestActivity = {
            ...activity,
            title,
            notes: notes.trim() || undefined,
            type,
            daysOfWeek: type === 'WEEKLY' ? daysOfWeek : undefined,
            specificDate: type === 'ONCE' ? activity.specificDate : undefined,
            links: links.length > 0 ? links : undefined
        };

        onSave(updated);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                {/* Clickable backdrop */}
                <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
                <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Pencil size={18} className="text-cyan-500" /> Editar Atividade
                        </h3>
                        <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Atividade</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
                                placeholder="Ex: Alongamento..."
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Frequência</label>
                            <div className="flex gap-2">
                                {(['DAILY', 'WEEKLY', 'ONCE'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${type === t
                                            ? 'bg-cyan-950 text-cyan-400 border-cyan-500/50'
                                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        {t === 'DAILY' ? 'DIÁRIO' : t === 'WEEKLY' ? 'SEMANAL' : 'HOJE/ÚNICO'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Weekly Days Selection */}
                        {type === 'WEEKLY' && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-purple-400 uppercase mb-1">Dias da Semana</label>
                                <div className="grid grid-cols-7 gap-1">
                                    {[
                                        { day: 0, label: 'D' }, { day: 1, label: 'S' }, { day: 2, label: 'T' },
                                        { day: 3, label: 'Q' }, { day: 4, label: 'Q' }, { day: 5, label: 'S' },
                                        { day: 6, label: 'S' }
                                    ].map(({ day, label }) => {
                                        const isSelected = daysOfWeek.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setDaysOfWeek(prev =>
                                                    isSelected ? prev.filter(d => d !== day) : [...prev, day]
                                                )}
                                                className={`aspect-square rounded-md text-xs font-bold transition-all ${isSelected
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas / Comentários</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none min-h-[80px] resize-none"
                                placeholder="Instruções, contagem de repetições..."
                            />
                            <p className="text-[10px] text-slate-600 mt-1">
                                💡 Links colados aqui serão automaticamente clicáveis
                            </p>
                        </div>

                        {/* Links Section */}
                        <div className="border-t border-slate-800 pt-4">
                            <label className="block text-xs font-bold text-cyan-400 uppercase mb-3 flex items-center gap-1.5">
                                <LinkIcon size={12} />
                                Links Rápidos
                            </label>

                            {/* Existing Links */}
                            {links.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {links.map((link) => (
                                        <div
                                            key={link.id}
                                            className="group flex items-center gap-2 p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-all"
                                        >
                                            {editingLinkId === link.id ? (
                                                // Edit Mode
                                                <div className="flex-1 flex flex-col gap-2">
                                                    <input
                                                        type="text"
                                                        value={link.label}
                                                        onChange={(e) => handleUpdateLink(link.id, e.target.value, link.url)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyan-500 outline-none"
                                                        placeholder="Rótulo do link"
                                                    />
                                                    <input
                                                        type="url"
                                                        value={link.url}
                                                        onChange={(e) => handleUpdateLink(link.id, link.label, e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyan-500 outline-none"
                                                        placeholder="URL"
                                                    />
                                                    <button
                                                        onClick={() => setEditingLinkId(null)}
                                                        className="self-end text-xs text-cyan-400 hover:text-cyan-300"
                                                    >
                                                        Concluir
                                                    </button>
                                                </div>
                                            ) : (
                                                // View Mode
                                                <>
                                                    <ExternalLink size={14} className="text-cyan-500 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-slate-300 truncate">{link.label}</div>
                                                        <div className="text-[10px] text-slate-500 truncate">{link.url}</div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setEditingLinkId(link.id)}
                                                            className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-700 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLink(link.id)}
                                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                                                            title="Remover"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Link */}
                            <div className="bg-slate-950/50 rounded-xl border border-dashed border-slate-700 p-3">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newLinkLabel}
                                        onChange={(e) => setNewLinkLabel(e.target.value)}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                        placeholder="Rótulo (opcional)"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newLinkUrl}
                                        onChange={(e) => setNewLinkUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                                        placeholder="Cole o link aqui..."
                                    />
                                    <button
                                        onClick={handleAddLink}
                                        disabled={!newLinkUrl.trim()}
                                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        <Plus size={14} />
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                        <button onClick={handleClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim() || (type === 'WEEKLY' && daysOfWeek.length === 0)}
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-900/20"
                        >
                            Salvar Alterações
                        </button>
                    </div>
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

export default EditRestActivityModal;
