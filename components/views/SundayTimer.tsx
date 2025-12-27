import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, StopCircle, RotateCcw } from 'lucide-react';
import { useSundayTimerStore, getTimeRemaining } from '../../stores/sundayTimerStore';

/**
 * SundayTimer - Timer de sessão para o módulo Ajeitar Rápido.
 * Usa store global com persistência Firestore.
 * Quando ativo, exibe widget flutuante global em qualquer módulo.
 */
export const SundayTimer: React.FC = () => {
    const timer = useSundayTimerStore((state) => state.timer);
    const start = useSundayTimerStore((state) => state.start);
    const pause = useSundayTimerStore((state) => state.pause);
    const resume = useSundayTimerStore((state) => state.resume);
    const reset = useSundayTimerStore((state) => state.reset);

    const [display, setDisplay] = useState('02:30:00');

    // Update display every second when running
    useEffect(() => {
        const update = () => {
            const remaining = getTimeRemaining(timer);
            setDisplay(formatTime(remaining));
        };

        update();

        if (timer.status === 'RUNNING') {
            const interval = setInterval(update, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // Auto-finish when time runs out
    useEffect(() => {
        if (timer.status === 'RUNNING') {
            const remaining = getTimeRemaining(timer);
            if (remaining <= 0) {
                // TODO: Play notification sound
                useSundayTimerStore.getState().stop();
            }
        }
    }, [timer.status, display]);

    const formatTime = useCallback((ms: number): string => {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    const handleToggle = useCallback(() => {
        if (timer.status === 'IDLE' || timer.status === 'FINISHED') {
            start();
        } else if (timer.status === 'RUNNING') {
            pause();
        } else if (timer.status === 'PAUSED') {
            resume();
        }
    }, [timer.status, start, pause, resume]);

    const isActive = timer.status === 'RUNNING' || timer.status === 'PAUSED';
    const isRunning = timer.status === 'RUNNING';

    return (
        <div className="flex flex-col items-center">
            <div className={`text-4xl font-mono font-bold tracking-wider mb-3 px-6 py-2 rounded-xl border shadow-[0_0_15px_rgba(236,72,153,0.15)] transition-all ${isRunning
                ? 'text-pink-400 bg-slate-900 border-pink-500/40 animate-pulse'
                : 'text-pink-400 bg-slate-900 border-pink-500/20'
                }`}>
                {display}
            </div>
            <div className="flex gap-3">
                <button
                    onClick={handleToggle}
                    className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${isRunning
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-pink-600 hover:bg-pink-500 text-white'
                        }`}
                >
                    {isRunning ? <Pause size={16} /> : <Play size={16} />}
                    {isRunning ? 'Pausar' : timer.status === 'PAUSED' ? 'Retomar' : 'Iniciar Sessão'}
                </button>
                {isActive && (
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                        aria-label="Resetar timer"
                        title="Resetar timer"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
            </div>

        </div>
    );
};
