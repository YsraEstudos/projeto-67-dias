
import React from 'react';
import { formatStopwatch } from './utils/timeUtils';

interface StopwatchDisplayProps {
    displayTime: number;
}

export const StopwatchDisplay: React.FC<StopwatchDisplayProps> = ({ displayTime }) => {
    const { minutes, seconds, centiseconds } = formatStopwatch(displayTime);

    return (
        <div className="font-mono flex items-baseline justify-center gap-1">
            <span className="text-6xl font-bold text-white">{minutes}:{seconds}</span>
            <span className="text-3xl font-medium text-slate-500">.{centiseconds}</span>
        </div>
    );
};
