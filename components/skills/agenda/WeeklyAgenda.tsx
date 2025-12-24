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
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    pointerWithin,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { Calendar, ChevronLeft, ChevronRight, BarChart3, Plus, Layers, X } from 'lucide-react';
import { useSkillsStore } from '../../../stores/skillsStore';
import { useWeeklyAgendaStore } from '../../../stores/weeklyAgendaStore';
import { ScheduledBlock } from '../../../types';
import { CalendarGrid } from './CalendarGrid';
import { SidePanel } from './SidePanel';
import { BlockEditModal } from './BlockEditModal';
import { EventModal } from './EventModal';
import { ActivityModal } from './ActivityModal';
import { ScheduledBlockCard } from './ScheduledBlockCard';
import { GripVertical, Clock, Target } from 'lucide-react';
import {
    getWeekDates,
    formatMinutes,
} from '../../../utils/weeklyAgendaUtils';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Hook to detect mobile viewport
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

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

    // Mobile-specific state
    const isMobile = useIsMobile();
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [selectedDayIndex, setSelectedDayIndex] = useState(() => new Date().getDay());

    // DnD Active Item State
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeData, setActiveData] = useState<any>(null);

    // Setup Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid dragging on accidental clicks
            },
        })
    );

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

    // Handle DnD drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveData(active.data.current);
    }, []);

    // Handle DnD drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        setActiveData(null);

        const { active, over } = event;
        if (!over) return;

        const overId = over.id as string;
        if (!overId.startsWith('slot-')) return;

        // Parse slot ID: slot-YYYY-MM-DD-HH
        const parts = overId.split('-');
        const hourOrPart = parts.pop()!;
        const hour = parseInt(hourOrPart);
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
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={pointerWithin}
        >
            <div className="space-y-4 animate-in fade-in duration-500">
                {/* Header with week navigation */}
                <div className="bg-slate-800/50 rounded-xl p-3 md:p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                        <button
                            onClick={() => setWeekOffset(o => o - 1)}
                            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="text-center flex-1">
                            <div className="text-base md:text-lg font-bold text-white">
                                {weekOffset === 0 ? 'Esta Semana' :
                                    weekOffset === 1 ? 'Próxima Semana' :
                                        weekOffset === -1 ? 'Semana Passada' :
                                            `Semana ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
                            </div>
                            <div className="text-xs md:text-sm text-slate-500">{weekRangeLabel}</div>
                        </div>

                        <button
                            onClick={() => setWeekOffset(o => o + 1)}
                            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Mobile: View mode toggle and day selector */}
                    {isMobile && (
                        <div className="mb-3 space-y-3">
                            {/* View toggle */}
                            <div className="flex rounded-lg bg-slate-900/50 p-1">
                                <button
                                    onClick={() => setViewMode('week')}
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${viewMode === 'week'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    Semana
                                </button>
                                <button
                                    onClick={() => setViewMode('day')}
                                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${viewMode === 'day'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    Dia
                                </button>
                            </div>

                            {/* Day selector (only in day view) */}
                            {viewMode === 'day' && (
                                <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                                    {weekDates.map((date, idx) => {
                                        const dayDate = new Date(date + 'T12:00:00');
                                        const isToday = date === new Date().toISOString().split('T')[0];
                                        const isSelected = idx === selectedDayIndex;

                                        return (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedDayIndex(idx)}
                                                className={`flex-1 min-w-[44px] py-2 px-1 rounded-lg text-center transition-colors ${isSelected
                                                    ? 'bg-emerald-600 text-white'
                                                    : isToday
                                                        ? 'bg-blue-600/30 text-blue-400'
                                                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <div className="text-[10px] uppercase">{DAY_NAMES_SHORT[idx]}</div>
                                                <div className="text-sm font-bold">{dayDate.getDate()}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quick stats */}
                    <div className="flex items-center justify-center gap-4 md:gap-6 text-xs md:text-sm">
                        <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                            <BarChart3 size={14} className="text-emerald-400" />
                            <span className="font-medium text-white">{formatMinutes(weekStats.totalMinutes)}</span>
                            <span className="hidden sm:inline">agendado</span>
                        </div>
                        <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
                            <Calendar size={14} className="text-blue-400" />
                            <span className="font-medium text-white">{weekStats.blockCount}</span>
                            <span className="hidden sm:inline">blocos</span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center gap-2 mt-3 md:mt-4">
                        <button
                            onClick={() => setShowActivityModal(true)}
                            className="px-3 md:px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Nova </span>Atividade
                        </button>
                        <button
                            onClick={() => setShowEventModal(true)}
                            className="px-3 md:px-4 py-2 min-h-[44px] bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={16} />
                            <span className="hidden sm:inline">Novo </span>Evento
                        </button>
                    </div>
                </div>

                {/* Main content: SidePanel + CalendarGrid */}
                <div className="flex flex-col md:flex-row gap-4 relative">
                    {/* Desktop: SidePanel inline */}
                    <div className="hidden md:block">
                        <SidePanel
                            skills={skills}
                            activities={activities}
                            events={events}
                            onAddEvent={() => setShowEventModal(true)}
                        />
                    </div>

                    {/* Mobile: SidePanel as overlay/bottom sheet */}
                    {isMobile && showSidePanel && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
                                onClick={() => setShowSidePanel(false)}
                            />
                            {/* Bottom Sheet */}
                            <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
                                <div className="bg-slate-800 rounded-t-2xl border-t border-slate-700 max-h-[70vh] overflow-hidden">
                                    {/* Handle bar */}
                                    <div className="flex justify-center py-2">
                                        <div className="w-10 h-1 bg-slate-600 rounded-full" />
                                    </div>
                                    {/* Header with close button */}
                                    <div className="flex items-center justify-between px-4 pb-2">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Layers size={16} />
                                            <span className="text-sm font-medium">Arraste para agendar</span>
                                        </div>
                                        <button
                                            onClick={() => setShowSidePanel(false)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    {/* SidePanel content */}
                                    <div className="overflow-y-auto max-h-[calc(70vh-60px)] px-2 pb-4">
                                        <SidePanel
                                            skills={skills}
                                            activities={activities}
                                            events={events}
                                            onAddEvent={() => {
                                                setShowSidePanel(false);
                                                setShowEventModal(true);
                                            }}
                                            isCompact
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Calendar Grid */}
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
                            selectedDayIndex={isMobile && viewMode === 'day' ? selectedDayIndex : undefined}
                            isMobile={isMobile}
                        />
                    </div>

                    {/* Mobile FAB to open SidePanel */}
                    {isMobile && !showSidePanel && (
                        <button
                            onClick={() => setShowSidePanel(true)}
                            className="fixed bottom-4 right-4 z-30 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-lg flex items-center justify-center text-white transition-all active:scale-95"
                        >
                            <Layers size={24} />
                        </button>
                    )}
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

                {/* Drag Overlay for smooth preview */}
                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.5',
                            },
                        },
                    }),
                }}>
                    {activeId && activeData ? (
                        activeData.isBlock ? (
                            <div className="w-full h-full opacity-80 scale-105 pointer-events-none">
                                <ScheduledBlockCard
                                    block={scheduledBlocks.find(b => b.id === activeId)!}
                                    {...getBlockDisplayInfo(scheduledBlocks.find(b => b.id === activeId)!)}
                                    // Use minimal props for overlay
                                    onClick={() => { }}
                                    onDelete={() => { }}
                                />
                            </div>
                        ) : (
                            <div className={`
                                flex items-center gap-2 p-3 rounded-lg border bg-slate-800 border-slate-600 
                                text-white shadow-2xl scale-110 opacity-90 pointer-events-none w-64
                            `}>
                                <GripVertical size={14} className="text-slate-500" />
                                {activeData.type === 'skill' && <Target size={16} className="text-emerald-400" />}
                                {activeData.type === 'activity' && <Clock size={16} className="text-blue-400" />}
                                <div className="text-sm font-medium truncate">
                                    {activeData.type === 'skill' ? skillsMap.get(activeData.referenceId)?.name :
                                        activeData.type === 'activity' ? activitiesMap.get(activeData.referenceId)?.title :
                                            eventsMap.get(activeData.referenceId)?.title || 'Novo Item'}
                                </div>
                            </div>
                        )
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default WeeklyAgenda;
