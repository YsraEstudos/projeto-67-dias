import React, { memo } from 'react';
import { Clock, Plus, TrendingUp } from 'lucide-react';
import { formatMinutes } from '../../../utils/weeklyAgendaUtils';

interface ActivityCardProps {
    id: string;
    name: string;
    completedMinutes: number;
    targetMinutes: number;
    color: string;
    type: 'skill' | 'activity';
    onAddTime?: (id: string) => void;
    compact?: boolean;
}

// Color mapping for theme variants
const COLOR_VARIANTS: Record<string, { bg: string; text: string; bar: string; border: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-500/30' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500', border: 'border-blue-500/30' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500', border: 'border-purple-500/30' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500', border: 'border-rose-500/30' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500', border: 'border-amber-500/30' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', bar: 'bg-cyan-500', border: 'border-cyan-500/30' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', bar: 'bg-pink-500', border: 'border-pink-500/30' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', bar: 'bg-orange-500', border: 'border-orange-500/30' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', bar: 'bg-indigo-500', border: 'border-indigo-500/30' },
};

const DEFAULT_VARIANT = COLOR_VARIANTS.emerald;

export const ActivityCard: React.FC<ActivityCardProps> = memo(({
    id,
    name,
    completedMinutes,
    targetMinutes,
    color,
    type,
    onAddTime,
    compact = false
}) => {
    const variant = COLOR_VARIANTS[color] || DEFAULT_VARIANT;
    const progressPercent = targetMinutes > 0 ? Math.min(100, (completedMinutes / targetMinutes) * 100) : 0;
    const isComplete = completedMinutes >= targetMinutes;
    const excessMinutes = completedMinutes > targetMinutes ? completedMinutes - targetMinutes : 0;

    if (compact) {
        return (
            <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${variant.bg} border ${variant.border}`}>
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-white font-medium truncate">{name}</div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div
                            className={`h-full ${variant.bar} transition-all duration-500 ease-out`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
                <div className={`text-xs font-mono ${variant.text} whitespace-nowrap`}>
                    {formatMinutes(completedMinutes)}
                </div>
            </div>
        );
    }

    return (
        <div className={`p-3 rounded-xl ${variant.bg} border ${variant.border} transition-all hover:border-opacity-60`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <span className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                        {type === 'skill' ? 'Habilidade' : 'Atividade'}
                    </span>
                    <h4 className="text-white font-medium text-sm truncate">{name}</h4>
                </div>
                {onAddTime && (
                    <button
                        onClick={() => onAddTime(id)}
                        className={`p-1.5 rounded-lg ${variant.bg} ${variant.text} hover:bg-opacity-50 transition-colors`}
                        title="Adicionar tempo"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative mb-2">
                <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${variant.bar} transition-all duration-700 ease-out relative`}
                        style={{ width: `${progressPercent}%` }}
                    >
                        {/* Animated shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                </div>

                {/* Progress indicator */}
                {progressPercent > 10 && (
                    <div
                        className="absolute top-1/2 -translate-y-1/2 text-[8px] font-bold text-white/80"
                        style={{ left: `${Math.min(progressPercent - 5, 90)}%` }}
                    >
                        {Math.round(progressPercent)}%
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={12} />
                    <span className={variant.text}>{formatMinutes(completedMinutes)}</span>
                    <span className="text-slate-600">/</span>
                    <span>{formatMinutes(targetMinutes)}</span>
                </div>

                {isComplete ? (
                    <div className="flex items-center gap-1 text-emerald-400 font-medium">
                        ✓ Completo
                        {excessMinutes > 0 && (
                            <span className="text-emerald-500 text-[10px]">+{formatMinutes(excessMinutes)}</span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-slate-500">
                        <TrendingUp size={12} />
                        <span>{formatMinutes(targetMinutes - completedMinutes)} restantes</span>
                    </div>
                )}
            </div>
        </div>
    );
});

ActivityCard.displayName = 'ActivityCard';

export default ActivityCard;
