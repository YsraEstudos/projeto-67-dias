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
import { DailyDedicationCard } from './DailyDedicationCard';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6h to 23h
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOUR_HEIGHT = 80; // pixels per hour - desktop
const HOUR_HEIGHT_MOBILE = 100; // larger touch targets for mobile

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
    onBlockResize?: (blockId: string, newDuration: number) => void;
    onBlockContextMenu?: (block: ScheduledBlock, position: { x: number; y: number }) => void;
    onEmptySlotClick: (date: string, hour: number) => void;
    selectedDayIndex?: number;
    isMobile?: boolean;
    tapToPlaceMode?: boolean;
}

// Droppable time slot cell with enhanced visual feedback
const TimeSlotCell = React.memo<{
    date: string;
    hour: number;
    isToday: boolean;
    onClick: () => void;
    tapToPlaceMode?: boolean;
    isMobile?: boolean;
}>(({ date, hour, isToday, onClick, tapToPlaceMode, isMobile }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `slot-${date}-${hour}`,
        data: { date, hour }
    });

    const slotHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            style={{ height: `${slotHeight}px` }}
            className={`
                border-b border-r border-slate-700/50 relative
                transition-all cursor-pointer
                ${isOver ? 'bg-emerald-500/30 border-emerald-400 border-2 ring-2 ring-emerald-400/50 ring-inset drop-zone-active' : ''}
                ${isToday && !isOver ? 'bg-blue-900/10' : ''}
                ${tapToPlaceMode && !isOver ? 'bg-emerald-500/5 hover:bg-emerald-500/20 border-dashed border-emerald-500/30' : ''}
                ${!tapToPlaceMode && !isOver ? 'hover:bg-slate-700/30' : ''}
            `}
        >
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-150">
                    <span className="text-emerald-400 text-xs font-medium bg-slate-900/90 px-3 py-1.5 rounded-lg shadow-lg">
                        Soltar aqui
                    </span>
                </div>
            )}
            {tapToPlaceMode && !isOver && (
                <div className="absolute inset-0 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                    <span className="text-emerald-400/70 text-[10px] font-medium">
                        Toque
                    </span>
                </div>
            )}
        </div>
    );
});

TimeSlotCell.displayName = 'TimeSlotCell';

// Hour label on left side - height matches slot height
const HourLabel = React.memo<{ hour: number; isMobile?: boolean }>(({ hour, isMobile }) => {
    const slotHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;
    return (
        <div
            style={{ height: `${slotHeight}px` }}
            className="w-14 flex items-start justify-end pr-2 pt-1 text-[11px] text-slate-500 font-mono border-b border-slate-700/30"
        >
            {hour.toString().padStart(2, '0')}:00
        </div>
    );
});

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
    onBlockResize,
    onBlockContextMenu,
    onEmptySlotClick,
    selectedDayIndex,
    isMobile = false,
    tapToPlaceMode = false
}) => {
    const today = new Date().toISOString().split('T')[0];

    // Filter dates for single day view on mobile
    const displayDates = selectedDayIndex !== undefined
        ? [weekDates[selectedDayIndex]]
        : weekDates;

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
                <div className={`${isMobile ? 'w-10' : 'w-14'} bg-slate-900 border-b border-r border-slate-700`} />
                {displayDates.map((date, idx) => {
                    const originalIdx = selectedDayIndex !== undefined ? selectedDayIndex : idx;
                    return (
                        <div key={date} className={`flex-1 ${isMobile ? 'min-w-full' : 'min-w-[100px]'}`}>
                            <DayHeader
                                dayName={DAY_NAMES[originalIdx]}
                                date={date}
                                isToday={date === today}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Time grid */}
            <div className={`flex overflow-y-auto overflow-x-auto ${isMobile ? 'max-h-[65vh]' : 'max-h-[600px]'}`}>
                {/* Hour labels column */}
                <div className={`${isMobile ? 'w-10' : 'w-14'} flex-shrink-0 bg-slate-900/50`}>
                    {HOURS.map(hour => (
                        <HourLabel key={hour} hour={hour} isMobile={isMobile} />
                    ))}
                </div>

                {/* Days columns */}
                {displayDates.map((date) => {
                    const dateBlocks = blocksByDate.get(date) || [];
                    const isToday = date === today;

                    return (
                        <div key={date} className={`flex-1 ${isMobile ? 'min-w-full' : 'min-w-[100px]'} relative`}>
                            {HOURS.map(hour => (
                                <TimeSlotCell
                                    key={`${date}-${hour}`}
                                    date={date}
                                    hour={hour}
                                    isToday={isToday}
                                    onClick={() => onEmptySlotClick(date, hour)}
                                    tapToPlaceMode={tapToPlaceMode}
                                    isMobile={isMobile}
                                />

                            ))}

                            {/* Daily Dedication Summary */}
                            <div className="absolute top-0 left-0 right-0 z-10 px-0.5 pt-0.5 pointer-events-none">
                                <DailyDedicationCard
                                    date={date}
                                    blocks={dateBlocks}
                                    skills={skillsMap}
                                    activities={activitiesMap}
                                    events={eventsMap}
                                    compact={true}
                                />
                            </div>

                            {dateBlocks.map(block => {
                                const { title, color } = getBlockInfo(block);
                                const hourHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;
                                const topOffset = (block.startHour - 6) * hourHeight + (block.startMinute / 60) * hourHeight;
                                const height = (block.durationMinutes / 60) * hourHeight;


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
                                        onResize={onBlockResize}
                                        onContextMenu={onBlockContextMenu}
                                        isMobile={isMobile}
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
