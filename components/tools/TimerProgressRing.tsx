
import React from 'react';

interface TimerProgressRingProps {
    mode: 'TIMER' | 'STOPWATCH';
    status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';
    displayTime: number;
    totalDuration: number;
}

export const TimerProgressRing: React.FC<TimerProgressRingProps> = ({ mode, status, displayTime, totalDuration }) => {
    if (mode !== 'TIMER') return null;

    return (
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
                cx="50" cy="50" r="44"
                fill="transparent" stroke="#1e293b" strokeWidth="4"
            />
            <circle
                cx="50" cy="50" r="44"
                fill="transparent" stroke={status === 'FINISHED' ? '#ef4444' : '#4f46e5'} strokeWidth="4"
                strokeDasharray="276"
                // Prevent division by zero with (totalDuration || 1)
                strokeDashoffset={276 - (276 * (displayTime / (totalDuration || 1)))}
                strokeLinecap="round"
                className="transition-all duration-500 ease-linear"
            />
        </svg>
    );
};
