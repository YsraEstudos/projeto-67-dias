import React, { useMemo } from 'react';
import { Check, Clock, Star } from 'lucide-react';
import { WeeklySnapshot } from '../../types';

interface WeeklyTimelineProps {
    snapshots: WeeklySnapshot[];
    currentWeek: number;
    selectedWeek: number | null;
    bestWeek: number;
    onSelectWeek: (weekNumber: number) => void;
}

const getWeekStatus = (
    weekNumber: number,
    snapshots: WeeklySnapshot[],
    currentWeek: number
): 'completed' | 'current' | 'pending' | 'future' => {
    const snapshot = snapshots.find(s => s.weekNumber === weekNumber);

    if (weekNumber > currentWeek) return 'future';
    if (weekNumber === currentWeek) return 'current';
    if (snapshot?.status === 'CONFIRMED') return 'completed';
    if (snapshot?.status === 'PENDING') return 'pending';
    return 'completed'; // Default for past weeks with data
};

const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-cyan-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
};

export const WeeklyTimeline: React.FC<WeeklyTimelineProps> = React.memo(({
    snapshots,
    currentWeek,
    selectedWeek,
    bestWeek,
    onSelectWeek
}) => {
    const weeks = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []);

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Clock size={20} className="text-cyan-400" />
                Linha do Tempo - 10 Semanas
            </h3>

            {/* Timeline Container - Horizontal Scroll on Mobile */}
            <div className="overflow-x-auto overflow-y-visible pb-4 pt-4 px-3 -mx-3">
                <div className="flex items-center gap-3 min-w-max">
                    {weeks.map((weekNum, index) => {
                        const snapshot = snapshots.find(s => s.weekNumber === weekNum);
                        const status = getWeekStatus(weekNum, snapshots, currentWeek);
                        const score = snapshot?.evolution?.overallScore || 0;
                        const isSelected = selectedWeek === weekNum;
                        const isBest = weekNum === bestWeek && snapshot;

                        return (
                            <React.Fragment key={weekNum}>
                                {/* Week Node */}
                                <button
                                    onClick={() => status !== 'future' && onSelectWeek(weekNum)}
                                    disabled={status === 'future'}
                                    className={`
                                        relative flex flex-col items-center transition-all duration-300 py-2
                                        ${status === 'future' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer group'}
                                    `}
                                >
                                    {/* Best Week Star */}
                                    {isBest && (
                                        <Star
                                            size={14}
                                            className="absolute -top-4 text-amber-400 fill-amber-400 animate-pulse"
                                        />
                                    )}

                                    {/* Node Circle */}
                                    <div className="relative">
                                        {/* Animated ring for current week */}
                                        {status === 'current' && (
                                            <>
                                                <div className="absolute -inset-2 rounded-full border-2 border-cyan-400/40 animate-ping" style={{ animationDuration: '2s' }} />
                                                <div className="absolute -inset-1.5 rounded-full border-2 border-cyan-400/70" />
                                            </>
                                        )}

                                        <div className={`
                                            relative w-12 h-12 rounded-full flex items-center justify-center
                                            transition-all duration-300 border-2
                                            group-hover:shadow-xl group-hover:brightness-110
                                            ${isSelected
                                                ? 'ring-4 ring-cyan-500/30'
                                                : ''
                                            }
                                            ${status === 'completed'
                                                ? `${getScoreColor(score)} border-transparent text-white shadow-lg`
                                                : status === 'current'
                                                    ? 'bg-gradient-to-br from-cyan-500 to-teal-500 border-transparent text-white shadow-lg shadow-cyan-500/40'
                                                    : status === 'pending'
                                                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                                        : 'bg-slate-700 border-slate-600 text-slate-500 group-hover:border-slate-500'
                                            }
                                        `}>
                                            {status === 'completed' ? (
                                                <span className="text-sm font-bold">{score}</span>
                                            ) : status === 'current' ? (
                                                <span className="text-lg font-bold">{weekNum}</span>
                                            ) : status === 'pending' ? (
                                                <Clock size={16} />
                                            ) : (
                                                <span className="text-sm">{weekNum}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Week Label */}
                                    <span className={`
                                        mt-2 text-xs font-medium transition-colors
                                        ${isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}
                                    `}>
                                        S{weekNum}
                                    </span>
                                </button>

                                {/* Connector Line */}
                                {index < weeks.length - 1 && (
                                    <div className={`
                                        w-6 h-0.5 rounded-full transition-colors flex-shrink-0
                                        ${weekNum < currentWeek
                                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                                            : 'bg-slate-700'
                                        }
                                    `} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-400">80-100 pts</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-xs text-slate-400">60-79 pts</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-xs text-slate-400">40-59 pts</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs text-slate-400">&lt;40 pts</span>
                </div>
                <div className="flex items-center gap-2">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-400">Melhor semana</span>
                </div>
            </div>
        </div>
    );
});

export default WeeklyTimeline;
