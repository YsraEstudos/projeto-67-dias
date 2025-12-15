import React from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { useStreakStore } from '../../stores';

interface StreakBadgeProps {
    size?: 'sm' | 'md' | 'lg';
    showFreeze?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
    size = 'md',
    showFreeze = true
}) => {
    const currentStreak = useStreakStore((s) => s.currentStreak);
    const freezeDaysAvailable = useStreakStore((s) => s.freezeDaysAvailable);
    const isActiveToday = useStreakStore((s) => s.isActiveToday());

    const sizeClasses = {
        sm: 'text-sm px-2 py-1 gap-1',
        md: 'text-base px-3 py-1.5 gap-1.5',
        lg: 'text-lg px-4 py-2 gap-2',
    };

    const iconSizes = { sm: 14, md: 18, lg: 22 };

    return (
        <div className="flex items-center gap-2">
            {/* Main Streak Badge */}
            <div
                className={`
          flex items-center ${sizeClasses[size]}
          bg-gradient-to-r from-orange-500/20 to-red-500/20
          border border-orange-500/30 rounded-xl
          ${isActiveToday ? 'shadow-lg shadow-orange-500/20' : ''}
          transition-all duration-300
        `}
                title={`${currentStreak} dias de ofensiva${isActiveToday ? ' • Ativo hoje!' : ''}`}
            >
                <Flame
                    size={iconSizes[size]}
                    className={`${currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'} ${isActiveToday ? 'animate-pulse' : ''}`}
                />
                <span className={`font-bold ${currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'}`}>
                    {currentStreak}
                </span>
            </div>

            {/* Freeze Days Indicator - only show if some are used */}
            {showFreeze && freezeDaysAvailable < 3 && (
                <div
                    className="flex items-center gap-1 text-xs text-cyan-400 opacity-70"
                    title={`${freezeDaysAvailable} dias de folga restantes`}
                >
                    <Snowflake size={12} />
                    <span>{freezeDaysAvailable}</span>
                </div>
            )}
        </div>
    );
};

export default StreakBadge;
