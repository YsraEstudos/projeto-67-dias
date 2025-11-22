import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { GlobalTimerState } from '../types';
import { useStorage } from '../hooks/useStorage';

interface TimerWidgetProps {
    onClick: () => void;
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ onClick }) => {
    const [timerState, setTimerState] = useStorage<GlobalTimerState>('p67_tool_timer', {
        mode: 'TIMER',
        status: 'IDLE',
        startTime: null,
        endTime: null,
        accumulated: 0,
        totalDuration: 0
    });
    const [display, setDisplay] = useState('');
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const update = () => {
            if (timerState.status === 'IDLE' || timerState.status === 'FINISHED') return;

            const now = Date.now();
            let ms = 0;

            if (timerState.status === 'PAUSED') {
                ms = timerState.accumulated;
            } else if (timerState.status === 'RUNNING') {
                if (timerState.mode === 'TIMER' && timerState.endTime) {
                    ms = Math.max(0, timerState.endTime - now);
                } else if (timerState.mode === 'STOPWATCH' && timerState.startTime) {
                    ms = now - timerState.startTime + timerState.accumulated;
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
    }, [timerState]);

    if (timerState.status === 'IDLE' || timerState.status === 'FINISHED') return null;

    return (
        <div
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            data-testid="timer-widget"
        >
            {expanded && (
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-2 mb-2 w-48">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">{timerState.label || (timerState.mode === 'TIMER' ? 'Temporizador' : 'Cronômetro')}</span>
                        {timerState.status === 'RUNNING' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                    </div>
                    <div className="text-3xl font-mono font-bold text-white text-center my-2">
                        {display}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors"
                    >
                        Abrir Ferramentas
                    </button>
                </div>
            )}

            <button className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border transition-all hover:scale-110 ${timerState.status === 'RUNNING'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/30'
                : 'bg-slate-800 border-slate-600 text-slate-400'
                }`}>
                <Timer size={24} className={timerState.status === 'RUNNING' ? 'animate-pulse' : ''} />
                {!expanded && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950"></span>
                )}
            </button>
        </div>
    );
};
