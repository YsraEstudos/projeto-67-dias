import React from 'react';
import { AlertTriangle, Coffee, TrendingUp, Zap } from 'lucide-react';
import { PaceMode } from '../types';
import { formatTimeDiff } from '../utils';

interface AnalysisGridProps {
    preBreakCount: number;
    setPreBreakCount: (v: number) => void;
    paceMode: PaceMode;
    setPaceMode: (v: PaceMode) => void;
    // Stats
    expectedPreBreakCount: number;
    breakDiff: number;
    breakPerformance: 'positive' | 'negative';
    itemsRemaining: number;
    requiredPacePerHour: number;
    intervalPace: number;
    minutesRemaining: number;
}

export const AnalysisGrid: React.FC<AnalysisGridProps> = React.memo(({
    preBreakCount, setPreBreakCount, paceMode, setPaceMode,
    expectedPreBreakCount, breakDiff, breakPerformance, itemsRemaining,
    requiredPacePerHour, intervalPace, minutesRemaining
}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Break Analysis */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-200 font-semibold flex items-center gap-2">
                    <Coffee size={20} className="text-amber-500" /> Análise de Intervalo
                </h3>
                <span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">1h Duração</span>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-sm text-slate-400">Feito Pré-Almoço</span>
                    <input
                        type="number"
                        value={preBreakCount}
                        onChange={(e) => setPreBreakCount(Number(e.target.value))}
                        placeholder="0"
                        className="bg-slate-800 border border-slate-600 rounded w-20 text-right px-2 py-1 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                </div>

                <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        Meta Esperada: <span className="text-slate-300 font-mono">{expectedPreBreakCount}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full border ${breakPerformance === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {breakDiff > 0 ? '+' : ''}{breakDiff}
                        {breakPerformance === 'positive' ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                    </div>
                </div>

                <p className="text-xs text-slate-500 italic border-t border-slate-700/50 pt-3 mt-2">
                    {breakPerformance === 'positive'
                        ? "Ótimo ritmo! Você está adiantado em relação à meta para o período da manhã."
                        : "Atenção: Você fechou a manhã com déficit. Aumente o ritmo à tarde."}
                </p>
            </div>
        </div>

        {/* Pace Calculator */}
        <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-200 font-semibold flex items-center gap-2">
                    <Zap size={20} className="text-yellow-500" /> Ritmo Necessário
                </h3>
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => setPaceMode('10m')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${paceMode === '10m' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        10min
                    </button>
                    <button
                        onClick={() => setPaceMode('25m')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${paceMode === '25m' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        25min
                    </button>
                </div>
            </div>

            {itemsRemaining <= 0 ? (
                <div className="h-32 flex items-center justify-center text-green-400 font-medium bg-green-500/5 rounded-xl border border-green-500/20">
                    Meta atingida! Aproveite o resto do dia.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                        <span className="text-xs text-slate-500 mb-1">Por Hora</span>
                        <span className="text-2xl font-bold text-white">{Math.ceil(requiredPacePerHour)}</span>
                        <span className="text-[10px] text-slate-600">itens/h</span>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-xl border border-blue-500/50 flex flex-col justify-center shadow-lg">
                        <span className="text-xs text-blue-100 mb-1">A cada {paceMode === '10m' ? '10 min' : '25 min'}</span>
                        <span className="text-3xl font-bold text-white">{Math.ceil(intervalPace)}</span>
                        <span className="text-[10px] text-blue-200">itens para bater a meta</span>
                    </div>
                </div>
            )}

            {itemsRemaining > 0 && (
                <div className="mt-4 text-xs text-slate-500 text-center">
                    Faltam <strong className="text-slate-300">{itemsRemaining}</strong> itens em {formatTimeDiff(minutesRemaining)}.
                </div>
            )}
        </div>

    </div>
));

AnalysisGrid.displayName = 'AnalysisGrid';
