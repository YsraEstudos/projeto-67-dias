import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Ban, Target, ListChecks, Plus, Save } from 'lucide-react';
import { Habit } from '../../types';

interface HabitModalProps {
    categories: string[];
    habit?: Habit | null;
    onClose: () => void;
    onSave: (habit: Habit) => void;
}

const HabitModal: React.FC<HabitModalProps> = ({ categories, habit, onClose, onSave }) => {
    const [title, setTitle] = useState(habit?.title || '');
    const [category, setCategory] = useState(habit?.category || 'Saúde');

    // Configurações de Meta
    const [goalType, setGoalType] = useState<'BOOLEAN' | 'MAX_TIME' | 'MIN_TIME'>(habit?.goalType || 'BOOLEAN');
    const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>(habit?.frequency || 'DAILY');
    const [targetValue, setTargetValue] = useState<number>(habit?.targetValue || 0);

    const [isNegative, setIsNegative] = useState(habit?.isNegative || false);
    const [subHabits, setSubHabits] = useState<string[]>(habit?.subHabits?.map(s => s.title) || []);
    const [currentSub, setCurrentSub] = useState('');

    // Reset state when modal opens with a new habit or just to be safe
    useEffect(() => {
        if (habit) {
            setTitle(habit.title);
            setCategory(habit.category);
            setGoalType(habit.goalType || 'BOOLEAN');
            setFrequency(habit.frequency || 'DAILY');
            setTargetValue(habit.targetValue || 0);
            setIsNegative(habit.isNegative || false);
            setSubHabits(habit.subHabits?.map(s => s.title) || []);
        } else {
            // Defaults for new habit
            setTitle('');
            setCategory('Saúde');
            setGoalType('BOOLEAN');
            setFrequency('DAILY');
            setTargetValue(0);
            setIsNegative(false);
            setSubHabits([]);
        }
    }, [habit]);

    const addSubHabit = () => {
        if (currentSub.trim()) {
            setSubHabits([...subHabits, currentSub.trim()]);
            setCurrentSub('');
        }
    };

    const removeSubHabit = (index: number) => {
        setSubHabits(subHabits.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!title.trim()) return;

        const newHabit: Habit = {
            id: habit?.id || Date.now().toString(),
            title,
            category,
            // Novos Campos
            goalType,
            frequency,
            targetValue: goalType !== 'BOOLEAN' ? targetValue : undefined,
            // Campos Antigos
            isNegative: goalType === 'BOOLEAN' ? isNegative : undefined,
            subHabits: subHabits.map((t, i) => ({ id: `sh_${Date.now()}_${i}`, title: t })),
            history: habit?.history || {},
            createdAt: habit?.createdAt || Date.now(),
            archived: habit?.archived || false
        };
        onSave(newHabit);
    };

    const applyScreenTimePreset = () => {
        setTitle('Limite de Tempo de Tela');
        setCategory('Pessoal');
        setGoalType('MAX_TIME');
        setFrequency('WEEKLY');
        setTargetValue(600); // 10 horas semanais
        setIsNegative(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-white">{habit ? 'Editar Hábito' : 'Novo Hábito'}</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={20} /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">

                    {/* Preset Button for Screen Time */}
                    <button
                        onClick={applyScreenTimePreset}
                        className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 mb-2"
                    >
                        <ShieldAlert size={14} /> Usar Modelo: Controle de Tempo de Tela
                    </button>

                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Hábito Principal</label>
                        <input
                            autoFocus
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                            placeholder="Ex: Treino Diário"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-1">Categoria</label>
                        <input
                            list="categories-list-habit-modal"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                            placeholder="Selecione ou digite..."
                        />
                        <datalist id="categories-list-habit-modal">
                            <option value="Saúde" />
                            <option value="Pessoal" />
                            <option value="Trabalho" />
                            <option value="Estudos" />
                            <option value="Finanças" />
                            <option value="Casa" />
                            {categories.map(c => <option key={c} value={c} />)}
                        </datalist>
                    </div>

                    {/* TIPO DE META */}
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2">Tipo de Meta</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setGoalType('BOOLEAN')}
                                className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${goalType === 'BOOLEAN' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                                Sim/Não
                            </button>
                            <button
                                onClick={() => setGoalType('MAX_TIME')}
                                className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${goalType === 'MAX_TIME' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                                Limite Máximo
                            </button>
                            <button
                                onClick={() => setGoalType('MIN_TIME')}
                                className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${goalType === 'MIN_TIME' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                            >
                                Meta Mínima
                            </button>
                        </div>

                        {goalType !== 'BOOLEAN' && (
                            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Frequência</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value as any)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white outline-none"
                                    >
                                        <option value="DAILY">Diária</option>
                                        <option value="WEEKLY">Semanal</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Meta (Minutos)</label>
                                    <input
                                        type="number"
                                        value={targetValue}
                                        onChange={e => setTargetValue(Number(e.target.value))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm text-white outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Toggle Hábito Negativo (Apenas para Boolean) */}
                    {goalType === 'BOOLEAN' && (
                        <div
                            onClick={() => setIsNegative(!isNegative)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isNegative
                                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                                : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isNegative ? 'bg-red-500/20' : 'bg-slate-700'}`}>
                                        {isNegative ? <Ban size={18} className="text-red-400" /> : <Target size={18} className="text-slate-400" />}
                                    </div>
                                    <div>
                                        <div className={`font-medium ${isNegative ? 'text-red-400' : 'text-slate-300'}`}>
                                            {isNegative ? 'Hábito Negativo' : 'Hábito Positivo'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {isNegative
                                                ? 'Algo a EVITAR. Marcar = você falhou.'
                                                : 'Algo a FAZER. Marcar = você completou.'}
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full transition-all relative ${isNegative ? 'bg-red-500' : 'bg-slate-600'
                                    }`}>
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${isNegative ? 'right-0.5' : 'left-0.5'
                                        }`} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                            <ListChecks size={14} /> Sub-hábitos (Opcional)
                        </label>
                        {goalType !== 'BOOLEAN' ? (
                            <p className="text-xs text-slate-500 italic">Sub-hábitos desativados para metas numéricas.</p>
                        ) : (
                            <>
                                <p className="text-xs text-slate-500 mb-3">Adicione passos necessários para completar este hábito.</p>

                                <div className="flex gap-2 mb-3">
                                    <input
                                        value={currentSub}
                                        onChange={e => setCurrentSub(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addSubHabit()}
                                        placeholder="Ex: 10 Flexões..."
                                        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                    <button onClick={addSubHabit} className="p-2 bg-slate-700 hover:bg-emerald-600 text-white rounded-lg transition-colors">
                                        <Plus size={18} />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {subHabits.map((sub, i) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700 text-sm">
                                            <span className="text-slate-300">{sub}</span>
                                            <button onClick={() => removeSubHabit(i)} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar Hábito
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HabitModal;
