import React, { useMemo } from 'react';
import {
    LayoutList, CheckSquare, Clock, Bell, Archive,
    ChevronDown, ChevronUp, Tag, CheckCircle2
} from 'lucide-react';
import { OrganizeTask } from '../../types';

interface TasksProgressSectionProps {
    tasks: OrganizeTask[];
}

// Helper to get category color
const getCategoryColor = (category: string) => {
    const colors = [
        { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', fill: 'bg-red-500' },
        { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', fill: 'bg-orange-500' },
        { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', fill: 'bg-amber-500' },
        { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', fill: 'bg-green-500' },
        { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', fill: 'bg-emerald-500' },
        { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', fill: 'bg-teal-500' },
        { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', fill: 'bg-cyan-500' },
        { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', fill: 'bg-blue-500' },
        { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', fill: 'bg-indigo-500' },
        { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', fill: 'bg-violet-500' },
        { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', fill: 'bg-purple-500' },
        { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20', fill: 'bg-fuchsia-500' },
        { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', fill: 'bg-pink-500' },
        { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', fill: 'bg-rose-500' },
    ];

    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

// Format date
const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(adjustedDate);
};

// Check if date is overdue
const isOverdue = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date < today;
};

export const TasksProgressSection: React.FC<TasksProgressSectionProps> = ({ tasks }) => {
    const [showArchived, setShowArchived] = React.useState(false);

    // Separate active and archived tasks
    const { activeTasks, archivedTasks } = useMemo(() => ({
        activeTasks: tasks.filter(t => !t.isArchived),
        archivedTasks: tasks.filter(t => t.isArchived)
    }), [tasks]);

    // Group tasks by category with stats
    const categoryStats = useMemo(() => {
        const stats: Record<string, { total: number; completed: number; color: ReturnType<typeof getCategoryColor> }> = {};

        activeTasks.forEach(task => {
            if (!stats[task.category]) {
                stats[task.category] = { total: 0, completed: 0, color: getCategoryColor(task.category) };
            }
            stats[task.category].total++;
            if (task.isCompleted) {
                stats[task.category].completed++;
            }
        });

        return Object.entries(stats)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([category, data]) => ({ category, ...data }));
    }, [activeTasks]);

    // Overall completion stats
    const overallStats = useMemo(() => {
        const total = activeTasks.length;
        const completed = activeTasks.filter(t => t.isCompleted).length;
        const overdue = activeTasks.filter(t => !t.isCompleted && isOverdue(t.dueDate)).length;
        const withReminders = activeTasks.filter(t => t.reminderDate).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, overdue, withReminders, completionRate };
    }, [activeTasks]);

    if (tasks.length === 0) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                    <LayoutList className="text-indigo-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Tarefas</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <LayoutList size={40} className="text-slate-600 mb-3" />
                    <p className="text-slate-400">Nenhuma tarefa cadastrada ainda.</p>
                    <p className="text-xs text-slate-500 mt-1">Acesse o módulo Hábitos para criar suas tarefas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <LayoutList className="text-indigo-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Tarefas</h3>
                        <p className="text-xs text-slate-500">{overallStats.total} ativas • {archivedTasks.length} arquivadas</p>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="flex items-center gap-3">
                    {overallStats.overdue > 0 && (
                        <div className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
                            <Clock size={12} />
                            <span className="text-xs font-bold">{overallStats.overdue} atrasadas</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
                        <CheckCircle2 size={16} className={overallStats.completionRate >= 70 ? 'text-emerald-400' : 'text-slate-500'} />
                        <span className={`font-bold ${overallStats.completionRate >= 70 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {overallStats.completionRate}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Category Progress Bars */}
            <div className="space-y-3 mb-6">
                {categoryStats.map(({ category, total, completed, color }) => {
                    const percent = Math.round((completed / total) * 100);

                    return (
                        <div key={category} className="group">
                            <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color.bg} ${color.text} ${color.border}`}>
                                        {category.toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-slate-400 text-xs">
                                    {completed}/{total} <span className="text-slate-500">({percent}%)</span>
                                </span>
                            </div>
                            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${color.fill}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Tasks List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
                {activeTasks.filter(t => !t.isCompleted).slice(0, 8).map(task => {
                    const color = getCategoryColor(task.category);
                    const overdue = isOverdue(task.dueDate);

                    return (
                        <div
                            key={task.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                                ${overdue
                                    ? 'bg-red-900/20 border-red-500/30'
                                    : 'bg-slate-900/50 border-slate-700/50 hover:border-indigo-500/30'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.isCompleted ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                                }`}>
                                {task.isCompleted && <CheckSquare size={12} className="text-white" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-medium truncate ${task.isCompleted ? 'text-slate-500 line-through' : 'text-white'
                                        }`}>
                                        {task.title}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${color.bg} ${color.text} ${color.border}`}>
                                        {task.category}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                {task.reminderDate && (
                                    <span title="Tem lembrete">
                                        <Bell size={12} className="text-yellow-500" />
                                    </span>
                                )}
                                {task.dueDate && (
                                    <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-slate-500'
                                        }`}>
                                        <Clock size={10} />
                                        {formatDate(task.dueDate)}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {activeTasks.filter(t => !t.isCompleted).length > 8 && (
                    <div className="text-center py-2 text-xs text-slate-500">
                        +{activeTasks.filter(t => !t.isCompleted).length - 8} tarefas pendentes
                    </div>
                )}
            </div>

            {/* Archived Toggle */}
            {archivedTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-full"
                    >
                        <Archive size={14} />
                        <span>{archivedTasks.length} tarefas arquivadas</span>
                        {showArchived ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showArchived && (
                        <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
                            {archivedTasks.slice(0, 10).map(task => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/30 border border-slate-800 opacity-60"
                                >
                                    <CheckSquare size={14} className="text-indigo-500" />
                                    <span className="text-sm text-slate-500 line-through truncate flex-1">
                                        {task.title}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getCategoryColor(task.category).bg} ${getCategoryColor(task.category).text}`}>
                                        {task.category}
                                    </span>
                                </div>
                            ))}
                            {archivedTasks.length > 10 && (
                                <div className="text-center py-1 text-xs text-slate-600">
                                    +{archivedTasks.length - 10} arquivadas
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Quick Summary Footer */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-slate-400">
                        <Tag size={12} />
                        <span>{categoryStats.length} categorias</span>
                    </div>
                    {overallStats.withReminders > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                            <Bell size={12} />
                            <span>{overallStats.withReminders} lembretes</span>
                        </div>
                    )}
                </div>
                <div className="text-emerald-400 font-medium">
                    {overallStats.completed} concluídas
                </div>
            </div>
        </div>
    );
};

export default TasksProgressSection;
