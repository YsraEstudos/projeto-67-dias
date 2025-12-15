import React from 'react';
import { Flame, Snowflake, Trophy, Calendar, TrendingUp, Shield } from 'lucide-react';
import { useStreakStore } from '../../stores';

export const StreakCard: React.FC = () => {
    const currentStreak = useStreakStore((s) => s.currentStreak);
    const longestStreak = useStreakStore((s) => s.longestStreak);
    const freezeDaysAvailable = useStreakStore((s) => s.freezeDaysAvailable);
    const freezeDaysUsed = useStreakStore((s) => s.freezeDaysUsed);
    const totalActiveDays = useStreakStore((s) => s.totalActiveDays);
    const totalFreezeUsed = useStreakStore((s) => s.totalFreezeUsed);
    const lastActiveDate = useStreakStore((s) => s.lastActiveDate);
    const streakStartDate = useStreakStore((s) => s.streakStartDate);
    const useFreeze = useStreakStore((s) => s.useFreeze);
    const isActiveToday = useStreakStore((s) => s.isActiveToday());

    const handleUseFreeze = () => {
        if (freezeDaysAvailable > 0) {
            useFreeze();
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-orange-500/10 to-red-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Flame size={24} className="text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Sistema de Ofensivas</h3>
                            <p className="text-sm text-slate-400">Mantenha sua consistência diária</p>
                        </div>
                    </div>

                    {/* Current Streak Big Display */}
                    <div className="text-right">
                        <div className="text-3xl font-bold text-orange-400">{currentStreak}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">dias</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Record */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                    <Trophy size={20} className="mx-auto mb-2 text-yellow-400" />
                    <div className="text-xl font-bold text-white">{longestStreak}</div>
                    <div className="text-xs text-slate-400">Recorde</div>
                </div>

                {/* Active Days */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                    <Calendar size={20} className="mx-auto mb-2 text-emerald-400" />
                    <div className="text-xl font-bold text-white">{totalActiveDays}</div>
                    <div className="text-xs text-slate-400">Dias Ativos</div>
                </div>

                {/* Streak Start */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                    <TrendingUp size={20} className="mx-auto mb-2 text-blue-400" />
                    <div className="text-lg font-bold text-white">{formatDate(streakStartDate)}</div>
                    <div className="text-xs text-slate-400">Início</div>
                </div>

                {/* Last Active */}
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                    <Shield size={20} className={`mx-auto mb-2 ${isActiveToday ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <div className="text-lg font-bold text-white">
                        {isActiveToday ? 'Hoje ✓' : formatDate(lastActiveDate)}
                    </div>
                    <div className="text-xs text-slate-400">Última Atividade</div>
                </div>
            </div>

            {/* Freeze Days Section */}
            <div className="p-6 border-t border-slate-700 bg-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Snowflake size={18} className="text-cyan-400" />
                        <span className="font-medium text-white">Dias de Folga</span>
                    </div>
                    <span className="text-sm text-slate-400">
                        {totalFreezeUsed} usados no total
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Visual Freeze Indicators */}
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  border-2 transition-all duration-300
                  ${i < freezeDaysAvailable
                                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                        : 'bg-slate-700/50 border-slate-600/50 text-slate-500'
                                    }
                `}
                            >
                                <Snowflake size={18} />
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 text-sm text-slate-400">
                        <span className="font-bold text-cyan-400">{freezeDaysAvailable}</span> de 3 disponíveis
                    </div>

                    {/* Manual Freeze Button */}
                    <button
                        onClick={handleUseFreeze}
                        disabled={freezeDaysAvailable === 0}
                        className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${freezeDaysAvailable > 0
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                                : 'bg-slate-700/50 text-slate-500 border border-slate-600/50 cursor-not-allowed'
                            }
            `}
                    >
                        Usar Folga
                    </button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                    Dias de folga permitem pular até 3 dias sem perder sua sequência.
                    Eles são usados automaticamente quando você não registra atividade.
                </p>
            </div>
        </div>
    );
};

export default StreakCard;
