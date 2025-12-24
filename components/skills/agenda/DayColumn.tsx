import React, { memo } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { getDayName, formatDateDisplay, isToday, isPastDate } from '../../../utils/weeklyAgendaUtils';

interface DayDetail {
    id: string;
    name: string;
    completed: number;
    target: number;
    type: 'skill' | 'activity';
    color: string;
}

interface DayColumnProps {
    date: string;
    dayOfWeek: number;
    percentage: number;
    details: DayDetail[];
    isOverride?: boolean;
    overrideReason?: string;
    onAddTime?: (id: string) => void;
}

export const DayColumn: React.FC<DayColumnProps> = memo(({
    date,
    dayOfWeek,
    percentage,
    details,
    isOverride = false,
    overrideReason,
    onAddTime
}) => {
    const isTodayDate = isToday(date);
    const isPast = isPastDate(date);
    const isComplete = percentage >= 100;

    return (
        <div
            className={`flex flex-col min-w-[180px] max-w-[220px] rounded-xl border transition-all ${isTodayDate
                ? 'bg-slate-800 border-emerald-500/50 ring-2 ring-emerald-500/20'
                : isPast
                    ? 'bg-slate-900/50 border-slate-700/50 opacity-80'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
        >
            {/* Header */}
            <div className="p-3 border-b border-slate-700/50">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <div className={`text-sm font-bold ${isTodayDate ? 'text-emerald-400' : 'text-white'}`}>
                            {getDayName(dayOfWeek)}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDateDisplay(date)}
                        </div>
                    </div>

                    {isTodayDate && (
                        <span className="text-[8px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            Hoje
                        </span>
                    )}

                    {isOverride && (
                        <span className="text-[8px] uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold" title={overrideReason}>
                            Especial
                        </span>
                    )}
                </div>

                {/* Day Progress Bar */}
                <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-500">Progresso do dia</span>
                        <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {percentage}%
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : percentage > 50 ? 'bg-blue-500' : 'bg-slate-500'
                                }`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Activities List */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[400px] scrollbar-thin">
                {details.length > 0 ? (
                    details.map((detail) => (
                        <ActivityCard
                            key={detail.id}
                            id={detail.id}
                            name={detail.name}
                            completedMinutes={detail.completed}
                            targetMinutes={detail.target}
                            color={detail.color}
                            type={detail.type}
                            onAddTime={isTodayDate || !isPast ? onAddTime : undefined}
                            compact
                        />
                    ))
                ) : (
                    <div className="text-center py-6 text-slate-600 text-xs">
                        Nenhuma atividade planejada
                    </div>
                )}
            </div>

            {/* Footer - Completion Status */}
            {isComplete && (
                <div className="p-2 border-t border-slate-700/50 flex items-center justify-center gap-1 text-emerald-400 text-xs font-medium">
                    <CheckCircle2 size={14} />
                    Dia completo!
                </div>
            )}
        </div>
    );
});

DayColumn.displayName = 'DayColumn';

export default DayColumn;
