import React, { useMemo } from 'react';
import {
    Target, CheckCircle2, XCircle, Ban, Flame, TrendingUp,
    Clock, Calendar, Award
} from 'lucide-react';
import { Habit } from '../../types';
import { getCategoryColor } from '../../utils/styling';

interface HabitsProgressSectionProps {
    habits: Habit[];
}

interface HabitsProgressSectionProps {
    habits: Habit[];
}

// Get last 7 days as array of date keys

// Get last 7 days as array of date keys
const getLast7Days = (): string[] => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
};

// Get day name abbreviation
const getDayName = (dateKey: string): string => {
    const date = new Date(dateKey + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 2);
};

export const HabitsProgressSection: React.FC<HabitsProgressSectionProps> = ({ habits }) => {
    const last7Days = useMemo(() => getLast7Days(), []);
    const activeHabits = habits.filter(h => !h.archived);

    // Calculate overall statistics
    const stats = useMemo(() => {
        let totalChecks = 0;
        let possibleChecks = 0;
        let currentStreak = 0;
        let longestStreak = 0;

        const today = new Date().toISOString().split('T')[0];

        // Calculate consistency for last 7 days
        last7Days.forEach(dateKey => {
            activeHabits.forEach(habit => {
                if (!habit.isNegative) {
                    possibleChecks++;
                    if (habit.history[dateKey]?.completed) {
                        totalChecks++;
                    }
                } else {
                    possibleChecks++;
                    if (!habit.history[dateKey]?.completed) {
                        totalChecks++; // For negative habits, NOT doing it is success
                    }
                }
            });
        });

        // Calculate current streak for each habit
        activeHabits.forEach(habit => {
            let streak = 0;
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateKey = d.toISOString().split('T')[0];

                const log = habit.history[dateKey];
                const success = habit.isNegative ? !log?.completed : log?.completed;

                if (success) {
                    streak++;
                } else if (i > 0) { // Don't break on today
                    break;
                }
            }
            if (streak > longestStreak) longestStreak = streak;
            currentStreak += streak;
        });

        const consistency = possibleChecks > 0 ? Math.round((totalChecks / possibleChecks) * 100) : 0;

        return {
            consistency,
            totalChecks,
            possibleChecks,
            avgStreak: activeHabits.length > 0 ? Math.round(currentStreak / activeHabits.length) : 0,
            longestStreak,
            positiveCount: activeHabits.filter(h => !h.isNegative && h.goalType === 'BOOLEAN').length,
            negativeCount: activeHabits.filter(h => h.isNegative).length,
            numericCount: activeHabits.filter(h => h.goalType !== 'BOOLEAN').length,
        };
    }, [activeHabits, last7Days]);

    if (activeHabits.length === 0) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="text-emerald-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Hábitos</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Target size={40} className="text-slate-600 mb-3" />
                    <p className="text-slate-400">Nenhum hábito cadastrado ainda.</p>
                    <p className="text-xs text-slate-500 mt-1">Acesse o módulo Hábitos para criar seus primeiros hábitos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Target className="text-emerald-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Hábitos</h3>
                        <p className="text-xs text-slate-500">{activeHabits.length} hábitos ativos</p>
                    </div>
                </div>

                {/* Consistency Badge */}
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
                    <Flame size={16} className={stats.consistency >= 70 ? 'text-orange-400' : 'text-slate-500'} />
                    <span className={`font-bold ${stats.consistency >= 70 ? 'text-orange-400' : 'text-slate-400'}`}>
                        {stats.consistency}%
                    </span>
                    <span className="text-xs text-slate-500">consistência</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-center">
                    <div className="text-xl font-bold text-emerald-400">{stats.positiveCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Positivos</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-center">
                    <div className="text-xl font-bold text-red-400">{stats.negativeCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">A Evitar</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 text-center">
                    <div className="text-xl font-bold text-indigo-400">{stats.numericCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Numéricos</div>
                </div>
            </div>

            {/* Habits List with Mini Calendar */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
                {activeHabits.map(habit => {
                    const isNegative = habit.isNegative;
                    const isNumeric = habit.goalType !== 'BOOLEAN' && habit.goalType !== undefined;

                    // Calculate weekly progress for numeric habits
                    let weeklyValue = 0;
                    let weeklyTarget = habit.targetValue || 0;
                    if (isNumeric && habit.frequency === 'WEEKLY') {
                        last7Days.forEach(dateKey => {
                            weeklyValue += habit.history[dateKey]?.value || 0;
                        });
                    }

                    // Count completed days in last 7
                    let completedDays = 0;
                    last7Days.forEach(dateKey => {
                        const log = habit.history[dateKey];
                        if (isNegative) {
                            if (!log?.completed) completedDays++;
                        } else if (isNumeric) {
                            // For numeric, check if met target
                            if (habit.goalType === 'MIN_TIME' && (log?.value || 0) >= weeklyTarget / 7) completedDays++;
                            else if (habit.goalType === 'MAX_TIME' && (log?.value || 0) <= weeklyTarget / 7) completedDays++;
                        } else {
                            if (log?.completed) completedDays++;
                        }
                    });

                    return (
                        <div
                            key={habit.id}
                            className={`p-4 rounded-xl border transition-all ${isNegative
                                    ? 'bg-slate-900/50 border-red-500/20 hover:border-red-500/40'
                                    : 'bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/30'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                {/* Habit Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {isNegative ? (
                                            <Ban size={14} className="text-red-400 flex-shrink-0" />
                                        ) : isNumeric ? (
                                            <Clock size={14} className="text-indigo-400 flex-shrink-0" />
                                        ) : (
                                            <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                                        )}
                                        <span className="font-medium text-white truncate">{habit.title}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryColor(habit.category)}`}>
                                            {habit.category.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Progress Bar for Numeric Habits */}
                                    {isNumeric && (
                                        <div className="mt-2 mb-2">
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                                <span>{habit.frequency === 'WEEKLY' ? 'Semanal' : 'Diário'}</span>
                                                <span className="font-medium text-slate-400">
                                                    {weeklyValue} / {weeklyTarget} min
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${habit.goalType === 'MAX_TIME'
                                                            ? weeklyValue > weeklyTarget ? 'bg-red-500' : 'bg-emerald-500'
                                                            : weeklyValue >= weeklyTarget ? 'bg-emerald-500' : 'bg-indigo-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, (weeklyValue / weeklyTarget) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Mini Calendar - Last 7 Days */}
                                    <div className="flex gap-1 mt-2">
                                        {last7Days.map(dateKey => {
                                            const log = habit.history[dateKey];
                                            const isToday = dateKey === new Date().toISOString().split('T')[0];

                                            let status: 'success' | 'fail' | 'pending' = 'pending';
                                            if (isNegative) {
                                                status = log?.completed ? 'fail' : (log !== undefined ? 'success' : 'pending');
                                            } else if (isNumeric) {
                                                const value = log?.value || 0;
                                                const dailyTarget = (habit.targetValue || 0) / 7;
                                                if (habit.goalType === 'MIN_TIME') {
                                                    status = value >= dailyTarget ? 'success' : (value > 0 ? 'pending' : 'pending');
                                                } else {
                                                    status = value > dailyTarget ? 'fail' : 'success';
                                                }
                                            } else {
                                                status = log?.completed ? 'success' : 'pending';
                                            }

                                            return (
                                                <div
                                                    key={dateKey}
                                                    className={`flex flex-col items-center justify-center w-8 h-9 rounded-lg text-[9px] font-medium border ${isToday ? 'border-cyan-500/50' : 'border-transparent'
                                                        } ${status === 'success'
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : status === 'fail'
                                                                ? 'bg-red-500/20 text-red-400'
                                                                : 'bg-slate-800 text-slate-500'
                                                        }`}
                                                    title={dateKey}
                                                >
                                                    <span className="uppercase">{getDayName(dateKey)}</span>
                                                    {status === 'success' && <CheckCircle2 size={10} />}
                                                    {status === 'fail' && <XCircle size={10} />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Completion Rate */}
                                <div className="flex flex-col items-center justify-center bg-slate-800 p-2 rounded-lg min-w-[50px]">
                                    <span className={`text-lg font-bold ${completedDays >= 5 ? 'text-emerald-400' :
                                            completedDays >= 3 ? 'text-yellow-400' : 'text-slate-400'
                                        }`}>
                                        {completedDays}/7
                                    </span>
                                    <span className="text-[8px] text-slate-500 uppercase">dias</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Stats */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                    <Award size={14} className="text-amber-400" />
                    <span>Streak médio: <strong className="text-white">{stats.avgStreak} dias</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <TrendingUp size={14} className="text-cyan-400" />
                    <span>Melhor: <strong className="text-white">{stats.longestStreak} dias</strong></span>
                </div>
            </div>
        </div>
    );
};

export default HabitsProgressSection;
