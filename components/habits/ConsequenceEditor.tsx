import React, { useState, useEffect } from 'react';
import { Plus, X, AlertTriangle, Link2, Zap } from 'lucide-react';
import { HabitConsequence, Habit } from '../../types';

interface ConsequenceEditorProps {
    consequences: HabitConsequence[];
    onChange: (consequences: HabitConsequence[]) => void;
    allHabits: Habit[];        // All habits for condition selection
    currentHabitId: string;    // Current habit ID
    currentHabitTitle: string;  // Current habit title
    isNegative: boolean;       // Is the current habit negative?
}

const ConsequenceEditor: React.FC<ConsequenceEditorProps> = ({
    consequences,
    onChange,
    allHabits,
    currentHabitId,
    currentHabitTitle,
    isNegative,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [newConditionIds, setNewConditionIds] = useState<string[]>([]);
    const [newConditionType, setNewConditionType] = useState<'ALL_MARKED' | 'ANY_MARKED'>('ALL_MARKED');
    const [showAdditionalConditions, setShowAdditionalConditions] = useState(false);

    // Reset additional conditions if user collapses the section
    useEffect(() => {
        if (!showAdditionalConditions) {
            setNewConditionIds([]);
        }
    }, [showAdditionalConditions]);

    // Filter out current habit and archived habits from additional condition options
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
        if (!newDescription.trim()) return;

        // The consequence always depends on the current habit, plus any additional selected ones
        const finalConditionIds = [currentHabitId, ...newConditionIds];

        const newConsequence: HabitConsequence = {
            id: `cons_${Date.now()}`,
            description: newDescription.trim(),
            conditionHabitIds: finalConditionIds,
            conditionType: newConditionType,
        };

        onChange([...consequences, newConsequence]);
        setNewDescription('');
        setNewConditionIds([]);
        setNewConditionType('ALL_MARKED');
        setShowAdditionalConditions(false);
        setIsAdding(false);
    };

    const removeConsequence = (id: string) => {
        onChange(consequences.filter(c => c.id !== id));
    };

    const getHabitTitle = (habitId: string): string => {
        if (habitId === currentHabitId) return currentHabitTitle || 'Este Hábito';
        return allHabits.find(h => h.id === habitId)?.title || 'Hábito removido';
    };

    const getHabitFailureDescription = (habitId: string) => {
        let isHabNeg = isNegative;
        let title = currentHabitTitle || 'Este Hábito';
        
        if (habitId !== currentHabitId) {
            const h = allHabits.find(x => x.id === habitId);
            isHabNeg = h ? !!h.isNegative : false;
            title = h ? h.title : 'Hábito removido';
        }

        return isHabNeg 
            ? `se "${title}" for marcado (falha)`
            : `se "${title}" NÃO for realizado`;
    };

    return (
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                <Zap size={14} /> Consequências (Opcional)
            </label>
            <p className="text-xs text-slate-500 mb-3">
                Escreva uma consequência para o dia seguinte caso você falhe neste hábito. Você também pode combiná-lo com outros hábitos se desejar.
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
                                            Condições:
                                        </span>
                                        {cons.conditionHabitIds.map(id => (
                                            <span key={id} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded" title={getHabitFailureDescription(id)}>
                                                {getHabitTitle(id)}
                                            </span>
                                        ))}
                                        {cons.conditionHabitIds.length > 1 && (
                                            <span className="text-[10px] text-slate-500">
                                                ({cons.conditionType === 'ALL_MARKED' ? 'Todos requeridos' : 'Qualquer um deles'})
                                            </span>
                                        )}
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
                            placeholder="Ex: Não jogar videogame amanhã"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Condition Base (Fixed to this Habit) */}
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 10 10">
                                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" fill="none" />
                                </svg>
                            </div>
                            <span className="text-xs text-slate-300 font-bold">
                                {isNegative ? 'Se eu MARCAR este hábito' : 'Se eu NÃO realizar este hábito'}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 ml-6">
                            ({currentHabitTitle || 'Hábito em edição'})
                        </p>
                    </div>

                    {/* Additional Conditions Toggle */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdditionalConditions(!showAdditionalConditions)}
                            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                        >
                            {showAdditionalConditions ? '─ Remover condições extras' : '┼ Adicionar outros hábitos como condição extra'}
                        </button>
                    </div>

                    {/* Additional Conditions Fields */}
                    {showAdditionalConditions && (
                        <div className="space-y-3 p-2 bg-slate-900/40 rounded-lg border border-slate-700/60 animate-in slide-in-from-top-1">
                            {/* Condition Type Toggle */}
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Combinação com extras</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewConditionType('ALL_MARKED')}
                                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                                            newConditionType === 'ALL_MARKED'
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Todos (E): Falhar neste E nos selecionados
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewConditionType('ANY_MARKED')}
                                        className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${
                                            newConditionType === 'ANY_MARKED'
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-slate-800 text-slate-400'
                                        }`}
                                    >
                                        Qualquer (OU): Falhar neste OU nos selecionados
                                    </button>
                                </div>
                            </div>

                            {/* Additional Habits Selector */}
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                                    <Link2 size={10} className="inline mr-1" />
                                    Selecione os outros hábitos
                                </label>
                                {availableHabits.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 italic">Nenhum outro hábito disponível para combinar.</p>
                                ) : (
                                    <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                                        {availableHabits.map(h => {
                                            const isSelected = newConditionIds.includes(h.id);
                                            return (
                                                <div
                                                    key={h.id}
                                                    onClick={() => toggleConditionHabit(h.id)}
                                                    className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'bg-amber-500/20 border border-amber-500/30'
                                                            : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
                                                    }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                                        isSelected
                                                            ? 'bg-amber-500 border-amber-500'
                                                            : 'border-slate-500'
                                                    }`}>
                                                        {isSelected && (
                                                            <svg width="8" height="8" viewBox="0 0 10 10">
                                                                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" fill="none" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-slate-300">{h.title}</span>
                                                    <span className="text-[9px] text-slate-500 ml-auto">{h.category}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Preview Rule */}
                    {newDescription && (
                        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-2 text-xs text-amber-300">
                            <strong>Ativação:</strong> Se eu falhar em "{currentHabitTitle || 'Este Hábito'}"
                            {newConditionIds.length > 0 && (
                                <>
                                    {' '}{newConditionType === 'ALL_MARKED' ? 'E' : 'OU'} falhar em [
                                    {newConditionIds.map(id => getHabitTitle(id)).join(', ')}
                                    ]
                                </>
                            )}
                            {' '}→ amanhã terei que: <strong>"{newDescription}"</strong>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="flex-1 py-2 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={addConsequence}
                            disabled={!newDescription.trim()}
                            className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
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
