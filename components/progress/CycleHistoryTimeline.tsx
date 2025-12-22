import React, { useMemo, useCallback, memo } from 'react';
import { CycleSnapshot } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface CycleHistoryTimelineProps {
    currentCycle: number;
    history: CycleSnapshot[];
    onCycleClick: (cycleValue: number) => void;
}

// Constante estática - array de 55 ciclos (não recria a cada render)
const CYCLE_NUMBERS = Array.from({ length: 55 }, (_, i) => i + 1);

// Pré-calcular rows estáticas
const CYCLE_ROWS = [
    CYCLE_NUMBERS.slice(0, 10),
    CYCLE_NUMBERS.slice(10, 20),
    CYCLE_NUMBERS.slice(20, 30),
    CYCLE_NUMBERS.slice(30, 40),
    CYCLE_NUMBERS.slice(40, 50),
    CYCLE_NUMBERS.slice(50, 55),
];

export const CycleHistoryTimeline: React.FC<CycleHistoryTimelineProps> = memo(({
    currentCycle,
    history,
    onCycleClick
}) => {
    // Criar lookup map para O(1) ao invés de O(n) para cada ciclo
    const historyMap = useMemo(() => {
        const map = new Map<number, CycleSnapshot>();
        history.forEach(h => map.set(h.cycleNumber, h));
        return map;
    }, [history]);

    // Memoizar callback
    const handleClick = useCallback((cycleNum: number, isClickable: boolean) => {
        if (isClickable) onCycleClick(cycleNum);
    }, [onCycleClick]);

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                Linha do Tempo (55 Ciclos)
            </h3>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 overflow-x-auto">
                <div className="min-w-[500px] flex flex-col gap-4">
                    {CYCLE_ROWS.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex items-center justify-between gap-1 relative">
                            {/* Connectors container */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -z-10 mx-4"></div>

                            {row.map((cycleNum) => {
                                const cycleData = historyMap.get(cycleNum);
                                const isCompleted = !!cycleData;
                                const isCurrent = cycleNum === currentCycle;
                                const isClickable = isCompleted || isCurrent;

                                return (
                                    <button
                                        key={cycleNum}
                                        onClick={() => handleClick(cycleNum, isClickable)}
                                        disabled={!isClickable}
                                        className={`
                                            relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                            ${isCompleted
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-110 cursor-pointer border-2 border-indigo-400'
                                                : isCurrent
                                                    ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/30 animate-pulse cursor-pointer border-2 border-amber-300'
                                                    : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-default'
                                            }
                                        `}
                                        title={
                                            isCompleted
                                                ? `Ciclo ${cycleNum}: Concluído`
                                                : isCurrent
                                                    ? `Ciclo ${cycleNum}: Em Andamento`
                                                    : `Ciclo ${cycleNum}: Bloqueado`
                                        }
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 size={16} />
                                        ) : (
                                            cycleNum
                                        )}

                                        {/* Popover com status rápido para completed */}
                                        {cycleData && cycleData.goalAchieved === 'YES' && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 items-center justify-end text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                    <span>Concluído</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    <span>Atual</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-800 rounded-full border border-slate-700"></div>
                    <span>Futuro</span>
                </div>
            </div>
        </div>
    );
});
