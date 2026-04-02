import React from 'react';
import { CheckCircle2, Circle, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { RestActivity } from '../../types';
import CommentTooltip from '../ui/CommentTooltip';
import { getRestActivitySeriesStats, normalizeRestActivity } from '../../utils/restActivityUtils';

interface RestActivityItemProps {
    activity: RestActivity;
    index: number;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    onToggleComplete: (id: string) => void;
    onToggleSeries: (activityId: string, seriesId: string) => void;
    onEdit: (activity: RestActivity) => void;
    onDelete: (id: string) => void;
}

const RestActivityItem: React.FC<RestActivityItemProps> = React.memo(({
    activity,
    index,
    onDragStart,
    onDrop,
    onToggleComplete,
    onToggleSeries,
    onEdit,
    onDelete
}) => {
    const normalizedActivity = normalizeRestActivity(activity);
    const { hasSeries, total, completed } = getRestActivitySeriesStats(normalizedActivity);
    const quickActionTitle = hasSeries
        ? normalizedActivity.isCompleted
            ? `Desfazer última série (${completed}/${total})`
            : `Marcar próxima série (${completed}/${total})`
        : 'Marcar atividade';

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
                onClick={() => onToggleComplete(normalizedActivity.id)}
                title={quickActionTitle}
                className={`flex-shrink-0 transition-all duration-300 ${normalizedActivity.isCompleted
                    ? 'text-cyan-500 scale-110'
                    : 'text-slate-600 hover:text-cyan-400'
                    }`}
            >
                {normalizedActivity.isCompleted ? <CheckCircle2 size={28} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" /> : <Circle size={28} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={`font-medium text-lg truncate transition-colors ${normalizedActivity.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {normalizedActivity.title}
                </div>
                {hasSeries && (
                    <div className="text-xs text-cyan-400 mt-1 font-semibold">
                        Séries: {completed}/{total}
                    </div>
                )}
                {(normalizedActivity.notes || (normalizedActivity.links && normalizedActivity.links.length > 0)) && (
                    <CommentTooltip
                        comment={normalizedActivity.notes || ''}
                        links={normalizedActivity.links}
                        className="mt-1"
                    />
                )}
                {hasSeries && normalizedActivity.series && (
                    <div className="mt-3 grid gap-2">
                        {normalizedActivity.series.map((series) => (
                            <button
                                key={series.id}
                                type="button"
                                onClick={() => onToggleSeries(normalizedActivity.id, series.id)}
                                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                                    series.isCompleted
                                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                                        : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-cyan-500/30 hover:text-white'
                                }`}
                            >
                                {series.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                <span className="truncate">{series.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex gap-2 mt-1.5">
                    {normalizedActivity.type === 'DAILY' && (
                        <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 tracking-wider">
                            DIÁRIO
                        </span>
                    )}
                    {normalizedActivity.type === 'WEEKLY' && (
                        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 tracking-wider">
                            SEMANAL
                        </span>
                    )}
                    {normalizedActivity.type === 'ONCE' && (
                        <span className="text-[10px] font-bold bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded border border-slate-600/50 tracking-wider">
                            HOJE
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={() => onEdit(normalizedActivity)}
                className="md:opacity-0 md:group-hover:opacity-100 p-2 hover:bg-cyan-500/10 text-slate-600 hover:text-cyan-400 rounded-lg transition-all duration-200"
                title="Editar"
            >
                <Pencil size={18} />
            </button>
            <button
                onClick={() => onDelete(normalizedActivity.id)}
                className="md:opacity-0 md:group-hover:opacity-100 p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-all duration-200"
                title="Remover"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
});

export default RestActivityItem;
