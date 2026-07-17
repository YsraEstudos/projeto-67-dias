import React, { useState } from 'react';
import { Plus, X, AlertTriangle, Link2, Zap } from 'lucide-react';
import { HabitConsequence, Habit } from '../../types';

interface ConsequenceEditorProps {
    consequences: HabitConsequence[];
    onChange: (consequences: HabitConsequence[]) => void;
    allHabits: Habit[];        // All habits for condition selection
    currentHabitId?: string;   // Current habit ID (to exclude from conditions)
}

const ConsequenceEditor: React.FC<ConsequenceEditorProps> = ({
    consequences,
    onChange,
    allHabits,
    currentHabitId,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [newConditionIds, setNewConditionIds] = useState<string[]>([]);
    const [newConditionType, setNewConditionType] = useState<'ALL_MARKED' | 'ANY_MARKED'>('ALL_MARKED');

    // Filter out current habit and archived habits from condition options
    const availableHabits = allHabits.filter(
        h => h.id !== currentHabitId && !h.archived
    );

    const toggleConditionHabit = (habitId: string) => {
        setNewConditionIds(prev =>
            prev.includes(habitId)
                ? prev.filter(id => id !== habitId)
                : [...prev, habitId]
        );
    };

    const addConsequence = () => {
        if (!newDescription.trim() || newConditionIds.length === 0) return;

        const newConsequence: HabitConsequence = {
            id: `cons_${Date.now()}`,
            description: newDescription.trim(),
            conditionHabitIds: newConditionIds,
            conditionType: newConditionType,
        };

        onChange([...consequences, newConsequence]);
        setNewDescription('');
        setNewConditionIds([]);
        setNewConditionType('ALL_MARKED');
        setIsAdding(false);
    };

    const removeConsequence = (id: string) => {
        onChange(consequences.filter(c => c.id !== id));
    };

    const getHabitTitle = (habitId: string): string => {
        return allHabits.find(h => h.id === habitId)?.title || 'Hábito removido';
    };

    return (
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                <Zap size={14} /> Consequências (Opcional)
            </label>
            <p className="text-xs text-slate-500 mb-3">
                Defina consequências que ativam no dia seguinte quando hábitos específicos forem marcados.
            </p>

            {/* Existing Consequences */}
            {consequences.length > 0 && (
                <div className="space-y-2 mb-3">
                    {consequences.map(cons => (
                        <div key={cons.id} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <AlertTriangle size={12} className="text-amber-400" />
                                        <span className="text-sm font-bold text-amber-300">{cons.description}</span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-[10px] text-slate-400">
                                            {cons.conditionType === 'ALL_MARKED' ? 'Se TODOS marcados:' : 'Se QUALQUER marcado:'}
                                        </span>
                                        {cons.conditionHabitIds.map(id => (
                                            <span key={id} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                                                {getHabitTitle(id)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeConsequence(cons.id)}
                                    className="text-slate-500 hover:text-red-400 p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Consequence */}
            {isAdding ? (
                <div className="bg-slate-800/80 border border-slate-600 rounded-lg p-3 space-y-3 animate-in slide-in-from-top-2">
                    {/* Description */}
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Consequência</label>
                        <input
                            value={newDescription}
                            onChange={e => setNewDescription(e.target.value)}
                            placeholder="Ex: Não jogar videogame"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Condition Type Toggle */}
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Tipo de Condição</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNewConditionType('ALL_MARKED')}
                                className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                                    newConditionType === 'ALL_MARKED'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                }`}
                            >
                                Todos Marcados (E)
                            </button>
                            <button
                                onClick={() => setNewConditionType('ANY_MARKED')}
                                className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                                    newConditionType === 'ANY_MARKED'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-800 text-slate-400'
                                }`}
                            >
                                Qualquer Marcado (OU)
                            </button>
                        </div>
                    </div>

                    {/* Condition Habits Selector */}
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                            <Link2 size={10} className="inline mr-1" />
                            Hábitos como Condição
                        </label>
                        {availableHabits.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">Nenhum outro hábito disponível.</p>
                        ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                                {availableHabits.map(h => {
                                    const isSelected = newConditionIds.includes(h.id);
                                    return (
                                        <div
                                            key={h.id}
                                            onClick={() => toggleConditionHabit(h.id)}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'bg-amber-500/20 border border-amber-500/30'
                                                    : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                                isSelected
                                                    ? 'bg-amber-500 border-amber-500'
                                                    : 'border-slate-500'
                                            }`}>
                                                {isSelected && (
                                                    <svg width="10" height="10" viewBox="0 0 10 10">
                                                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" fill="none" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-sm text-slate-300">{h.title}</span>
                                            <span className="text-[10px] text-slate-500 ml-auto">{h.category}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Preview Rule */}
                    {newDescription && newConditionIds.length > 0 && (
                        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-2 text-xs text-amber-300">
                            <strong>Regra:</strong> Se {newConditionType === 'ALL_MARKED' ? 'TODOS' : 'QUALQUER UM'} de [
                            {newConditionIds.map(id => getHabitTitle(id)).join(', ')}
                            ] forem marcados → <strong>"{newDescription}"</strong> no dia seguinte
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="flex-1 py-2 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={addConsequence}
                            disabled={!newDescription.trim() || newConditionIds.length === 0}
                            className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors text-sm flex items-center justify-center gap-1 border border-dashed border-slate-700"
                >
                    <Plus size={14} /> Adicionar Consequência
                </button>
            )}
        </div>
    );
};

export default ConsequenceEditor;
