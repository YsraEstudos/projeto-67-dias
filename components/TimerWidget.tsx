import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { useTimerStore } from '../stores';

interface TimerWidgetProps {
    onClick: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = React.memo(({ onClick }) => {
    // Use Zustand store instead of useStorage
    const timer = useTimerStore((state) => state.timer);
    const setTimer = useTimerStore((state) => state.setTimer);

    const [display, setDisplay] = useState('');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        // Safe-guard: If loaded state has 0 duration (legacy bug), reset to default 25m
        if (timer.mode === 'TIMER' && timer.status === 'IDLE' && timer.totalDuration === 0) {
            setTimer({ totalDuration: 25 * 60 * 1000, label: 'Pomodoro' });
        }

        const update = () => {
            if (timer.status === 'IDLE' || timer.status === 'FINISHED') return;

            const now = Date.now();
            let ms = 0;

            if (timer.status === 'PAUSED') {
                ms = timer.accumulated;
            } else if (timer.status === 'RUNNING') {
                if (timer.mode === 'TIMER' && timer.endTime) {
                    ms = Math.max(0, timer.endTime - now);
                } else if (timer.mode === 'STOPWATCH' && timer.startTime) {
                    ms = now - timer.startTime + timer.accumulated;
                }
            }

            const totalSec = Math.floor(ms / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            setDisplay(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [timer, setTimer]);

    if (timer.status === 'IDLE' || timer.status === 'FINISHED') return null;

    const isRunning = timer.status === 'RUNNING';

    return (
        <div
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            data-testid="timer-widget"
        >
            {expanded && (
                <div className="glass-strong p-4 rounded-2xl shadow-2xl animate-scale-in mb-2 w-52">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {timer.label || (timer.mode === 'TIMER' ? 'Temporizador' : 'Cronômetro')}
                        </span>
                        {isRunning && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        )}
                    </div>
                    <div className="text-4xl font-mono font-bold text-white text-center my-3 text-gradient-primary">
                        {display}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="w-full text-xs gradient-primary hover:opacity-90 text-white py-2.5 rounded-xl transition-all font-semibold hover:shadow-lg hover:shadow-cyan-500/20"
                    >
                        Abrir Ferramentas
                    </button>
                </div>
            )}

            {/* Main FAB button */}
            <button
                className={`
                    relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110
                    ${isRunning
                        ? 'gradient-primary-animated text-white shadow-cyan-500/30'
                        : 'bg-slate-800 border border-slate-600 text-slate-400 hover:border-slate-500'
                    }
                `}
            >
                {/* Pulsing ring effect when running */}
                {isRunning && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-md animate-pulse" />
                    </>
                )}

                <Timer size={24} className={`relative z-10 ${isRunning ? 'animate-pulse' : ''}`} />

                {!expanded && (
                    <span className={`
                        absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950
                        ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}
                    `} />
                )}
            </button>
        </div>
    );
});

TimerWidget.displayName = 'TimerWidget';
