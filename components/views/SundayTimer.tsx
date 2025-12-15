import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, StopCircle } from 'lucide-react';

const SUNDAY_SESSION_MINUTES = 150; // 2.5 Hours

export const SundayTimer: React.FC = () => {
    const [timerActive, setTimerActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SUNDAY_SESSION_MINUTES * 60);

    useEffect(() => {
        if (!timerActive || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimerActive(false);
                    // TODO: Play sound or notify
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const formatTime = useCallback((seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    const toggleTimer = useCallback(() => setTimerActive(prev => !prev), []);
    const resetTimer = useCallback(() => {
        setTimerActive(false);
        setTimeLeft(SUNDAY_SESSION_MINUTES * 60);
    }, []);

    return (
        <div className="flex flex-col items-center">
            <div className="text-4xl font-mono font-bold text-pink-400 tracking-wider mb-3 bg-slate-900 px-6 py-2 rounded-xl border border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
                {formatTime(timeLeft)}
            </div>
            <div className="flex gap-3">
                <button onClick={toggleTimer} className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${timerActive ? 'bg-slate-700 text-slate-300' : 'bg-pink-600 hover:bg-pink-500 text-white'}`}>
                    {timerActive ? <Pause size={16} /> : <Play size={16} />}
                    {timerActive ? 'Pausar' : 'Iniciar Sessão'}
                </button>
                <button onClick={resetTimer} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-colors" aria-label="Resetar timer">
                    <StopCircle size={18} />
                </button>
            </div>
        </div>
    );
};
