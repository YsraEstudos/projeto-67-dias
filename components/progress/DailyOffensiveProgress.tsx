import React, { useMemo } from 'react';
import { BookOpen, GraduationCap, Flame, AlertCircle, Gamepad2, Target } from 'lucide-react';
import { useReadingStore, useSkillsStore, useConfigStore, useGamesStore } from '../../stores';
import { calculateDailyOffensiveAdvanced } from '../../utils/dailyOffensiveUtils';
import { DEFAULT_OFFENSIVE_GOALS } from '../../stores/configStore';

export const DailyOffensiveProgress: React.FC = () => {
    const books = useReadingStore((s) => s.books);
    const skills = useSkillsStore((s) => s.skills);
    const { games } = useGamesStore();
    const config = useConfigStore((s) => s.config);

    const offensiveConfig = config.offensiveGoals || DEFAULT_OFFENSIVE_GOALS;

    const {
        weightedProgress,
        isOffensive,
        readingProgress,
        skillProgress,
        gamesProgress,
        categoryBreakdown
    } = useMemo(() => {
        return calculateDailyOffensiveAdvanced(books, skills, games, offensiveConfig);
    }, [books, skills, games, offensiveConfig]);

    // Calcular cores e mensagens baseadas no progresso
    const getProgressColor = (value: number) => {
        if (value >= 100) return 'bg-emerald-500';
        if (value >= 50) return 'bg-cyan-500';
        return 'bg-slate-600';
    };

    const mainColor = isOffensive ? 'text-orange-500' : 'text-slate-400';
    const borderColor = isOffensive ? 'border-orange-500/30' : 'border-slate-700';

    return (
        <div className={`
            relative overflow-hidden rounded-2xl p-6 border transition-all duration-300
            ${isOffensive
                ? `bg-gradient-to-br from-slate-800 to-slate-900 ${borderColor} shadow-[0_0_20px_rgba(249,115,22,0.1)]`
                : 'bg-slate-800 border-slate-700'
            }
        `}>
            {/* Background Glow Effect */}
            {isOffensive && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isOffensive ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700/50 text-slate-500'}`}>
                            <Flame size={24} className={isOffensive ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${isOffensive ? 'text-white' : 'text-slate-300'}`}>
                                Ofensiva Diária
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {isOffensive
                                    ? '🔥 Modo ofensiva ativado!'
                                    : `Complete ${offensiveConfig.minimumPercentage}% da meta para ativar`}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-bold ${mainColor}`}>
                            {weightedProgress}%
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                            Progresso Ponderado
                        </div>
                    </div>
                </div>

                {/* Bars Container */}
                <div className="space-y-4">

                    {/* Skills Bar */}
                    {offensiveConfig.categoryWeights.skills > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <GraduationCap size={14} className="text-emerald-400" />
                                    <span>Skills</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                        Peso: {offensiveConfig.categoryWeights.skills}%
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono text-slate-300 mr-2">{skillProgress}%</span>
                                    <span className="text-[10px] text-emerald-500/70">+{categoryBreakdown.skills.contribution}% total</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(skillProgress)}`}
                                    style={{ width: `${Math.min(100, skillProgress)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Reading Bar */}
                    {offensiveConfig.categoryWeights.reading > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <BookOpen size={14} className="text-yellow-500" />
                                    <span>Leitura</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                        Peso: {offensiveConfig.categoryWeights.reading}%
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono text-slate-300 mr-2">{readingProgress}%</span>
                                    <span className="text-[10px] text-yellow-500/70">+{categoryBreakdown.reading.contribution}% total</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(readingProgress)}`}
                                    style={{ width: `${Math.min(100, readingProgress)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Games Bar */}
                    {offensiveConfig.categoryWeights.games > 0 && (
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Gamepad2 size={14} className="text-purple-400" />
                                    <span>Jogos</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                        Peso: {offensiveConfig.categoryWeights.games}%
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono text-slate-300 mr-2">{gamesProgress}%</span>
                                    <span className="text-[10px] text-purple-500/70">+{categoryBreakdown.games.contribution}% total</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(gamesProgress)}`}
                                    style={{ width: `${Math.min(100, gamesProgress)}%` }}
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Status Indicator / Tip */}
                <div className={`mt-5 pt-4 border-t ${isOffensive ? 'border-orange-500/20' : 'border-slate-700/50'} flex items-center gap-3`}>
                    {isOffensive ? (
                        <>
                            <div className="w-full text-center">
                                <p className="text-sm text-orange-300 font-medium animate-pulse">
                                    ✨ Dia produtivo garantido! Continue assim.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Target size={16} className="text-slate-500 shrink-0" />
                            <p className="text-xs text-slate-500">
                                A barra de progresso total é a soma ponderada das categorias acima. Configure os pesos na tela de Ajustes.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
