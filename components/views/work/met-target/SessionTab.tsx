import React from 'react';
import { Play, Pause, RotateCcw, ArrowDown, ArrowUp, Save } from 'lucide-react';
import { formatDuration } from '../utils';

interface WorkGoals {
    weekly: number;
    ultra: number;
    anki: number;
    ncm: number;
}

// Timer presets in minutes
const TIMER_PRESETS = [5, 10, 15, 25, 30];

interface SessionTabProps {
    timeRemaining: number; // Seconds remaining in countdown
    isRunning: boolean;
    setIsRunning: (v: boolean) => void;
    timerFinished: boolean;
    initialTimerMinutes: number;
    onSetPreset: (minutes: number) => void;
    onResetTimer: () => void;
    ankiCount: number;
    setAnkiCount: (v: number) => void;
    ncmCount: number;
    setNcmCount: (v: number) => void;
    tomorrowReady: boolean;
    setTomorrowReady: (v: boolean) => void;
    goals: WorkGoals;
    isInputLocked: boolean;
    onSave: () => void;
    children?: React.ReactNode; // For StudyScheduler
}

export const SessionTab: React.FC<SessionTabProps> = React.memo(({
    timeRemaining, isRunning, setIsRunning, timerFinished,
    initialTimerMinutes, onSetPreset, onResetTimer,
    ankiCount, setAnkiCount, ncmCount, setNcmCount,
    tomorrowReady, setTomorrowReady,
    goals, isInputLocked, onSave, children
}) => {
    return (
        <div className="space-y-8">
            {/* Countdown Timer */}
            <div className={`flex flex-col items-center justify-center py-6 rounded-2xl border transition-all ${timerFinished
                ? 'bg-red-950/50 border-red-500/50 animate-pulse'
                : 'bg-slate-950 border-slate-800'
                }`}>
                {/* Timer Presets */}
                <div className="flex gap-2 mb-4">
                    {TIMER_PRESETS.map(minutes => (
                        <button
                            key={minutes}
                            onClick={() => onSetPreset(minutes)}
                            disabled={isRunning}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${initialTimerMinutes === minutes && !timerFinished
                                ? 'bg-yellow-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {minutes}m
                        </button>
                    ))}
                </div>

                {/* Timer Display */}
                <div className={`text-6xl font-mono font-bold mb-4 tracking-wider ${timerFinished ? 'text-red-400' : 'text-slate-200'
                    }`}>
                    {formatDuration(timeRemaining)}
                </div>

                {/* Timer Controls */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        disabled={timerFinished}
                        className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${timerFinished
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            : isRunning
                                ? 'bg-slate-800 text-red-400 hover:bg-slate-700'
                                : 'bg-yellow-600 text-white hover:bg-yellow-500'
                            }`}
                    >
                        {isRunning ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Iniciar</>}
                    </button>
                    <button
                        onClick={onResetTimer}
                        className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Resetar timer"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                {/* Finished Message */}
                {timerFinished && (
                    <p className="mt-4 text-red-400 font-bold text-sm animate-bounce">
                        ⏰ Tempo esgotado! Clique em resetar para continuar.
                    </p>
                )}
            </div>

            {/* Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Anki */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3">Anki (Meta: {goals.anki})</h4>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setAnkiCount(Math.max(0, ankiCount - 1))}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowDown size={20} />
                        </button>
                        <span className={`text-4xl font-bold ${ankiCount >= goals.anki ? 'text-green-400' : 'text-white'}`}>{ankiCount}</span>
                        <button
                            onClick={() => setAnkiCount(ankiCount + 1)}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowUp size={20} />
                        </button>
                    </div>
                </div>

                {/* NCM */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3">NCM (Meta: {goals.ncm})</h4>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setNcmCount(Math.max(0, ncmCount - 1))}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowDown size={20} />
                        </button>
                        <span className={`text-4xl font-bold ${ncmCount >= goals.ncm ? 'text-green-400' : 'text-white'}`}>{ncmCount}</span>
                        <button
                            onClick={() => setNcmCount(ncmCount + 1)}
                            disabled={isInputLocked}
                            className={`p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ArrowUp size={20} />
                        </button>
                    </div>
                </div>

                {/* Arrumar o de Amanhã */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col items-center">
                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3 whitespace-nowrap">
                        Arrumar o de Amanhã
                    </h4>
                    <button
                        onClick={() => setTomorrowReady(!tomorrowReady)}
                        disabled={isInputLocked}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${tomorrowReady
                                ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                                : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-600'
                            } ${isInputLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {tomorrowReady ? (
                            <>✅ Preparado!</>
                        ) : (
                            <>📦 Confirmar</>
                        )}
                    </button>
                    <p className="text-slate-500 text-xs mt-2 text-center">
                        +5 pts ao confirmar
                    </p>
                </div>
            </div>

            {isInputLocked && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center animate-pulse">
                    <p className="text-sm text-amber-400 font-bold">🏆 Ultra metas diárias atingidas!</p>
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={onSave}
                disabled={isInputLocked}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${isInputLocked
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20 hover:scale-[1.02]'
                    }`}
            >
                <Save size={20} />
                {isInputLocked ? 'Ultra Meta Completa 🏆' : 'Salvar Sessão Extra'}
            </button>

            {/* Scheduler inserted here */}
            {children}
        </div>
    );
});

SessionTab.displayName = 'SessionTab';
