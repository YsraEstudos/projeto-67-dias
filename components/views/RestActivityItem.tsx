import React from 'react';
import { CheckCircle2, Circle, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { RestActivity } from '../../types';
import CommentTooltip from '../ui/CommentTooltip';

interface RestActivityItemProps {
    activity: RestActivity;
    index: number;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    onToggleComplete: (id: string) => void;
    onEdit: (activity: RestActivity) => void;
    onDelete: (id: string) => void;
}

const RestActivityItem: React.FC<RestActivityItemProps> = React.memo(({
    activity,
    index,
    onDragStart,
    onDrop,
    onToggleComplete,
    onEdit,
    onDelete
}) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, index)}
            className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${activity.isCompleted
                ? 'bg-slate-900/30 border-slate-800 opacity-60'
                : 'bg-slate-800 border-slate-700 hover:border-cyan-500/30 hover:bg-slate-750 shadow-md'
                }`}
        >
            {/* Drag Handle */}
            <div className="cursor-grab active:cursor-grabbing text-slate-700 hover:text-cyan-500 p-1 transition-colors">
                <GripVertical size={20} />
            </div>

            {/* Checkbox */}
            <button
                onClick={() => onToggleComplete(activity.id)}
                className={`flex-shrink-0 transition-all duration-300 ${activity.isCompleted
                    ? 'text-cyan-500 scale-110'
                    : 'text-slate-600 hover:text-cyan-400'
                    }`}
            >
                {activity.isCompleted ? <CheckCircle2 size={28} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" /> : <Circle size={28} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={`font-medium text-lg truncate transition-colors ${activity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {activity.title}
                </div>
                {(activity.notes || (activity.links && activity.links.length > 0)) && (
                    <CommentTooltip
                        comment={activity.notes || ''}
                        links={activity.links}
                        className="mt-1"
                    />
                )}
                <div className="flex gap-2 mt-1.5">
                    {activity.type === 'DAILY' && (
                        <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 tracking-wider">
                            DIÁRIO
                        </span>
                    )}
                    {activity.type === 'WEEKLY' && (
                        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 tracking-wider">
                            SEMANAL
                        </span>
                    )}
                    {activity.type === 'ONCE' && (
                        <span className="text-[10px] font-bold bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded border border-slate-600/50 tracking-wider">
                            HOJE
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={() => onEdit(activity)}
                className="md:opacity-0 md:group-hover:opacity-100 p-2 hover:bg-cyan-500/10 text-slate-600 hover:text-cyan-400 rounded-lg transition-all duration-200"
                title="Editar"
            >
                <Pencil size={18} />
            </button>
            <button
                onClick={() => onDelete(activity.id)}
                className="md:opacity-0 md:group-hover:opacity-100 p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all duration-200"
                title="Remover"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
});

export default RestActivityItem;
