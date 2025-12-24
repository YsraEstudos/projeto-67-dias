import React, { useState } from 'react';
import { X, Palette, Save, MessageSquare } from 'lucide-react';
import { useWeeklyAgendaStore } from '../../../stores/weeklyAgendaStore';
import { AgendaActivity } from '../../../types';

interface ActivityModalProps {
    existingActivity?: AgendaActivity;
    onClose: () => void;
}

const COLORS = [
    { name: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { name: 'emerald', label: 'Verde', class: 'bg-emerald-500' },
    { name: 'purple', label: 'Roxo', class: 'bg-purple-500' },
    { name: 'rose', label: 'Rosa', class: 'bg-rose-500' },
    { name: 'amber', label: 'Amarelo', class: 'bg-amber-500' },
    { name: 'cyan', label: 'Ciano', class: 'bg-cyan-500' },
    { name: 'orange', label: 'Laranja', class: 'bg-orange-500' },
    { name: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
];

export const ActivityModal: React.FC<ActivityModalProps> = ({
    existingActivity,
    onClose
}) => {
    const { addActivity, updateActivity, deleteActivity } = useWeeklyAgendaStore();

    const [title, setTitle] = useState(existingActivity?.title || '');
    const [dailyGoalMinutes, setDailyGoalMinutes] = useState(existingActivity?.dailyGoalMinutes || 30);
    const [color, setColor] = useState(existingActivity?.color || 'blue');
    const [notes, setNotes] = useState(existingActivity?.notes || '');

    const isEditing = !!existingActivity;

    const handleSave = () => {
        if (!title.trim()) return;

        if (isEditing) {
            updateActivity(existingActivity.id, {
                title: title.trim(),
                dailyGoalMinutes,
                color,
                notes: notes.trim() || undefined
            });
        } else {
            addActivity({
                title: title.trim(),
                dailyGoalMinutes,
                color,
                notes: notes.trim() || undefined
            });
        }
        onClose();
    };

    const handleDelete = () => {
        if (!existingActivity) return;
        if (confirm('Remover esta atividade? Todo o histórico será perdido.')) {
            deleteActivity(existingActivity.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-white text-lg">
                        {isEditing ? 'Editar Atividade' : 'Nova Atividade'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">
                            Nome da Atividade *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Ex: Leitura, Exercício, Meditação..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Daily Goal */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">
                            Meta Diária Padrão
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="5"
                                max="180"
                                step="5"
                                value={dailyGoalMinutes}
                                onChange={e => setDailyGoalMinutes(parseInt(e.target.value))}
                                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)' }}
                            />
                            <div className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center">
                                <span className="text-white font-bold">{dailyGoalMinutes}</span>
                                <span className="text-slate-500 text-xs ml-1">min</span>
                            </div>
                        </div>
                    </div>

                    {/* Color */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                            <Palette size={12} />
                            Cor
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setColor(c.name)}
                                    className={`w-8 h-8 rounded-full ${c.class} transition-all ${color === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                                        }`}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 mb-2">
                            <MessageSquare size={12} />
                            Notas (opcional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Observações, lembretes..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    {isEditing ? (
                        <button
                            onClick={handleDelete}
                            className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                        >
                            Remover
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center gap-2 transition-colors"
                        >
                            <Save size={16} />
                            {isEditing ? 'Salvar' : 'Criar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityModal;
