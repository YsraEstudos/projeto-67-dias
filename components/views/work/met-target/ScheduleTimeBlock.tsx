import React, { useMemo } from 'react';
import { Check, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import type { ScheduleBlockConfig } from '../../../../types';

interface ScheduleTimeBlockProps {
    block: ScheduleBlockConfig;
    isActive: boolean;
    isCompleted: boolean;
    count?: number;
    onComplete: () => void;
    onUncomplete: () => void;
    onCountChange: (count: number) => void;
    onNavigate?: () => void;
}

/**
 * Individual time block card for schedule-based goals.
 * Shows time range, activity label, and appropriate action based on block type.
 */
export const ScheduleTimeBlock: React.FC<ScheduleTimeBlockProps> = React.memo(({
    block,
    isActive,
    isCompleted,
    count = 0,
    onComplete,
    onUncomplete,
    onCountChange,
    onNavigate,
}) => {
    // Memoize color mappings to avoid recreation on each render
    const colors = useMemo(() => {
        const colorClasses: Record<string, { border: string; bg: string; accent: string }> = {
            amber: {
                border: 'border-amber-500/50',
                bg: 'bg-amber-500/10',
                accent: 'text-amber-400',
            },
            violet: {
                border: 'border-violet-500/50',
                bg: 'bg-violet-500/10',
                accent: 'text-violet-400',
            },
            pink: {
                border: 'border-pink-500/50',
                bg: 'bg-pink-500/10',
                accent: 'text-pink-400',
            },
        };
        return colorClasses[block.color] || colorClasses.amber;
    }, [block.color]);

    // Format hours as HH:00
    const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

    // Determine card state styling
    const getStateStyles = () => {
        if (isCompleted) {
            return 'border-green-500/50 bg-green-500/10';
        }
        if (isActive) {
            return `${colors.border} ${colors.bg} ring-2 ring-offset-2 ring-offset-slate-950 ring-${block.color}-500/30`;
        }
        return 'border-slate-700 bg-slate-800/50';
    };

    // Render action based on block type
    const renderAction = () => {
        switch (block.id) {
            case 'NCM':
                // Free counter with +/- buttons
                return (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onCountChange(Math.max(0, count - 1))}
                            className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            <ArrowDown size={18} />
                        </button>
                        <span className={`text-3xl font-bold tabular-nums ${count > 0 ? colors.accent : 'text-white'}`}>
                            {count}
                        </span>
                        <button
                            onClick={() => onCountChange(count + 1)}
                            className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            <ArrowUp size={18} />
                        </button>
                    </div>
                );

            case 'STUDY':
                // Confirm checkbox
                return (
                    <button
                        onClick={isCompleted ? onUncomplete : onComplete}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isCompleted
                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-600'
                            }`}
                    >
                        {isCompleted ? (
                            <>
                                <Check size={18} />
                                Concluído!
                            </>
                        ) : (
                            <>📚 Confirmar Estudo</>
                        )}
                    </button>
                );

            case 'AJEITAR':
                // Navigate button
                return (
                    <button
                        onClick={onNavigate}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${colors.bg
                            } ${colors.accent} hover:brightness-110 border ${colors.border}`}
                    >
                        <ExternalLink size={18} />
                        Ir para Ajeitar Rápido
                    </button>
                );

            default:
                return null;
        }
    };

    return (
        <div
            className={`relative p-4 rounded-2xl border transition-all duration-300 ${getStateStyles()}`}
        >
            {/* Active indicator */}
            {isActive && !isCompleted && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-yellow-500 text-yellow-950 text-xs font-bold uppercase tracking-wider animate-pulse">
                    Agora
                </div>
            )}

            {/* Time range header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-xs font-mono">
                    {formatHour(block.startHour)} - {formatHour(block.endHour)}
                </span>
                {isCompleted && (
                    <span className="text-green-400 text-xs font-bold">✓</span>
                )}
            </div>

            {/* Icon and label */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{block.icon}</span>
                <h4 className={`font-bold ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                    {block.label}
                </h4>
            </div>

            {/* Action area */}
            <div className="flex justify-center">
                {renderAction()}
            </div>
        </div>
    );
});

ScheduleTimeBlock.displayName = 'ScheduleTimeBlock';

export default ScheduleTimeBlock;
