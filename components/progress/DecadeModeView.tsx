import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import {
    Calendar, Target, Trophy, Clock, Flag,
    ArrowRight, Sparkles, AlertCircle
} from 'lucide-react';

import { useDecadeStore } from '../../stores/decadeStore';
import { useConfigStore } from '../../stores/configStore';
import { useReviewStore } from '../../stores/reviewStore';
import {
    calculateDecadeProgress,
    canFinalizeCycle,
    aggregateCycleStats,
    DECADE_CONFIG
} from '../../services/decadeCycle';
import { calculateCurrentDay } from '../../services/weeklySnapshot';

import { CycleHistoryTimeline } from './CycleHistoryTimeline';
import { CycleGoalModal } from './CycleGoalModal';
import { CompleteCycleModal } from './CompleteCycleModal';

export const DecadeModeView: React.FC = memo(() => {
    // Stores - Seletores atômicos para evitar re-renders desnecessários
    const decadeData = useDecadeStore((s) => s.decadeData);
    const initializeDecade = useDecadeStore((s) => s.initializeDecade);
    const setCycleGoal = useDecadeStore((s) => s.setCycleGoal);
    const completeCycle = useDecadeStore((s) => s.completeCycle);

    const config = useConfigStore((s) => s.config);
    const reviewData = useReviewStore((s) => s.reviewData);

    // Local State
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    // Derived Data
    const currentDay = useMemo(() => calculateCurrentDay(config.startDate), [config.startDate]);
    const progress = useMemo(() =>
        calculateDecadeProgress(decadeData.currentCycle, currentDay),
        [decadeData.currentCycle, currentDay]
    );

    const aggregatedStats = useMemo(() =>
        aggregateCycleStats(decadeData.cycleHistory),
        [decadeData.cycleHistory]
    );

    const completionStatus = useMemo(() =>
        canFinalizeCycle(currentDay, decadeData.pendingCycleGoal),
        [currentDay, decadeData.pendingCycleGoal]
    );

    // Initialize if needed
    useEffect(() => {
        initializeDecade();
    }, [initializeDecade]);

    // Handlers - Memoized
    const handleSaveGoal = useCallback((goal: string) => {
        setCycleGoal(goal);
    }, [setCycleGoal]);

    const handleCompleteCycle = useCallback((goalAchieved: 'YES' | 'PARTIAL' | 'NO') => {
        completeCycle(reviewData, goalAchieved, config.startDate);
        setIsCompleteModalOpen(false);
    }, [completeCycle, reviewData, config.startDate]);

    const handleCycleClick = useCallback((cycleNum: number) => {
        // Future: Show cycle details modal
        console.log('Cycle clicked:', cycleNum);
    }, []);

    const openGoalModal = useCallback(() => setIsGoalModalOpen(true), []);
    const closeGoalModal = useCallback(() => setIsGoalModalOpen(false), []);
    const openCompleteModal = useCallback(() => setIsCompleteModalOpen(true), []);
    const closeCompleteModal = useCallback(() => setIsCompleteModalOpen(false), []);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">

            {/* --- HERO SECTION --- */}
            <div className="relative bg-slate-900 rounded-3xl p-8 border border-slate-700 overflow-hidden shadow-2xl">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30 uppercase tracking-wider">
                                Modo Legado
                            </span>
                            <span className="text-slate-500 text-xs font-mono">
                                {progress.yearsElapsed} / {DECADE_CONFIG.YEARS_APPROX} ANOS
                            </span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Ciclo <span className="text-amber-500">{decadeData.currentCycle}</span>
                            <span className="text-slate-600 text-2xl mx-2">/</span>
                            <span className="text-slate-500 text-3xl">{DECADE_CONFIG.TOTAL_CYCLES}</span>
                        </h2>

                        <p className="text-slate-400 max-w-xl leading-relaxed">
                            "A longo prazo, nós superestimamos o que podemos fazer em um ano e subestimamos o que podemos fazer em dez."
                            Você está construindo um legado, ciclo por ciclo.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            {completionStatus.ready ? (
                                <button
                                    onClick={() => setIsCompleteModalOpen(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 animate-pulse"
                                >
                                    <Trophy size={20} />
                                    Finalizar Ciclo {decadeData.currentCycle}
                                </button>
                            ) : (
                                <div className="px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-700 flex items-center gap-3 text-slate-400 text-sm">
                                    <Clock size={16} />
                                    <span>
                                        {currentDay < DECADE_CONFIG.DAYS_PER_CYCLE
                                            ? `Dia ${currentDay} de ${DECADE_CONFIG.DAYS_PER_CYCLE} para completar`
                                            : !decadeData.pendingCycleGoal
                                                ? 'Defina seu objetivo para avançar'
                                                : 'Pronto para finalizar'
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress Circle for Decade */}
                    <div className="relative w-40 h-40 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle className="text-slate-800 stroke-current" strokeWidth="8" cx="50" cy="50" r="42" fill="transparent"></circle>
                            <circle
                                className="text-indigo-500 stroke-current transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeLinecap="round"
                                cx="50" cy="50" r="42"
                                fill="transparent"
                                strokeDasharray="263.89"
                                strokeDashoffset={263.89 - (263.89 * progress.percentage) / 100}
                            ></circle>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-white">{progress.percentage.toFixed(1)}%</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Geral</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CURRENT CYCLE GOAL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target size={120} />
                    </div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                                <Flag size={20} />
                            </div>
                            <h3 className="font-bold text-white text-lg">Objetivo do Ciclo Atual</h3>
                        </div>
                        <button
                            onClick={() => setIsGoalModalOpen(true)}
                            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
                        >
                            {decadeData.pendingCycleGoal ? 'Editar Objetivo' : 'Definir Objetivo'}
                        </button>
                    </div>

                    {decadeData.pendingCycleGoal ? (
                        <p className="text-slate-300 text-lg leading-relaxed italic relative z-10">
                            "{decadeData.pendingCycleGoal}"
                        </p>
                    ) : (
                        <div
                            onClick={() => setIsGoalModalOpen(true)}
                            className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500/50 hover:text-amber-500/80 hover:bg-slate-800/50 cursor-pointer transition-all gap-3 relative z-10"
                        >
                            <Target size={32} />
                            <span className="font-medium">Defina onde você quer chegar neste ciclo</span>
                        </div>
                    )}
                </div>

                {/* --- STATS CARD --- */}
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-400" />
                            Estatísticas Cumulativas
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-slate-400 text-sm">Ciclos Completos</span>
                                <span className="text-white font-bold">{aggregatedStats.cyclesCompleted}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-slate-400 text-sm">Score Médio</span>
                                <span className="text-emerald-400 font-bold">{aggregatedStats.averageScore}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-slate-400 text-sm">Dias Totais</span>
                                <span className="text-blue-400 font-bold">{aggregatedStats.totalDaysProgressed}</span>
                            </div>
                        </div>
                    </div>

                    {aggregatedStats.cyclesCompleted > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <p className="text-xs text-slate-500 text-center">
                                Melhor desempenho no <strong>Ciclo {aggregatedStats.bestCycle}</strong>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- TIMELINE --- */}
            <CycleHistoryTimeline
                currentCycle={decadeData.currentCycle}
                history={decadeData.cycleHistory}
                onCycleClick={handleCycleClick}
            />

            {/* --- MODALS --- */}
            <CycleGoalModal
                isOpen={isGoalModalOpen}
                onClose={() => setIsGoalModalOpen(false)}
                initialGoal={decadeData.pendingCycleGoal || ''}
                onSave={handleSaveGoal}
                cycleNumber={decadeData.currentCycle}
            />

            <CompleteCycleModal
                isOpen={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                cycleNumber={decadeData.currentCycle}
                cycleGoal={decadeData.pendingCycleGoal || ''}
                onConfirm={handleCompleteCycle}
            />
        </div>
    );
});
