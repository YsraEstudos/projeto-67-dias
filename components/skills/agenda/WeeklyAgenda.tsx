/**
 * WeeklyAgenda Component
 * 
 * Main agenda view - Google Calendar style with drag-and-drop
 * 
 * Features:
 * - Calendar grid with time slots (6h-23h)
 * - Side panel with draggable skills, activities, and events
 * - Drag-and-drop scheduling
 * - Block editing (time, duration, notes)
 * - Event creation
 */
import React, { useState, useMemo, useCallback } from 'react';
import { DndContext, DragEndEvent, pointerWithin } from '@dnd-kit/core';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, Plus } from 'lucide-react';
import { useSkillsStore } from '../../../stores/skillsStore';
import { useWeeklyAgendaStore } from '../../../stores/weeklyAgendaStore';
import { ScheduledBlock } from '../../../types';
import { CalendarGrid } from './CalendarGrid';
import { SidePanel } from './SidePanel';
import { BlockEditModal } from './BlockEditModal';
import { EventModal } from './EventModal';
import { ActivityModal } from './ActivityModal';
import {
    getWeekDates,
    formatMinutes,
} from '../../../utils/weeklyAgendaUtils';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const WeeklyAgenda: React.FC = () => {
    const { skills } = useSkillsStore();
    const {
        activities,
        events,
        scheduledBlocks,
        scheduleBlock,
        updateBlock,
        deleteBlock,
        moveBlock,
        addEvent,
        updateEvent,
        deleteEvent
    } = useWeeklyAgendaStore();

    // UI State
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState<string | boolean>(false);

    // Calculate week dates with offset  
    const baseDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + weekOffset * 7);
        return date.toISOString().split('T')[0];
    }, [weekOffset]);

    const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

    // Calculate weekly stats
    const weekStats = useMemo(() => {
        const weekBlocksMinutes = scheduledBlocks
            .filter(b => weekDates.includes(b.date))
            .reduce((sum, b) => sum + b.durationMinutes, 0);

        return {
            totalMinutes: weekBlocksMinutes,
            blockCount: scheduledBlocks.filter(b => weekDates.includes(b.date)).length
        };
    }, [scheduledBlocks, weekDates]);

    // Lookup maps for block display
    const skillsMap = useMemo(() => {
        const map = new Map<string, typeof skills[0]>();
        skills.forEach(s => map.set(s.id, s));
        return map;
    }, [skills]);

    const activitiesMap = useMemo(() => {
        const map = new Map<string, typeof activities[0]>();
        activities.forEach(a => map.set(a.id, a));
        return map;
    }, [activities]);

    const eventsMap = useMemo(() => {
        const map = new Map<string, typeof events[0]>();
        events.forEach(e => map.set(e.id, e));
        return map;
    }, [events]);

    // Get display info for selected block
    const getBlockDisplayInfo = useCallback((block: ScheduledBlock) => {
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

    // Handle dropping a new item onto the calendar
    const handleBlockDrop = useCallback((
        itemType: string,
        referenceId: string,
        date: string,
        startHour: number,
        startMinute: number
    ) => {
        // Get default duration based on type
        let defaultDuration = 60; // 1 hour default

        if (itemType === 'skill') {
            const skill = skillsMap.get(referenceId);
            defaultDuration = skill?.dailyGoalMinutes || 60;
        } else if (itemType === 'activity') {
            const activity = activitiesMap.get(referenceId);
            defaultDuration = activity?.dailyGoalMinutes || 60;
        } else if (itemType === 'event') {
            const event = eventsMap.get(referenceId);
            defaultDuration = event?.defaultDurationMinutes || 60;
        }

        scheduleBlock({
            date,
            startHour,
            startMinute,
            durationMinutes: defaultDuration,
            type: itemType as 'skill' | 'activity' | 'event',
            referenceId
        });
    }, [skillsMap, activitiesMap, eventsMap, scheduleBlock]);

    // Handle DnD drag end
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
            moveBlock(active.id as string, date, hour, 0);
        } else if (activeData?.type && activeData?.referenceId) {
            // Dropping new item from sidebar
            handleBlockDrop(activeData.type, activeData.referenceId, date, hour, 0);
        }
    }, [moveBlock, handleBlockDrop]);

    // Handle block click (open edit modal)
    const handleBlockClick = useCallback((block: ScheduledBlock) => {
        setSelectedBlock(block);
    }, []);

    // Handle empty slot click (quick add)
    const handleEmptySlotClick = useCallback((date: string, hour: number) => {
        // Could show a quick-add popover here
        console.log('Empty slot clicked:', date, hour);
    }, []);

    // Format week range for display
    const weekRangeLabel = useMemo(() => {
        const startDate = new Date(weekDates[0] + 'T12:00:00');
        const endDate = new Date(weekDates[6] + 'T12:00:00');

        const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return `${startDate.toLocaleDateString('pt-BR', formatOptions)} - ${endDate.toLocaleDateString('pt-BR', formatOptions)}`;
    }, [weekDates]);

    return (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
            <div className="space-y-4 animate-in fade-in duration-500">
                {/* Header with week navigation */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setWeekOffset(o => o - 1)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="text-center">
                            <div className="text-lg font-bold text-white">
                                {weekOffset === 0 ? 'Esta Semana' :
                                    weekOffset === 1 ? 'Próxima Semana' :
                                        weekOffset === -1 ? 'Semana Passada' :
                                            `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
                            </div>
                            <div className="text-sm text-slate-500">{weekRangeLabel}</div>
                        </div>

                        <button
                            onClick={() => setWeekOffset(o => o + 1)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                            <BarChart3 size={16} className="text-emerald-400" />
                            <span className="font-medium text-white">{formatMinutes(weekStats.totalMinutes)}</span>
                            <span>agendado</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={16} className="text-blue-400" />
                            <span className="font-medium text-white">{weekStats.blockCount}</span>
                            <span>blocos</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center gap-2 mt-4">
                        <button
                            onClick={() => setShowActivityModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} />
                            Nova Atividade
                        </button>
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} />
                            Novo Evento
                        </button>
                    </div>
                </div>

                {/* Main content: SidePanel + CalendarGrid */}
                <div className="flex gap-4">
                    <SidePanel
                        skills={skills}
                        activities={activities}
                        events={events}
                        onAddEvent={() => setShowEventModal(true)}
                    />

                    <div className="flex-1 min-w-0">
                        <CalendarGrid
                            weekDates={weekDates}
                            scheduledBlocks={scheduledBlocks}
                            skills={skills}
                            activities={activities}
                            events={events}
                            onBlockDrop={handleBlockDrop}
                            onBlockMove={(blockId, date, hour, minute) => moveBlock(blockId, date, hour, minute)}
                            onBlockClick={handleBlockClick}
                            onBlockDelete={deleteBlock}
                            onEmptySlotClick={handleEmptySlotClick}
                        />
                    </div>
                </div>

                {/* Empty state */}
                {skills.length === 0 && activities.length === 0 && events.length === 0 && (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                        <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-white font-bold text-lg mb-2">Sua Agenda está vazia</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Crie skills, atividades ou eventos para começar a agendar
                        </p>
                    </div>
                )}

                {/* Modals */}
                {selectedBlock && (
                    <BlockEditModal
                        block={selectedBlock}
                        {...getBlockDisplayInfo(selectedBlock)}
                        onClose={() => setSelectedBlock(null)}
                        onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                        onDelete={() => {
                            deleteBlock(selectedBlock.id);
                            setSelectedBlock(null);
                        }}
                    />
                )}

                {showEventModal && (
                    <EventModal
                        onClose={() => setShowEventModal(false)}
                        onSave={(eventData) => {
                            addEvent(eventData);
                            setShowEventModal(false);
                        }}
                    />
                )}

                {showActivityModal && (
                    <ActivityModal
                        existingActivity={typeof showActivityModal === 'string'
                            ? activities.find(a => a.id === showActivityModal)
                            : undefined
                        }
                        onClose={() => setShowActivityModal(false)}
                    />
                )}
            </div>
        </DndContext>
    );
};

export default WeeklyAgenda;
