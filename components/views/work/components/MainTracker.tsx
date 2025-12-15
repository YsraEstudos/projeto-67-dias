import React from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Timer, Trophy } from 'lucide-react';
import { WorkStatus } from '../types';
import { formatTimeDiff } from '../utils';

interface MainTrackerProps {
    currentCount: number;
    goal: number;
    progressPercent: number;
    onUpdate: (newCount: number) => void;
    status: WorkStatus;
    minutesRemaining: number;
    onMetTargetClick: () => void;
}

export const MainTracker: React.FC<MainTrackerProps> = React.memo(({
    currentCount, goal, progressPercent, onUpdate, status, minutesRemaining, onMetTargetClick
}) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Tracker */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-4 sm:p-8 border border-slate-700 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
                <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-8">
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-slate-400 text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 size={16} /> Progresso Real
                        </h2>
                        <button
                            onClick={onMetTargetClick}
                            className="text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded-full font-bold shadow-lg shadow-yellow-900/20 flex items-center gap-1 transition-all hover:scale-105"
                        >
                            <Trophy size={12} /> Metas Extras
                        </button>
                    </div>
                    <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-4xl sm:text-6xl font-bold text-white tracking-tight">{currentCount}</span>
                        <span className="text-lg sm:text-xl text-slate-500">/ {goal}</span>
                    </div>

                    {/* Quick Add Controls */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <button onClick={() => onUpdate(Math.max(0, currentCount - 1))} className="p-3 sm:p-4 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors active:bg-slate-600 touch-manipulation"><ArrowDown size={24} /></button>
                        <input
                            type="number"
                            value={currentCount}
                            onChange={(e) => onUpdate(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 rounded-xl w-20 sm:w-24 text-center text-lg sm:text-xl font-bold focus:border-orange-500 focus:outline-none py-3"
                        />
                        <button onClick={() => onUpdate(currentCount + 1)} className="p-3 sm:p-4 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors active:bg-slate-600 touch-manipulation"><ArrowUp size={24} /></button>
                        <button onClick={() => onUpdate(currentCount + 10)} className="px-4 py-3 rounded-xl bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white transition-all font-bold text-sm active:bg-orange-700 touch-manipulation">+10</button>
                    </div>
                </div>

                {/* Circular Progress Indicator */}
                <div className="relative w-28 h-28 sm:w-40 sm:h-40 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-slate-900 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                        <circle
                            className="text-orange-500 progress-ring__circle stroke-current transition-all duration-1000 ease-out"
                            strokeWidth="8"
                            strokeLinecap="round"
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                        ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-slate-200">{progressPercent}%</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Time Remaining Card */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-slate-400 font-medium flex items-center gap-2 mb-4">
                <Timer size={18} className="text-blue-400" /> Tempo Restante
            </h3>

            {status === 'FINISHED' ? (
                <div className="text-green-400 font-bold text-2xl">Dia Finalizado</div>
            ) : (
                <>
                    <div className="text-5xl font-mono font-bold text-slate-100 tracking-tighter mb-2">
                        {formatTimeDiff(minutesRemaining)}
                    </div>
                    <p className="text-xs text-slate-500 max-w-[200px]">
                        Descontando intervalo de 1 hora se ainda não realizado.
                    </p>
                </>
            )}
        </div>
    </div>
));

MainTracker.displayName = 'MainTracker';
