import React, { useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { RestActivity } from '../../types';

interface RestActivityInputProps {
    selectedDate: Date;
    onAdd: (activityData: Omit<RestActivity, 'id' | 'order' | 'isCompleted'>) => void;
    onCancel: () => void;
}

const RestActivityInput: React.FC<RestActivityInputProps> = ({ selectedDate, onAdd, onCancel }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'ONCE' | 'DAILY' | 'WEEKLY'>('DAILY');
    const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);

    const handleAdd = () => {
        if (!title.trim()) return;
        if (type === 'WEEKLY' && selectedWeekDays.length === 0) return;

        const dateString = selectedDate.toISOString().split('T')[0];

        onAdd({
            title,
            type,
            specificDate: type === 'ONCE' ? dateString : undefined,
            daysOfWeek: type === 'WEEKLY' ? selectedWeekDays : undefined
        });

        setTitle('');
        setSelectedWeekDays([]);
    };

    return (
        <div className="mb-6 bg-slate-800 rounded-2xl border border-slate-700 p-5 animate-in slide-in-from-top-4 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
                <Plus size={20} className="text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Adicionar Descanso
                </h3>
            </div>

            <div className="space-y-3">
                {/* Input Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Nome da atividade (ex: Alongamento de pernas)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none placeholder:text-slate-600"
                    autoFocus
                />

                {/* Type Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setType('DAILY');
                            setSelectedWeekDays([]);
                        }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all ${type === 'DAILY'
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                            }`}
                    >
                        DIÁRIO
                    </button>
                    <button
                        onClick={() => setType('WEEKLY')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg border transition-all ${type === 'WEEKLY'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                            : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                            }`}
                    >
                        SEMANAL
                    </button>
                </div>

                {/* Days Selector */}
                {type === 'WEEKLY' && (
                    <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <CalendarDays size={12} />
                            Selecione os dias
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                            {[
                                { day: 0, label: 'D' },
                                { day: 1, label: 'S' },
                                { day: 2, label: 'T' },
                                { day: 3, label: 'Q' },
                                { day: 4, label: 'Q' },
                                { day: 5, label: 'S' },
                                { day: 6, label: 'S' }
                            ].map(({ day, label }) => {
                                const isSelected = selectedWeekDays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            setSelectedWeekDays(prev =>
                                                isSelected
                                                    ? prev.filter(d => d !== day)
                                                    : [...prev, day].sort()
                                            );
                                        }}
                                        className={`aspect-square rounded-md text-[10px] font-bold transition-all transform hover:scale-110 ${isSelected
                                            ? 'bg-purple-500 text-white border border-purple-400 shadow-md shadow-purple-500/50 scale-105'
                                            : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-purple-500/50 hover:text-purple-400'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedWeekDays.length > 0 && (
                            <div className="mt-1.5 text-[10px] text-purple-400/80 text-center animate-in fade-in">
                                {selectedWeekDays.length} {selectedWeekDays.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-slate-900 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!title.trim() || (type === 'WEEKLY' && selectedWeekDays.length === 0)}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-cyan-900/20 hover:scale-105"
                    >
                        Adicionar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestActivityInput;
