import React from 'react';
import { Flame } from 'lucide-react';

interface ModuleOffensiveBarProps {
    progress: number;      // 0-100
    isOffensive: boolean;
    label: string;
    accentColor: string;   // Tailwind color (e.g. 'emerald', 'yellow', 'purple')
}

/**
 * Barra compacta de ofensiva para exibição contextual em cada módulo (Skills, Reading, Games)
 */
export const ModuleOffensiveBar: React.FC<ModuleOffensiveBarProps> = ({
    progress,
    isOffensive,
    label,
    accentColor
}) => {
    const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
        emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500/30', text: 'text-emerald-400' },
        yellow: { bg: 'bg-yellow-500', border: 'border-yellow-500/30', text: 'text-yellow-400' },
        purple: { bg: 'bg-purple-500', border: 'border-purple-500/30', text: 'text-purple-400' },
    };

    const colors = colorClasses[accentColor] || colorClasses.emerald;

    return (
        <div className={`
            flex items-center gap-3 p-3 rounded-xl border transition-all
            ${isOffensive
                ? `bg-gradient-to-r from-orange-500/10 to-slate-800/50 border-orange-500/30`
                : `bg-slate-800/50 ${colors.border}`
            }
        `}>
            <Flame
                size={18}
                className={`shrink-0 ${isOffensive ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${isOffensive ? 'text-orange-300' : 'text-slate-400'}`}>
                        {label}
                    </span>
                    <span className={`text-sm font-mono font-bold ${isOffensive ? 'text-orange-400' : colors.text}`}>
                        {progress}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${isOffensive ? 'bg-orange-500' : colors.bg}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            </div>
            {isOffensive && (
                <span className="text-[10px] uppercase tracking-wider text-orange-400 font-bold animate-pulse">
                    🔥
                </span>
            )}
        </div>
    );
};

export default ModuleOffensiveBar;
