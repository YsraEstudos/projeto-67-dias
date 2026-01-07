
import React, { memo } from 'react';
import { CheckSquare, RotateCcw, Clock, Bell, Tag, Trash2 } from 'lucide-react';
import { OrganizeTask } from '../../types';
import { formatters } from '../../utils/formatters';
import { getCategoryColor } from '../../utils/styling';

interface TaskItemProps {
    task: OrganizeTask;
    toggleCompleteTask: (id: string) => void;
    restoreTask: (id: string) => void;
    deleteTask: (id: string) => void;
    onEdit: (task: OrganizeTask) => void;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return formatters.dayMonth.format(adjustedDate);
};

export const TaskItem = memo(({
    task,
    toggleCompleteTask,
    restoreTask,
    deleteTask,
    onEdit
}: TaskItemProps) => {
    return (
        <div className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 flex items-start gap-4">
            {/* Status Toggle */}
            {task.isArchived ? (
                <button
                    onClick={() => restoreTask(task.id)}
                    className="text-slate-600 hover:text-indigo-400 transition-colors"
                    title="Restaurar"
                >
                    <RotateCcw size={24} />
                </button>
            ) : (
                <button
                    onClick={() => toggleCompleteTask(task.id)}
                    className={`transition-colors ${task.isCompleted ? 'text-indigo-500' : 'text-slate-600 hover:text-indigo-400'}`}
                >
                    {task.isCompleted ? <CheckSquare size={24} /> : <div className="w-6 h-6 rounded border-2 border-current" />}
                </button>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-base font-medium truncate ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                    </span>
                    {task.dueDate && !task.isCompleted && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
                            <Clock size={10} />
                            {formatDate(task.dueDate)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider ${getCategoryColor(task.category)}`}>
                        {task.category.toUpperCase()}
                    </span>

                    {task.reminderDate && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1" title={`Lembrete para: ${formatDate(task.reminderDate)}`}>
                            <Bell size={10} className="text-yellow-500" /> Lembrete
                        </span>
                    )}
                </div>
            </div>

            {/* Actions - visible on mobile, hover on desktop */}
            <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {!task.isArchived && (
                    <button
                        onClick={() => onEdit(task)}
                        className="p-2 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors"
                    >
                        <Tag size={16} />
                    </button>
                )}
                <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 hover:bg-red-900/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
});
