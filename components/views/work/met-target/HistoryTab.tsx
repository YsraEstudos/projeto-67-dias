import React from 'react';
import { Circle, Target, Trophy, TrendingUp } from 'lucide-react';
import type { MetTargetSession } from '../../../../stores';
import { HistorySessionItem } from '../HistorySessionItem';
import { getWeekStart } from '../utils';

interface WorkGoals {
    weekly: number;
    ultra: number;
}

interface HistoryTabProps {
    history: MetTargetSession[];
    visibleHistory: MetTargetSession[];
    visibleHistoryCount: number;
    setVisibleHistoryCount: React.Dispatch<React.SetStateAction<number>>;
    reversedHistoryLength: number;
    onDeleteSession: (id: string) => void;
    // Progress Props
    weeklyPoints: number;
    targetGoal: number;
    weeklyProgressPercent: number;
    isInUltraPhase: boolean;
    goals: WorkGoals;
    hasMetWeeklyGoal: boolean;
    hasMetUltraGoal: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = React.memo(({
    history, visibleHistory, visibleHistoryCount, setVisibleHistoryCount, reversedHistoryLength, onDeleteSession,
    weeklyPoints, targetGoal, weeklyProgressPercent, isInUltraPhase, goals, hasMetWeeklyGoal, hasMetUltraGoal
}) => {
    return (
        <div className="space-y-4">
            {/* Weekly Progress Bar */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-slate-200 font-bold flex items-center gap-2">
                        <TrendingUp size={18} className="text-cyan-500" />
                        Progresso Semanal
                    </h4>
                    <span className="text-xs text-slate-500">
                        {new Date(getWeekStart(new Date())).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}. - Agora
                    </span>
                </div>

                {/* Progress Bar Container */}
                <div className="relative h-8 bg-slate-950 rounded-full overflow-hidden border border-slate-700 mb-3">
                    {/* Goal Markers */}
                    {!isInUltraPhase && goals.weekly !== goals.ultra && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-green-500/50 z-10 box-content pl-0.5"
                            style={{ left: '100%' }}
                            title={`Meta Normal (${goals.weekly} pts)`}
                        />
                    )}
                    {isInUltraPhase && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-amber-500/50 z-10 box-content pl-0.5"
                            style={{ left: '100%' }}
                            title={`Ultra Meta (${goals.ultra} pts)`}
                        />
                    )}

                    {/* Progress Fill */}
                    <div
                        className="absolute top-0 left-0 h-full transition-all duration-500"
                        role="progressbar"
                        aria-valuenow={weeklyPoints}
                        aria-valuemin={0}
                        aria-valuemax={targetGoal || 0}
                        style={{
                            width: `${weeklyProgressPercent}%`,
                            minWidth: weeklyPoints > 0 ? '8px' : '0',
                            background: isInUltraPhase
                                ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                                : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                        }}
                    />

                    {/* Points Label */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <span className="text-white font-bold text-sm drop-shadow-lg">
                            {weeklyPoints} / {targetGoal || 0} pts
                            {isInUltraPhase && <span className="ml-1 text-amber-300">🔥</span>}
                        </span>
                    </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center gap-3 text-xs flex-wrap">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${hasMetWeeklyGoal
                        ? 'bg-green-900/20 text-green-400 border-green-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                        <Circle size={12} fill={hasMetWeeklyGoal ? "currentColor" : "none"} />
                        Meta ({goals.weekly} pts)
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full border ${hasMetUltraGoal
                        ? 'bg-amber-900/20 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                        <Target size={12} />
                        Ultra Meta ({goals.ultra} pts)
                    </div>

                    {!hasMetWeeklyGoal ? (
                        <span className="text-slate-500 ml-auto">
                            Faltam {goals.weekly - weeklyPoints} pts para meta
                        </span>
                    ) : !hasMetUltraGoal ? (
                        <span className="text-amber-500 ml-auto font-medium">
                            Faltam {goals.ultra - weeklyPoints} pts para ultra!
                        </span>
                    ) : (
                        <span className="text-green-400 ml-auto font-bold flex items-center gap-1">
                            <Trophy size={12} /> Ultra Meta Atingida!
                        </span>
                    )}
                </div>
            </div>

            {/* History List with Pagination */}
            <div className="space-y-3">
                {history.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">Nenhuma sessão extra registrada.</div>
                ) : (
                    <>
                        {visibleHistory.map((session) => (
                            <HistorySessionItem
                                key={session.id}
                                session={session}
                                onDelete={onDeleteSession}
                            />
                        ))}
                        {visibleHistoryCount < reversedHistoryLength && (
                            <button
                                onClick={() => setVisibleHistoryCount(c => c + 20)}
                                className="w-full py-3 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
                            >
                                Carregar mais ({reversedHistoryLength - visibleHistoryCount} restantes)
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

HistoryTab.displayName = 'HistoryTab';
