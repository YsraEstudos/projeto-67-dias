/**
 * BlockEditModal Component
 * 
 * Modal to edit a scheduled block's time and duration
 */
import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, Calendar } from 'lucide-react';
import { ScheduledBlock } from '../../../types';

interface BlockEditModalProps {
    block: ScheduledBlock;
    title: string;
    color: string;
    onClose: () => void;
    onUpdate: (updates: Partial<ScheduledBlock>) => void;
    onDelete: () => void;
}

// Duration presets
const DURATION_PRESETS = [
    { label: '30min', value: 30 },
    { label: '1h', value: 60 },
    { label: '1h30', value: 90 },
    { label: '2h', value: 120 },
    { label: '2h30', value: 150 },
    { label: '3h', value: 180 },
];

export const BlockEditModal: React.FC<BlockEditModalProps> = ({
    block,
    title,
    color,
    onClose,
    onUpdate,
    onDelete
}) => {
    const [startHour, setStartHour] = useState(block.startHour);
    const [startMinute, setStartMinute] = useState(block.startMinute);
    const [duration, setDuration] = useState(block.durationMinutes);
    const [notes, setNotes] = useState(block.notes || '');

    // Calculate end time
    const endMinutes = startHour * 60 + startMinute + duration;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMinute = endMinutes % 60;

    const handleSave = () => {
        onUpdate({
            startHour,
            startMinute,
            durationMinutes: duration,
            notes: notes.trim() || undefined
        });
        onClose();
    };

    const handleDelete = () => {
        if (confirm('Remover este bloco da agenda?')) {
            onDelete();
            onClose();
        }
    };

    // Format date for display
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
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
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${color}-500`} />
                        <h3 className="font-bold text-white text-lg">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Date display */}
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar size={16} />
                        <span className="capitalize">{formatDate(block.date)}</span>
                    </div>

                    {/* Time pickers */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Início</label>
                            <div className="flex items-center gap-1">
                                <select
                                    value={startHour}
                                    onChange={e => setStartHour(parseInt(e.target.value))}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 outline-none"
                                >
                                    {Array.from({ length: 18 }, (_, i) => i + 6).map(h => (
                                        <option key={h} value={h}>
                                            {h.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-slate-500">:</span>
                                <select
                                    value={startMinute}
                                    onChange={e => setStartMinute(parseInt(e.target.value))}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-emerald-500 outline-none"
                                >
                                    {[0, 15, 30, 45].map(m => (
                                        <option key={m} value={m}>
                                            {m.toString().padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Fim</label>
                            <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-2 text-slate-400 text-center">
                                {endHour.toString().padStart(2, '0')}:{endMinute.toString().padStart(2, '0')}
                            </div>
                        </div>
                    </div>

                    {/* Duration presets */}
                    <div>
                        <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                            <Clock size={12} />
                            Duração
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DURATION_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => setDuration(preset.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${duration === preset.value
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom duration input */}
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(Math.max(15, parseInt(e.target.value) || 0))}
                                min={15}
                                step={15}
                                className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-center focus:border-emerald-500 outline-none"
                            />
                            <span className="text-slate-500 text-sm">minutos</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Notas (opcional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Adicione anotações..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white resize-none h-20 focus:border-emerald-500 outline-none placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-700">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                        Remover
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockEditModal;
