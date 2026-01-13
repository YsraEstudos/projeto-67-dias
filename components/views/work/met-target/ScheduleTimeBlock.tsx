import React, { useMemo, useCallback } from 'react';
import { Check, X, Plus, Minus, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import type { TimeSlotConfig, TimeSlotTask, TimeSlotGoalConfig, GoalInputMode } from '../../../../types';

interface TimeSlotTaskItemProps {
    task: TimeSlotTask;
    goal: TimeSlotGoalConfig | undefined;
    onToggleComplete: () => void;
    onUpdateCount: (count: number) => void;
    onUpdateMinutes: (minutes: number) => void;
    onRemove: () => void;
}

/**
 * Individual task item within a time slot.
 */
const TimeSlotTaskItem: React.FC<TimeSlotTaskItemProps> = React.memo(({
    task,
    goal,
    onToggleComplete,
    onUpdateCount,
    onUpdateMinutes,
    onRemove,
}) => {
    if (!goal) return null;

    // Color mapping
    const colorClasses = useMemo(() => {
        const colorMap: Record<string, { text: string; bg: string; border: string }> = {
            amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
            violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
            emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
            blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
            rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
            pink: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
            cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
        };
        return colorMap[goal.color] || colorMap.blue;
    }, [goal.color]);

    // Render action based on input mode
    const renderAction = () => {
        switch (goal.inputMode) {
            case 'BOOLEAN':
                return (
                    <button
                        onClick={onToggleComplete}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${task.completed
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                            }`}
                    >
                        {task.completed && <Check size={16} />}
                    </button>
                );

            case 'COUNTER':
                return (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onUpdateCount(Math.max(0, (task.count || 0) - 1))}
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                        >
                            <ArrowDown size={14} />
                        </button>
                        <span className={`min-w-[2rem] text-center font-bold tabular-nums ${colorClasses.text}`}>
                            {task.count || 0}
                        </span>
                        <button
                            onClick={() => onUpdateCount((task.count || 0) + 1)}
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                        >
                            <ArrowUp size={14} />
                        </button>
                    </div>
                );

            case 'TIME':
                return (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onUpdateMinutes(Math.max(0, (task.minutes || 0) - 5))}
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                        >
                            <Minus size={14} />
                        </button>
                        <span className={`min-w-[3rem] text-center font-bold tabular-nums text-sm ${colorClasses.text}`}>
                            {task.minutes || 0}min
                        </span>
                        <button
                            onClick={() => onUpdateMinutes((task.minutes || 0) + 5)}
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg border ${colorClasses.border} ${colorClasses.bg} ${task.completed ? 'opacity-60' : ''}`}>
            {/* Icon + Label */}
            <span className="text-lg">{goal.icon}</span>
            <span className={`flex-1 text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                {goal.label}
            </span>

            {/* Action */}
            {renderAction()}

            {/* Remove button */}
            <button
                onClick={onRemove}
                className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
});

TimeSlotTaskItem.displayName = 'TimeSlotTaskItem';

// ============= Main Component =============

interface ScheduleTimeBlockProps {
    slot: TimeSlotConfig;
    tasks: TimeSlotTask[];
    getGoalById: (goalId: string) => TimeSlotGoalConfig | undefined;
    isActive: boolean;
    onToggleComplete: (taskId: string) => void;
    onUpdateCount: (taskId: string, count: number) => void;
    onUpdateMinutes: (taskId: string, minutes: number) => void;
    onRemoveTask: (taskId: string) => void;
    onAddTask: () => void;
}

/**
 * Time slot card showing assigned tasks with their respective actions.
 */
export const ScheduleTimeBlock: React.FC<ScheduleTimeBlockProps> = React.memo(({
    slot,
    tasks,
    getGoalById,
    isActive,
    onToggleComplete,
    onUpdateCount,
    onUpdateMinutes,
    onRemoveTask,
    onAddTask,
}) => {
    // Format hours as HH:00
    const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

    // Calculate slot duration
    const durationHours = slot.endHour - slot.startHour;

    // Check if all tasks are completed
    const allCompleted = tasks.length > 0 && tasks.every(t => {
        const goal = getGoalById(t.goalId);
        if (!goal) return false;
        if (goal.inputMode === 'BOOLEAN') return t.completed;
        if (goal.inputMode === 'COUNTER') return (t.count || 0) > 0;
        if (goal.inputMode === 'TIME') return (t.minutes || 0) > 0;
        return false;
    });

    // State styling
    const getStateStyles = () => {
        if (allCompleted && tasks.length > 0) {
            return 'border-green-500/50 bg-green-500/10';
        }
        if (isActive) {
            return 'border-yellow-500/50 bg-yellow-500/5 ring-2 ring-offset-2 ring-offset-slate-950 ring-yellow-500/30';
        }
        return 'border-slate-700 bg-slate-800/50';
    };

    return (
        <div className={`relative p-4 rounded-2xl border transition-all duration-300 ${getStateStyles()}`}>
            {/* Active indicator */}
            {isActive && !allCompleted && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-950 text-xs font-bold uppercase tracking-wider animate-pulse">
                    Agora
                </div>
            )}

            {/* Completed indicator */}
            {allCompleted && tasks.length > 0 && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-green-500 text-green-950 text-xs font-bold flex items-center gap-1">
                    <Check size={12} /> Feito
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-500" />
                    <span className="text-slate-400 text-sm font-mono">
                        {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                    </span>
                    <span className="text-slate-600 text-xs">
                        ({durationHours}h)
                    </span>
                </div>
            </div>

            {/* Tasks list */}
            {tasks.length > 0 ? (
                <div className="space-y-2 mb-3">
                    {tasks.map((task) => (
                        <TimeSlotTaskItem
                            key={task.id}
                            task={task}
                            goal={getGoalById(task.goalId)}
                            onToggleComplete={() => onToggleComplete(task.id)}
                            onUpdateCount={(count) => onUpdateCount(task.id, count)}
                            onUpdateMinutes={(mins) => onUpdateMinutes(task.id, mins)}
                            onRemove={() => onRemoveTask(task.id)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-slate-600 text-sm text-center py-2 mb-3">
                    Nenhuma meta atribuída
                </p>
            )}

            {/* Add button */}
            <button
                onClick={onAddTask}
                className="w-full py-2 rounded-lg border-2 border-dashed border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 transition-colors flex items-center justify-center gap-2 text-sm"
            >
                <Plus size={16} />
                Adicionar Meta
            </button>
        </div>
    );
});

ScheduleTimeBlock.displayName = 'ScheduleTimeBlock';

export default ScheduleTimeBlock;
