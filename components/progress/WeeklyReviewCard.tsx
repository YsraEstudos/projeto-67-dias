import React from 'react';
import {
    TrendingUp, TrendingDown, Minus, Flame, BookOpen,
    GraduationCap, CheckCircle2, Calendar, Star, Sparkles, Gamepad2
} from 'lucide-react';
import { WeeklySnapshot } from '../../types';

interface WeeklyReviewCardProps {
    snapshot: WeeklySnapshot;
    isCurrentWeek: boolean;
    isBestWeek: boolean;
    onClick?: () => void;
}

const getTrendIcon = (trend: 'UP' | 'DOWN' | 'STABLE') => {
    switch (trend) {
        case 'UP': return <TrendingUp size={16} className="text-emerald-400" />;
        case 'DOWN': return <TrendingDown size={16} className="text-rose-400" />;
        default: return <Minus size={16} className="text-slate-400" />;
    }
};

const getTrendColor = (trend: 'UP' | 'DOWN' | 'STABLE') => {
    switch (trend) {
        case 'UP': return 'text-emerald-400';
        case 'DOWN': return 'text-rose-400';
        default: return 'text-slate-400';
    }
};

export const WeeklyReviewCard: React.FC<WeeklyReviewCardProps> = React.memo(({
    snapshot,
    isCurrentWeek,
    isBestWeek,
    onClick
}) => {
    const { metrics, evolution } = snapshot;
    const trend = evolution?.trend || 'STABLE';

    // Calcular dias decorridos nesta semana (para exibição)
    const startDate = new Date(snapshot.startDate);
    const endDate = new Date(snapshot.endDate);
    const now = new Date();
    const daysIntoWeek = isCurrentWeek
        ? Math.min(7, Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))))
        : 7;
    const weekProgress = (daysIntoWeek / 7) * 100;

    return (
        <div
            onClick={onClick}
            className={`
                relative bg-slate-800 rounded-2xl p-5 border transition-all duration-300 cursor-pointer
                hover:-translate-y-1 hover:shadow-xl group
                ${isCurrentWeek
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                    : 'border-slate-700 hover:border-slate-600'
                }
            `}
        >
            {/* Badges */}
            <div className="absolute -top-2 -right-2 flex gap-1">
                {isCurrentWeek && (
                    <span className="px-2 py-0.5 bg-cyan-500 text-white text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                        <Calendar size={10} /> Atual
                    </span>
                )}
                {isBestWeek && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                        <Star size={10} /> Melhor
                    </span>
                )}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-bold text-white">Semana {snapshot.weekNumber}</h3>
                    <p className="text-xs text-slate-500">
                        {(() => {
                            // Parse string YYYY-MM-DD as local date to ensure day match
                            const [startY, startM, startD] = snapshot.startDate.split('-').map(Number);
                            const [endY, endM, endD] = snapshot.endDate.split('-').map(Number);

                            const start = new Date(startY, startM - 1, startD);
                            const end = new Date(endY, endM - 1, endD);

                            return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
                        })()}
                    </p>
                </div>

                {/* Overall Score */}
                <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
                    {getTrendIcon(trend)}
                    <span className="text-2xl font-bold">{evolution?.overallScore || '-'}</span>
                </div>
            </div>

            {/* Week Progress Bar - Only for current week */}
            {isCurrentWeek && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-slate-400">Dia {daysIntoWeek} de 7</span>
                        <span className="text-xs text-cyan-400 font-medium">{Math.round(weekProgress)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${weekProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Habits */}
                <div className="bg-slate-900/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Flame size={14} className="text-orange-400" />
                        <span className="text-xs text-slate-400">Hábitos</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">{metrics.habitConsistency}%</span>
                        {evolution && evolution.habitsChange !== 0 && (
                            <span className={`text-xs ${evolution.habitsChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {evolution.habitsChange > 0 ? '+' : ''}{evolution.habitsChange}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-slate-900/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <GraduationCap size={14} className="text-emerald-400" />
                        <span className="text-xs text-slate-400">Estudo</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">{Math.round(metrics.skillMinutes / 60)}h</span>
                        {evolution && evolution.skillsChange !== 0 && (
                            <span className={`text-xs ${evolution.skillsChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {evolution.skillsChange > 0 ? '+' : ''}{Math.round(evolution.skillsChange / 60)}h
                            </span>
                        )}
                    </div>
                </div>

                {/* Books */}
                <div className="bg-slate-900/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={14} className="text-yellow-400" />
                        <span className="text-xs text-slate-400">Leitura</span>
                    </div>
                    <span className="text-lg font-bold text-white">{metrics.booksProgress} págs</span>
                </div>

                {/* Tasks */}
                <div className="bg-slate-900/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={14} className="text-blue-400" />
                        <span className="text-xs text-slate-400">Tarefas</span>
                    </div>
                    <span className="text-lg font-bold text-white">{metrics.tasksCompleted}</span>
                </div>

                {/* Games */}
                <div className="bg-slate-900/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Gamepad2 size={14} className="text-purple-400" />
                        <span className="text-xs text-slate-400">Games</span>
                        {evolution.gamesChange !== undefined && evolution.gamesChange !== 0 && (
                            <span className={`text-[10px] ${evolution.gamesChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {evolution.gamesChange > 0 ? '+' : ''}{evolution.gamesChange}h
                            </span>
                        )}
                    </div>
                    <span className="text-lg font-bold text-white">{metrics.gamesHoursPlayed || 0}h</span>
                </div>
            </div>

            {/* AI Insights Preview */}
            {snapshot.aiInsights && (
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={12} className="text-purple-400" />
                        <span className="text-xs text-purple-300 font-medium">Insight da IA</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2">{snapshot.aiInsights.summary}</p>
                </div>
            )}

            {/* Status Badge */}
            {snapshot.status === 'PENDING' && (
                <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/30 text-center">
                    <span className="text-xs text-amber-400 font-medium">⏳ Aguardando confirmação</span>
                </div>
            )}
        </div>
    );
});

export default WeeklyReviewCard;
