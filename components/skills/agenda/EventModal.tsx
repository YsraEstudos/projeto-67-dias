/**
 * EventModal Component
 * 
 * Modal to create or edit a custom calendar event
 */
import React, { useState, useEffect } from 'react';
import { X, Calendar, Palette } from 'lucide-react';
import { CalendarEvent } from '../../../types';

const COLORS = [
    { name: 'emerald', label: 'Verde' },
    { name: 'blue', label: 'Azul' },
    { name: 'purple', label: 'Roxo' },
    { name: 'rose', label: 'Rosa' },
    { name: 'amber', label: 'Âmbar' },
    { name: 'cyan', label: 'Ciano' },
    { name: 'orange', label: 'Laranja' },
    { name: 'pink', label: 'Pink' },
    { name: 'indigo', label: 'Índigo' },
    { name: 'teal', label: 'Teal' },
];

const DURATION_PRESETS = [
    { label: '30min', value: 30 },
    { label: '1h', value: 60 },
    { label: '1h30', value: 90 },
    { label: '2h', value: 120 },
];

interface EventModalProps {
    event?: CalendarEvent;
    onClose: () => void;
    onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
    onDelete?: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
    event,
    onClose,
    onSave,
    onDelete
}) => {
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [color, setColor] = useState(event?.color || 'purple');
    const [duration, setDuration] = useState(event?.defaultDurationMinutes || 60);

    const isEditing = !!event;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            description: description.trim() || undefined,
            color,
            defaultDurationMinutes: duration
        });
        onClose();
    };

    const handleDelete = () => {
        if (onDelete && confirm('Excluir este evento?')) {
            onDelete();
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-purple-400" size={20} />
                            <h3 className="font-bold text-white text-lg">
                                {isEditing ? 'Editar Evento' : 'Novo Evento'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Title */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Título *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Reunião, Academia, Almoço..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 outline-none placeholder:text-slate-600"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Descrição (opcional)</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Detalhes do evento..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white resize-none h-20 focus:border-purple-500 outline-none placeholder:text-slate-600"
                            />
                        </div>

                        {/* Color picker */}
                        <div>
                            <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                                <Palette size={12} />
                                Cor
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setColor(c.name)}
                                        className={`w-8 h-8 rounded-full bg-${c.name}-500 border-2 transition-all ${color === c.name
                                                ? 'border-white scale-110'
                                                : 'border-transparent hover:scale-105'
                                            }`}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Default duration */}
                        <div>
                            <label className="text-xs text-slate-500 mb-2 block">Duração padrão</label>
                            <div className="flex flex-wrap gap-2">
                                {DURATION_PRESETS.map(preset => (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => setDuration(preset.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${duration === preset.value
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 border-t border-slate-700">
                        {isEditing && onDelete ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="text-red-400 hover:text-red-300 text-sm transition-colors"
                            >
                                Excluir evento
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                            >
                                {isEditing ? 'Salvar' : 'Criar Evento'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
