import React, { useMemo, useCallback } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import type { TimeSlotGoalConfig } from '../../../../types';

interface GoalAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    slotId: string;
    availableGoals: TimeSlotGoalConfig[];
    assignedGoalIds: string[];
    onSelectGoal: (goalId: string) => void;
    onCreateNew: () => void;
}

/**
 * Modal to select a goal to assign to a time slot.
 * Shows available goals (built-in + custom) with option to create new.
 */
export const GoalAssignmentModal: React.FC<GoalAssignmentModalProps> = React.memo(({
    isOpen,
    onClose,
    slotId,
    availableGoals,
    assignedGoalIds,
    onSelectGoal,
    onCreateNew,
}) => {
    if (!isOpen) return null;

    // Separate built-in and custom goals
    const { builtInGoals, customGoals } = useMemo(() => {
        const builtIn = availableGoals.filter(g => g.isBuiltIn);
        const custom = availableGoals.filter(g => !g.isBuiltIn);
        return { builtInGoals: builtIn, customGoals: custom };
    }, [availableGoals]);

    // Color mapping
    const getColorClasses = useCallback((color: string, isAssigned: boolean) => {
        if (isAssigned) {
            return 'bg-slate-700 border-slate-600 text-slate-500 cursor-not-allowed';
        }
        const colorMap: Record<string, string> = {
            amber: 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60 text-amber-400',
            violet: 'bg-violet-500/10 border-violet-500/30 hover:border-violet-500/60 text-violet-400',
            emerald: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400',
            blue: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60 text-blue-400',
            rose: 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60 text-rose-400',
            pink: 'bg-pink-500/10 border-pink-500/30 hover:border-pink-500/60 text-pink-400',
            cyan: 'bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400',
        };
        return colorMap[color] || colorMap.blue;
    }, []);

    const handleSelectGoal = useCallback((goal: TimeSlotGoalConfig) => {
        if (assignedGoalIds.includes(goal.id)) return;
        onSelectGoal(goal.id);
        onClose();
    }, [assignedGoalIds, onSelectGoal, onClose]);

    const handleCreateNew = useCallback(() => {
        onCreateNew();
        onClose();
    }, [onCreateNew, onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Adicionar Meta</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Built-in Goals */}
                    {builtInGoals.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Metas Predefinidas
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {builtInGoals.map((goal) => {
                                    const isAssigned = assignedGoalIds.includes(goal.id);
                                    return (
                                        <button
                                            key={goal.id}
                                            onClick={() => handleSelectGoal(goal)}
                                            disabled={isAssigned}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${getColorClasses(goal.color, isAssigned)}`}
                                        >
                                            <span className="text-2xl">{goal.icon}</span>
                                            <div className="flex-1 text-left">
                                                <span className="font-bold">{goal.label}</span>
                                                <span className="ml-2 text-xs opacity-70">
                                                    {goal.inputMode === 'COUNTER' && '(contador)'}
                                                    {goal.inputMode === 'BOOLEAN' && '(checkbox)'}
                                                    {goal.inputMode === 'TIME' && '(tempo)'}
                                                </span>
                                            </div>
                                            {isAssigned && (
                                                <span className="text-xs text-slate-500">Já adicionado</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Custom Goals */}
                    {customGoals.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Metas Personalizadas
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {customGoals.map((goal) => {
                                    const isAssigned = assignedGoalIds.includes(goal.id);
                                    return (
                                        <button
                                            key={goal.id}
                                            onClick={() => handleSelectGoal(goal)}
                                            disabled={isAssigned}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${getColorClasses(goal.color, isAssigned)}`}
                                        >
                                            <span className="text-2xl">{goal.icon}</span>
                                            <div className="flex-1 text-left">
                                                <span className="font-bold">{goal.label}</span>
                                                <span className="ml-2 text-xs opacity-70">
                                                    {goal.inputMode === 'COUNTER' && '(contador)'}
                                                    {goal.inputMode === 'BOOLEAN' && '(checkbox)'}
                                                    {goal.inputMode === 'TIME' && '(tempo)'}
                                                </span>
                                            </div>
                                            {isAssigned && (
                                                <span className="text-xs text-slate-500">Já adicionado</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Create New */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleCreateNew}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                    >
                        <Sparkles size={18} />
                        <span className="font-bold">Criar Meta Personalizada</span>
                    </button>
                </div>
            </div>
        </div>
    );
});

GoalAssignmentModal.displayName = 'GoalAssignmentModal';

export default GoalAssignmentModal;
