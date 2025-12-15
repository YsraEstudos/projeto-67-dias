import React, { useState, useEffect } from 'react';
import { Timer, AlarmClock, Play, Pause, RotateCcw } from 'lucide-react';
import { useTimerStore } from '../../stores';

import { formatTimeDisplay } from './utils/timeUtils';
import { TimerProgressRing } from './TimerProgressRing';
import { StopwatchDisplay } from './StopwatchDisplay';


export const TimerTool: React.FC = () => {
    // Timer Global State (Zustand)
    const timerState = useTimerStore((state) => state.timer);
    const setTimerState = useTimerStore((state) => state.setTimer);

    // Local display state for Timer/Stopwatch (updated via interval)
    const [displayTime, setDisplayTime] = useState(0);

    // --- TIMER LOGIC ---
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const update = () => {
            const now = Date.now();

            if (timerState.status === 'IDLE') {
                if (timerState.mode === 'TIMER') setDisplayTime(timerState.totalDuration);
                else setDisplayTime(0);
                return;
            }

            if (timerState.status === 'PAUSED') {
                if (timerState.mode === 'TIMER') {
                    // On timer, accumulated is how much was remaining
                    setDisplayTime(timerState.accumulated);
                } else {
                    setDisplayTime(timerState.accumulated);
                }
                return;
            }

            if (timerState.status === 'RUNNING') {
                if (timerState.mode === 'TIMER' && timerState.endTime) {
                    const remaining = Math.max(0, timerState.endTime - now);
                    setDisplayTime(remaining);
                    if (remaining === 0) {
                        setTimerState(prev => ({ ...prev, status: 'FINISHED' }));
                        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => { });
                    }
                } else if (timerState.mode === 'STOPWATCH' && timerState.startTime) {
                    const elapsed = now - timerState.startTime + timerState.accumulated;
                    setDisplayTime(elapsed);
                }
            }
        };

        // Safe-guard for 0 duration
        if (timerState.mode === 'TIMER' && timerState.status === 'IDLE' && timerState.totalDuration === 0) {
            setTimerState(prev => ({ ...prev, totalDuration: 25 * 60 * 1000, label: 'Pomodoro' }));
        }

        // Run immediately and then interval
        update();
        interval = setInterval(update, 50);

        return () => clearInterval(interval);
    }, [timerState, setTimerState]);

    const toggleTimer = () => {
        const now = Date.now();

        if (timerState.status === 'IDLE' || timerState.status === 'FINISHED') {
            // START
            if (timerState.mode === 'TIMER') {
                setTimerState(prev => ({
                    ...prev,
                    status: 'RUNNING',
                    endTime: now + prev.totalDuration,
                    accumulated: 0
                }));
            } else {
                setTimerState(prev => ({
                    ...prev,
                    status: 'RUNNING',
                    startTime: now,
                    accumulated: 0
                }));
            }
        } else if (timerState.status === 'RUNNING') {
            // PAUSE
            if (timerState.mode === 'TIMER') {
                const remaining = Math.max(0, (timerState.endTime || now) - now);
                setTimerState(prev => ({
                    ...prev,
                    status: 'PAUSED',
                    accumulated: remaining
                }));
            } else {
                const elapsed = now - (timerState.startTime || now);
                setTimerState(prev => ({
                    ...prev,
                    status: 'PAUSED',
                    accumulated: prev.accumulated + elapsed
                }));
            }
        } else if (timerState.status === 'PAUSED') {
            // RESUME
            if (timerState.mode === 'TIMER') {
                setTimerState(prev => ({
                    ...prev,
                    status: 'RUNNING',
                    endTime: now + prev.accumulated
                }));
            } else {
                setTimerState(prev => ({
                    ...prev,
                    status: 'RUNNING',
                    startTime: now
                }));
            }
        }
    };

    const resetTimer = () => {
        setTimerState(prev => ({
            ...prev,
            status: 'IDLE',
            startTime: null,
            endTime: null,
            accumulated: 0
        }));
    };

    const setPreset = (minutes: number, label: string) => {
        setTimerState({
            mode: 'TIMER',
            status: 'IDLE',
            startTime: null,
            endTime: null,
            accumulated: 0,
            totalDuration: minutes * 60 * 1000,
            label
        });
    };

    const switchMode = (mode: 'STOPWATCH' | 'TIMER') => {
        setTimerState({
            mode,
            status: 'IDLE',
            startTime: null,
            endTime: null,
            accumulated: 0,
            totalDuration: timerState.totalDuration,
            label: mode === 'TIMER' ? 'Temporizador' : 'Cronômetro'
        });
    };

    return (
        <div className="w-full max-w-md mx-auto animate-in zoom-in-95 duration-300">
            {/* Header / Toggle */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex">
                    <button
                        onClick={() => switchMode('TIMER')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${timerState.mode === 'TIMER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Timer size={16} /> Temporizador
                    </button>
                    <button
                        onClick={() => switchMode('STOPWATCH')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${timerState.mode === 'STOPWATCH' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <AlarmClock size={16} /> Cronômetro
                    </button>
                </div>
            </div>

            {/* Main Display */}
            <div className="text-center mb-10">
                <div className="relative w-64 h-64 mx-auto mb-6 flex items-center justify-center bg-slate-900 rounded-full border-8 border-slate-800 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
                    {/* Progress Ring for Timer */}
                    <TimerProgressRing
                        mode={timerState.mode}
                        status={timerState.status}
                        displayTime={displayTime}
                        totalDuration={timerState.totalDuration}
                    />

                    <div className="z-10 flex flex-col items-center">
                        {timerState.mode === 'STOPWATCH' ? (
                            <StopwatchDisplay displayTime={displayTime} />
                        ) : (
                            <>
                                <span className={`text-6xl font-mono font-bold tracking-tighter ${timerState.status === 'FINISHED' ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                    {formatTimeDisplay(displayTime)}
                                </span>
                                <span className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-widest">{timerState.label || 'Timer'}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={toggleTimer}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 ${timerState.status === 'RUNNING'
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                    >
                        {timerState.status === 'RUNNING' ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition-all hover:rotate-180 duration-500"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Presets (Timer Only) */}
            {timerState.mode === 'TIMER' && (
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setPreset(25, 'Pomodoro')} className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500/50 hover:bg-slate-800 transition-colors group">
                        <span className="text-2xl font-bold text-slate-300 group-hover:text-red-400">25</span>
                        <span className="text-[10px] uppercase text-slate-500">Pomodoro</span>
                    </button>
                    <button onClick={() => setPreset(5, 'Pausa Curta')} className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-colors group">
                        <span className="text-2xl font-bold text-slate-300 group-hover:text-blue-400">05</span>
                        <span className="text-[10px] uppercase text-slate-500">Pausa</span>
                    </button>
                    <button onClick={() => setPreset(15, 'Pausa Longa')} className="flex flex-col items-center p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-colors group">
                        <span className="text-2xl font-bold text-slate-300 group-hover:text-emerald-400">15</span>
                        <span className="text-[10px] uppercase text-slate-500">Descanso</span>
                    </button>
                </div>
            )}
        </div>
    );
}
