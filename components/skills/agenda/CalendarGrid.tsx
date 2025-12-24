/**
 * CalendarGrid Component
 * 
 * Main calendar view component - Google Calendar style grid
 * Shows 7 days (Sun-Sat) x time slots (6h-23h)
 */
import React, { useMemo, useCallback } from 'react';
import { useDroppable, DragEndEvent } from '@dnd-kit/core';
import { ScheduledBlock, Skill, AgendaActivity, CalendarEvent } from '../../../types';
import { ScheduledBlockCard } from './ScheduledBlockCard';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6h to 23h
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOUR_HEIGHT = 60; // pixels per hour

interface CalendarGridProps {
    weekDates: string[];
    scheduledBlocks: ScheduledBlock[];
    skills: Skill[];
    activities: AgendaActivity[];
    events: CalendarEvent[];
    onBlockDrop: (itemType: string, referenceId: string, date: string, startHour: number, startMinute: number) => void;
    onBlockMove: (blockId: string, newDate: string, newStartHour: number, newStartMinute: number) => void;
    onBlockClick: (block: ScheduledBlock) => void;
    onBlockDelete: (blockId: string) => void;
    onEmptySlotClick: (date: string, hour: number) => void;
}

// Droppable time slot cell
const TimeSlotCell = React.memo<{
    date: string;
    hour: number;
    isToday: boolean;
    onClick: () => void;
}>(({ date, hour, isToday, onClick }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `slot-${date}-${hour}`,
        data: { date, hour }
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
                h-[60px] border-b border-r border-slate-700/50 
                hover:bg-slate-700/30 transition-colors cursor-pointer
                ${isOver ? 'bg-emerald-500/20 border-emerald-500/50' : ''}
                ${isToday ? 'bg-blue-900/10' : ''}
            `}
        />
    );
});

TimeSlotCell.displayName = 'TimeSlotCell';

// Hour label on left side
const HourLabel = React.memo<{ hour: number }>(({ hour }) => (
    <div className="w-14 h-[60px] flex items-start justify-end pr-2 pt-1 text-[10px] text-slate-500 font-mono border-b border-slate-700/30">
        {hour.toString().padStart(2, '0')}:00
    </div>
));

HourLabel.displayName = 'HourLabel';

// Day header
const DayHeader = React.memo<{
    dayName: string;
    date: string;
    isToday: boolean;
}>(({ dayName, date, isToday }) => {
    const dayNumber = new Date(date + 'T12:00:00').getDate();

    return (
        <div className={`
            text-center py-2 border-b border-slate-700 sticky top-0 bg-slate-900 z-10
            ${isToday ? 'bg-blue-900/30' : ''}
        `}>
            <div className="text-xs text-slate-500">{dayName}</div>
            <div className={`
                text-lg font-bold 
                ${isToday ? 'text-blue-400' : 'text-white'}
            `}>
                {dayNumber}
            </div>
        </div>
    );
});

DayHeader.displayName = 'DayHeader';

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    weekDates,
    scheduledBlocks,
    skills,
    activities,
    events,
    onBlockDrop,
    onBlockMove,
    onBlockClick,
    onBlockDelete,
    onEmptySlotClick
}) => {
    const today = new Date().toISOString().split('T')[0];

    // Create lookup maps for O(1) access
    const skillsMap = useMemo(() => {
        const map = new Map<string, Skill>();
        skills.forEach(s => map.set(s.id, s));
        return map;
    }, [skills]);

    const activitiesMap = useMemo(() => {
        const map = new Map<string, AgendaActivity>();
        activities.forEach(a => map.set(a.id, a));
        return map;
    }, [activities]);

    const eventsMap = useMemo(() => {
        const map = new Map<string, CalendarEvent>();
        events.forEach(e => map.set(e.id, e));
        return map;
    }, [events]);

    // Group blocks by date for efficient rendering
    const blocksByDate = useMemo(() => {
        const map = new Map<string, ScheduledBlock[]>();
        scheduledBlocks.forEach(block => {
            const existing = map.get(block.date) || [];
            existing.push(block);
            map.set(block.date, existing);
        });
        return map;
    }, [scheduledBlocks]);

    // Get display info for a block
    const getBlockInfo = useCallback((block: ScheduledBlock) => {
        let title = '';
        let color = block.color || 'emerald';

        if (block.type === 'skill') {
            const skill = skillsMap.get(block.referenceId);
            title = skill?.name || 'Skill';
            color = skill?.colorTheme || color;
        } else if (block.type === 'activity') {
            const activity = activitiesMap.get(block.referenceId);
            title = activity?.title || 'Atividade';
            color = activity?.color || color;
        } else if (block.type === 'event') {
            const event = eventsMap.get(block.referenceId);
            title = event?.title || 'Evento';
            color = event?.color || color;
        }

        return { title, color };
    }, [skillsMap, activitiesMap, eventsMap]);

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const overId = over.id as string;
        if (!overId.startsWith('slot-')) return;

        // Parse slot ID: slot-YYYY-MM-DD-HH
        const parts = overId.split('-');
        const hour = parseInt(parts.pop()!);
        const date = parts.slice(1).join('-');

        const activeData = active.data.current;

        if (activeData?.isBlock) {
            // Moving existing block
            onBlockMove(active.id as string, date, hour, 0);
        } else if (activeData?.type && activeData?.referenceId) {
            // Dropping new item from sidebar
            onBlockDrop(activeData.type, activeData.referenceId, date, hour, 0);
        }
    }, [onBlockDrop, onBlockMove]);

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
            {/* Header row with day names */}
            <div className="flex">
                <div className="w-14 bg-slate-900 border-b border-r border-slate-700" />
                {weekDates.map((date, idx) => (
                    <div key={date} className="flex-1 min-w-[100px]">
                        <DayHeader
                            dayName={DAY_NAMES[idx]}
                            date={date}
                            isToday={date === today}
                        />
                    </div>
                ))}
            </div>

            {/* Time grid */}
            <div className="flex overflow-y-auto max-h-[600px]">
                {/* Hour labels column */}
                <div className="w-14 flex-shrink-0 bg-slate-900/50">
                    {HOURS.map(hour => (
                        <HourLabel key={hour} hour={hour} />
                    ))}
                </div>

                {/* Days columns */}
                {weekDates.map((date) => {
                    const dateBlocks = blocksByDate.get(date) || [];
                    const isToday = date === today;

                    return (
                        <div key={date} className="flex-1 min-w-[100px] relative">
                            {/* Time slots */}
                            {HOURS.map(hour => (
                                <TimeSlotCell
                                    key={`${date}-${hour}`}
                                    date={date}
                                    hour={hour}
                                    isToday={isToday}
                                    onClick={() => onEmptySlotClick(date, hour)}
                                />
                            ))}

                            {/* Scheduled blocks (positioned absolutely) */}
                            {dateBlocks.map(block => {
                                const { title, color } = getBlockInfo(block);
                                const topOffset = (block.startHour - 6) * HOUR_HEIGHT + (block.startMinute / 60) * HOUR_HEIGHT;
                                const height = (block.durationMinutes / 60) * HOUR_HEIGHT;

                                return (
                                    <ScheduledBlockCard
                                        key={block.id}
                                        block={block}
                                        title={title}
                                        color={color}
                                        style={{
                                            position: 'absolute',
                                            top: `${topOffset}px`,
                                            left: '2px',
                                            right: '2px',
                                            height: `${Math.max(height - 2, 20)}px`
                                        }}
                                        onClick={() => onBlockClick(block)}
                                        onDelete={() => onBlockDelete(block.id)}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarGrid;
