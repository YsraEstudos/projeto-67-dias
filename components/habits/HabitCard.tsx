import React, { memo, useMemo } from 'react';
import {
    CheckCircle2, XCircle, Ban, ListChecks, Pencil, Trash2
} from 'lucide-react';
import { Habit } from '../../types';
import { getCategoryColor } from '../../utils/styling';

interface HabitCardProps {
    habit: Habit;
    selectedDate: Date;
    onToggle: (habitId: string, subHabitId?: string) => void;
    onLogValue: (habitId: string, value: number) => void;
    onEdit: (habit: Habit) => void;
    onDelete: (habitId: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = memo(({
    habit,
    selectedDate,
    onToggle,
    onLogValue,
    onEdit,
    onDelete
}) => {
    const dateKey = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
    const log = useMemo(() => habit.history[dateKey] || { completed: false, subHabitsCompleted: [], value: 0 }, [habit.history, dateKey]);

    const hasSubHabits = habit.subHabits.length > 0;
    const isFullyCompleted = log.completed;
    const isNegativeHabit = habit.isNegative;
    const isTimeHabit = habit.goalType !== 'BOOLEAN' && habit.goalType !== undefined;

    // Calculate Progress Logic
    const { currentValue, target, progressPercent, isOverLimit } = useMemo(() => {
        let current = 0;
        let tgt = habit.targetValue || 0;
        let pct = 0;
        let over = false;

        if (isTimeHabit) {
            if (habit.frequency === 'WEEKLY') {
                // Calculate Weekly Total
                const currentDay = selectedDate.getDay(); // 0-6
                const diff = selectedDate.getDate() - currentDay;
                const startOfWeek = new Date(selectedDate);
                startOfWeek.setDate(diff);

                for (let i = 0; i < 7; i++) {
                    const d = new Date(startOfWeek);
                    d.setDate(startOfWeek.getDate() + i);
                    const k = d.toISOString().split('T')[0];
                    current += habit.history[k]?.value || 0;
                }
            } else {
                // Daily Total
                current = log.value || 0;
            }

            if (tgt > 0) {
                pct = Math.min(100, (current / tgt) * 100);
                if (habit.goalType === 'MAX_TIME' && current > tgt) {
                    over = true;
                    pct = 100;
                }
            }
        }
        return { currentValue: current, target: tgt, progressPercent: pct, isOverLimit: over };
    }, [habit, isTimeHabit, log, selectedDate]);

    // Visual Logic
    const colors = useMemo(() => {
        if (isTimeHabit) {
            if (habit.goalType === 'MAX_TIME') {
                if (isOverLimit) {
                    return {
                        card: 'bg-red-900/20 border-red-500/40',
                        button: 'text-red-500 bg-red-500/10',
                        title: 'text-red-300',
                        badge: 'bg-red-500/20 text-red-400 border-red-500/30'
                    };
                }
                return {
                    card: 'bg-slate-800 border-slate-700 hover:border-indigo-500/30',
                    button: 'text-slate-500 hover:text-indigo-400',
                    title: 'text-white',
                    badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                };
            } else {
                // MIN_TIME (Meta positiva)
                const isMet = currentValue >= target;
                return {
                    card: isMet ? 'bg-slate-800 border-emerald-500/40' : 'bg-slate-800 border-slate-700',
                    button: 'text-slate-500',
                    title: isMet ? 'text-emerald-400' : 'text-white',
                    badge: isMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                };
            }
        }

        if (isNegativeHabit) {
            if (isFullyCompleted) {
                // Falhou - marcou o hábito negativo
                return {
                    card: 'bg-red-900/30 border-red-500/40 hover:border-red-500/60',
                    button: 'text-red-500 bg-red-500/20',
                    title: 'text-red-400',
                    badge: 'bg-red-500/20 text-red-400 border-red-500/30'
                };
            } else {
                // Resistindo - não marcou o hábito negativo
                return {
                    card: 'bg-slate-800 border-emerald-500/30 hover:border-emerald-500/50',
                    button: 'text-slate-500 hover:text-red-400 hover:bg-red-500/10',
                    title: 'text-white',
                    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                };
            }
        } else {
            // Hábito positivo normal
            return {
                card: 'bg-slate-800 border-slate-700 hover:border-emerald-500/20',
                button: isFullyCompleted ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 hover:text-emerald-400 hover:bg-slate-700',
                title: isFullyCompleted ? 'text-emerald-400' : 'text-white',
                badge: null
            };
        }
    }, [isTimeHabit, habit.goalType, isOverLimit, currentValue, target, isNegativeHabit, isFullyCompleted]);

    return (
        <div className={`group rounded-2xl p-5 shadow-md hover:shadow-lg transition-all border relative overflow-hidden ${colors.card}`}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none z-0">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
            </div>

            {/* Background glow - adapts to habit type */}
            <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-15 transition-all duration-700 blur-xl pointer-events-none ${isNegativeHabit ? 'bg-amber-500' : 'bg-emerald-500'}`} />

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                        {!isTimeHabit && (
                            <button
                                onClick={() => onToggle(habit.id)}
                                className={`rounded-full p-1 transition-all mt-1 ${colors.button}`}
                            >
                                {isNegativeHabit ? (
                                    isFullyCompleted ? <XCircle size={28} /> : <div className="w-7 h-7 rounded-full border-2 border-current" />
                                ) : (
                                    isFullyCompleted ? <CheckCircle2 size={28} /> : <div className="w-7 h-7 rounded-full border-2 border-current" />
                                )}
                            </button>
                        )}

                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`text-lg font-bold leading-tight ${colors.title}`}>{habit.title}</h3>

                                {isTimeHabit && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${colors.badge}`}>
                                        {habit.frequency === 'WEEKLY' ? 'SEMANAL' : 'DIÁRIO'} | {currentValue} / {target} MIN
                                    </span>
                                )}

                                {!isTimeHabit && isNegativeHabit && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${colors.badge}`}>
                                        {isFullyCompleted ? '🚫 FALHOU' : '✓ RESISTINDO'}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                {isNegativeHabit && !isTimeHabit && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1">
                                        <Ban size={10} /> EVITAR
                                    </span>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${getCategoryColor(habit.category)}`}>
                                    {habit.category}
                                </span>
                            </div>

                            {/* PROGRESS BAR FOR TIME HABITS */}
                            {isTimeHabit && (
                                <div className="mt-3 bg-slate-900 rounded-full h-2.5 w-full overflow-hidden border border-slate-700/50 relative">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${habit.goalType === 'MAX_TIME'
                                            ? (isOverLimit ? 'bg-red-500' : (progressPercent > 80 ? 'bg-yellow-500' : 'bg-emerald-500'))
                                            : (currentValue >= target ? 'bg-emerald-500' : 'bg-indigo-500')
                                            }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            )}

                            {/* INPUT FOR TIME LOGGING */}
                            {isTimeHabit && (
                                <div className="mt-3 flex gap-2 items-center">
                                    <button
                                        onClick={() => onLogValue(habit.id, 15)}
                                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-medium transition-colors"
                                    >
                                        +15m
                                    </button>
                                    <button
                                        onClick={() => onLogValue(habit.id, 30)}
                                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-medium transition-colors"
                                    >
                                        +30m
                                    </button>
                                    <button
                                        onClick={() => onLogValue(habit.id, 60)}
                                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white font-medium transition-colors"
                                    >
                                        +1h
                                    </button>
                                    <input
                                        type="number"
                                        placeholder="min"
                                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = Number(e.currentTarget.value);
                                                if (val) {
                                                    onLogValue(habit.id, val);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sub Habits List (Only for Boolean) */}
                    {hasSubHabits && !isTimeHabit && (
                        <div className={`mt-3 ml-10 space-y-2 border-l-2 pl-4 py-1 ${isNegativeHabit ? 'border-red-500/30' : 'border-slate-700'}`}>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <ListChecks size={12} /> {isNegativeHabit ? 'Gatilhos a evitar:' : 'Passos para completar:'}
                            </div>
                            {habit.subHabits.map(sub => {
                                const isSubDone = log.subHabitsCompleted.includes(sub.id);
                                return (
                                    <div
                                        key={sub.id}
                                        onClick={() => onToggle(habit.id, sub.id)}
                                        className={`flex items-center gap-2 cursor-pointer group ${isSubDone ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                                    >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isNegativeHabit
                                            ? (isSubDone ? 'bg-red-600 border-red-600' : 'border-slate-500 group-hover:border-red-500')
                                            : (isSubDone ? 'bg-emerald-600 border-emerald-600' : 'border-slate-500 group-hover:border-emerald-500')
                                            }`}>
                                            {isSubDone && (isNegativeHabit ? <XCircle size={12} className="text-white" /> : <CheckCircle2 size={12} className="text-white" />)}
                                        </div>
                                        <span className={`text-sm ${isNegativeHabit
                                            ? (isSubDone ? 'text-red-300 line-through' : 'text-slate-300')
                                            : (isSubDone ? 'text-emerald-300 line-through' : 'text-slate-300')
                                            }`}>{sub.title}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(habit)}
                        className="text-slate-600 hover:text-indigo-400 p-2 rounded-lg hover:bg-slate-900 transition-colors"
                        title="Editar"
                    >
                        <Pencil size={18} />
                    </button>
                    <button onClick={() => onDelete(habit.id)} className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-slate-900 transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparison for memo
    return (
        prev.habit === next.habit &&
        prev.selectedDate.getTime() === next.selectedDate.getTime() &&
        // Functions reference check (usually stable if using useCallback in parent)
        prev.onToggle === next.onToggle &&
        prev.onLogValue === next.onLogValue &&
        prev.onEdit === next.onEdit &&
        prev.onDelete === next.onDelete
    );
});

export default HabitCard;
