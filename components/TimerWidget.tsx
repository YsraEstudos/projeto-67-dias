import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { useTimerStore } from '../stores';
import { DEFAULT_POMODORO_SECONDS, getTimerDisplayMs } from '../stores/timerStore';

const pad2 = (n: number) => n.toString().padStart(2, '0');

// Mesmo alarme do TimerTool; o widget só aparece quando a ferramenta está fechada.
const FINISH_BEEP_URL = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';
const playFinishBeep = () => {
    try {
        const playback = new Audio(FINISH_BEEP_URL).play();
        playback?.catch?.(() => { });
    } catch {
        // Autoplay bloqueado ou ambiente sem áudio: o fim do timer segue valendo.
    }
};

const formatWidgetTime = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
};

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
            setTimer({ totalDuration: DEFAULT_POMODORO_SECONDS, label: 'Pomodoro' });
        }

        if (timer.status === 'IDLE' || timer.status === 'FINISHED') return;

        const update = () => {
            const ms = getTimerDisplayMs(timer);
            setDisplay(formatWidgetTime(ms));

            // Contagem regressiva zerada: encerra o timer mesmo com o TimerTool
            // fechado, senão o widget ficava preso em "00:00" indefinidamente.
            if (timer.mode === 'TIMER' && timer.status === 'RUNNING' && ms === 0) {
                let didFinish = false;
                setTimer((prev) => {
                    if (prev.status !== 'RUNNING' || prev.mode !== 'TIMER' || getTimerDisplayMs(prev) !== 0) return prev;
                    didFinish = true;
                    return { ...prev, status: 'FINISHED', accumulated: 0 };
                });
                if (didFinish) playFinishBeep();
            }
        };

        update();
        // Pausado não muda: dispensa o intervalo de 1s.
        if (timer.status !== 'RUNNING') return;
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
                type="button"
                aria-label={`${timer.label || (timer.mode === 'TIMER' ? 'Temporizador' : 'Cronômetro')}: ${isRunning ? 'em andamento' : 'pausado'}${display ? ` (${display})` : ''}`}
                aria-expanded={expanded}
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
                        <span className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
                        <span data-testid="pomodoro-pulse-ring" className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-md animate-pulse pointer-events-none" />
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
