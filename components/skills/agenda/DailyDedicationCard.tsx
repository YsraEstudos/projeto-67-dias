/**
 * DailyDedicationCard Component
 * 
 * Compact card showing daily time dedication summary:
 * - Total hours scheduled
 * - Breakdown by type (skills, activities, events)
 * - Progress bar
 */
import React, { useMemo } from 'react';
import { Clock, BookOpen, Activity, CalendarCheck } from 'lucide-react';
import { ScheduledBlock, Skill, AgendaActivity, CalendarEvent } from '../../../types';
import { formatMinutes } from '../../../utils/weeklyAgendaUtils';

interface DailyDedicationCardProps {
    date: string;
    blocks: ScheduledBlock[];
    skills: Map<string, Skill>;
    activities: Map<string, AgendaActivity>;
    events: Map<string, CalendarEvent>;
    compact?: boolean;
}

interface DedicationBreakdown {
    skills: number;
    activities: number;
    events: number;
    total: number;
}

export const DailyDedicationCard: React.FC<DailyDedicationCardProps> = ({
    date,
    blocks,
    skills,
    activities,
    events,
    compact = true
}) => {
    const breakdown = useMemo((): DedicationBreakdown => {
        let skillMinutes = 0;
        let activityMinutes = 0;
        let eventMinutes = 0;

        for (const block of blocks) {
            const minutes = block.durationMinutes;
            if (block.type === 'skill') skillMinutes += minutes;
            else if (block.type === 'activity') activityMinutes += minutes;
            else if (block.type === 'event') eventMinutes += minutes;
        }

        return {
            skills: skillMinutes,
            activities: activityMinutes,
            events: eventMinutes,
            total: skillMinutes + activityMinutes + eventMinutes
        };
    }, [blocks]);

    if (blocks.length === 0) return null;

    const { skills: skillMin, activities: activityMin, events: eventMin, total } = breakdown;
    const maxMinutes = 12 * 60; // 12 hours max for bar

    // Calculate percentages for stacked bar
    const skillPct = (skillMin / maxMinutes) * 100;
    const activityPct = (activityMin / maxMinutes) * 100;
    const eventPct = (eventMin / maxMinutes) * 100;

    if (compact) {
        return (
            <div className="flex items-center gap-2 px-2 py-1 bg-slate-900/50 rounded-lg border border-slate-700/30 text-xs">
                <Clock size={12} className="text-slate-400" />
                <span className="text-slate-300 font-medium">{formatMinutes(total)}</span>

                {/* Mini stacked bar */}
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    {skillMin > 0 && (
                        <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${skillPct}%` }}
                        />
                    )}
                    {activityMin > 0 && (
                        <div
                            className="h-full bg-blue-500"
                            style={{ width: `${activityPct}%` }}
                        />
                    )}
                    {eventMin > 0 && (
                        <div
                            className="h-full bg-purple-500"
                            style={{ width: `${eventPct}%` }}
                        />
                    )}
                </div>

                {/* Legend dots */}
                <div className="flex gap-1">
                    {skillMin > 0 && <div className="w-2 h-2 rounded-full bg-emerald-500" title="Skills" />}
                    {activityMin > 0 && <div className="w-2 h-2 rounded-full bg-blue-500" title="Atividades" />}
                    {eventMin > 0 && <div className="w-2 h-2 rounded-full bg-purple-500" title="Eventos" />}
                </div>
            </div>
        );
    }

    // Full version
    return (
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Dedicação do Dia</span>
                <span className="text-sm font-bold text-white">{formatMinutes(total)}</span>
            </div>

            {/* Stacked bar */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                {skillMin > 0 && (
                    <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${skillPct}%` }}
                    />
                )}
                {activityMin > 0 && (
                    <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${activityPct}%` }}
                    />
                )}
                {eventMin > 0 && (
                    <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${eventPct}%` }}
                    />
                )}
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                    <BookOpen size={10} className="text-emerald-400" />
                    <span className="text-slate-400">{formatMinutes(skillMin)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Activity size={10} className="text-blue-400" />
                    <span className="text-slate-400">{formatMinutes(activityMin)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarCheck size={10} className="text-purple-400" />
                    <span className="text-slate-400">{formatMinutes(eventMin)}</span>
                </div>
            </div>
        </div>
    );
};

export default DailyDedicationCard;
