import React from 'react';

interface ProgressBarProps {
    current: number;
    total: number;
    colorClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = React.memo(({ current, total, colorClass = "bg-indigo-500" }) => {
    const percentage = Math.min(100, Math.round((current / (total || 1)) * 100));
    return (
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
            <div className={`${colorClass} h-full rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>
    );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
