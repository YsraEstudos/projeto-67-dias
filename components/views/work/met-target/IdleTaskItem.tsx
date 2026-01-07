import React, { useState } from 'react';
import { Check, X, Edit3, LayoutList, Target } from 'lucide-react';
import { IdleTask } from '../../../../types';

interface IdleTaskItemProps {
    task: IdleTask;
    onComplete: () => void;
    onRemove: () => void;
    onEditPoints: (points: number) => void;
}

/**
 * Individual task item in the Idle Tasks list (Metas Extras)
 * Shows task title, points (editable), and action buttons
 */
export const IdleTaskItem: React.FC<IdleTaskItemProps> = ({
    task,
    onComplete,
    onRemove,
    onEditPoints,
}) => {
    const [isEditingPoints, setIsEditingPoints] = useState(false);
    const [pointsInput, setPointsInput] = useState(task.points.toString());

    const handleSavePoints = () => {
        const newPoints = parseInt(pointsInput, 10);
        if (!isNaN(newPoints) && newPoints >= 0) {
            onEditPoints(newPoints);
        } else {
            setPointsInput(task.points.toString());
        }
        setIsEditingPoints(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSavePoints();
        } else if (e.key === 'Escape') {
            setPointsInput(task.points.toString());
            setIsEditingPoints(false);
        }
    };

    const TypeIcon = task.sourceType === 'TASK' ? LayoutList : Target;
    const typeColor = task.sourceType === 'TASK' ? 'text-indigo-400' : 'text-emerald-400';

    return (
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-all group">
            {/* Type Icon */}
            <div className={`p-2 rounded-lg bg-slate-900 ${typeColor}`}>
                <TypeIcon size={16} />
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{task.title}</p>
                <p className="text-xs text-slate-500">
                    {task.sourceType === 'TASK' ? 'Tarefa' : 'Hábito'}
                </p>
            </div>

            {/* Points */}
            <div className="flex items-center gap-1">
                {isEditingPoints ? (
                    <input
                        type="number"
                        value={pointsInput}
                        onChange={(e) => setPointsInput(e.target.value)}
                        onBlur={handleSavePoints}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        min={0}
                        className="w-12 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm text-center focus:border-yellow-500 outline-none"
                    />
                ) : (
                    <button
                        onClick={() => setIsEditingPoints(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-sm font-bold hover:bg-yellow-500/20 transition-colors"
                        title="Editar pontos"
                    >
                        {task.points} pts
                        <Edit3 size={12} className="opacity-50" />
                    </button>
                )}
            </div>

            {/* Actions - visible on mobile, hover on desktop */}
            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {/* Complete */}
                <button
                    onClick={onComplete}
                    className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                    title="Completar tarefa"
                >
                    <Check size={16} />
                </button>

                {/* Remove */}
                <button
                    onClick={onRemove}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Remover da lista"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default IdleTaskItem;
