/**
 * SidePanel Component
 * 
 * Left sidebar with draggable items (skills, activities, events)
 * that can be dropped onto the calendar grid
 */
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Clock, Target, Calendar, Layers } from 'lucide-react';
import { Skill, AgendaActivity, CalendarEvent } from '../../../types';

// Color mapping
const COLOR_MAP: Record<string, string> = {
    emerald: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    purple: 'bg-purple-500/20 border-purple-500/50 text-purple-400',
    rose: 'bg-rose-500/20 border-rose-500/50 text-rose-400',
    amber: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
    orange: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
    pink: 'bg-pink-500/20 border-pink-500/50 text-pink-400',
    indigo: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400',
    teal: 'bg-teal-500/20 border-teal-500/50 text-teal-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
};

interface SidePanelProps {
    skills: Skill[];
    activities: AgendaActivity[];
    events: CalendarEvent[];
    onAddEvent: () => void;
    onItemTap?: (type: 'skill' | 'activity' | 'event', referenceId: string) => void;
    selectedItemId?: string;
    isCompact?: boolean;
}

// Draggable item component with tap support for mobile
// Uses pointer events to separate drag from click
const DraggableItem = React.memo<{
    id: string;
    type: 'skill' | 'activity' | 'event';
    title: string;
    color: string;
    subtitle?: string;
    icon?: React.ReactNode;
    onTap?: () => void;
    isSelected?: boolean;
}>(({ id, type, title, color, subtitle, icon, onTap, isSelected }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `draggable-${type}-${id}`,
        data: { type, referenceId: id }
    });

    const colorClasses = COLOR_MAP[color] || COLOR_MAP.emerald;

    // Track if drag started to prevent false clicks
    const dragStartedRef = useRef(false);
    const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);

    const style: React.CSSProperties = {
        ...(transform ? { transform: CSS.Translate.toString(transform) } : {}),
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
    };

    // Custom pointer handlers that work WITH dnd-kit listeners
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        dragStartedRef.current = false;
        pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
        // Call dnd-kit's onPointerDown if it exists
        listeners?.onPointerDown?.(e as any);
    }, [listeners]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (pointerStartPosRef.current) {
            const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
            const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
            // If moved more than 5px, consider it a drag
            if (dx > 5 || dy > 5) {
                dragStartedRef.current = true;
            }
        }
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        // Only trigger tap if:
        // 1. We didn't start a drag
        // 2. We're not currently dragging
        // 3. We have a tap handler
        if (!dragStartedRef.current && !isDragging && onTap) {
            e.stopPropagation();
            e.preventDefault();
            onTap();
        }
        pointerStartPosRef.current = null;
        dragStartedRef.current = false;
    }, [isDragging, onTap]);

    // Merge listeners with our custom handlers
    const mergedListeners = {
        ...listeners,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...mergedListeners}
            className={`
                flex items-center gap-3 p-3 min-h-[56px] rounded-lg border cursor-grab active:cursor-grabbing
                ${colorClasses}
                transition-all hover:scale-[1.02] hover:shadow-lg hover:ring-2 hover:ring-white/20
                ${isDragging ? 'drag-ghost' : ''}
                ${isSelected ? 'ring-2 ring-emerald-400 scale-[1.03] animate-pulse' : ''}
                touch-action-none select-none
            `}
        >
            <GripVertical size={16} className="text-slate-400 flex-shrink-0" />
            {icon && <div className="flex-shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{title}</div>
                {subtitle && (
                    <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>
                )}
            </div>
            {isSelected && (
                <div className="flex-shrink-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            )}
        </div>
    );
});

DraggableItem.displayName = 'DraggableItem';

// Section header component
const SectionHeader: React.FC<{
    title: string;
    icon: React.ReactNode;
    count: number;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ title, icon, count, isOpen, onToggle }) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
    >
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-white">{title}</span>
            <span className="text-xs text-slate-500">({count})</span>
        </div>
        <div className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
        </div>
    </button>
);

export const SidePanel: React.FC<SidePanelProps> = ({
    skills,
    activities,
    events,
    onAddEvent,
    onItemTap,
    selectedItemId,
    isCompact = false
}) => {
    const [openSections, setOpenSections] = useState({
        skills: true,
        activities: true,
        events: true
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Filter active skills (not completed)
    const activeSkills = useMemo(() =>
        skills.filter(s => !s.isCompleted),
        [skills]
    );

    // Format duration for display
    const formatGoal = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}min/dia`;
        if (mins === 0) return `${hours}h/dia`;
        return `${hours}h${mins}min/dia`;
    };

    return (
        <div className={`${isCompact
            ? 'w-full bg-transparent p-2'
            : 'w-64 bg-slate-800/50 rounded-xl border border-slate-700 p-3 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-200px)]'
            }`}>
            {!isCompact && (
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Layers size={12} />
                    Arraste para agendar
                </div>
            )}

            {/* Skills Section */}
            <div className="mb-4">
                <SectionHeader
                    title="Skills"
                    icon={<Target size={16} className="text-emerald-400" />}
                    count={activeSkills.length}
                    isOpen={openSections.skills}
                    onToggle={() => toggleSection('skills')}
                />
                {openSections.skills && (
                    <div className="space-y-2 mt-2 pl-2">
                        {activeSkills.length === 0 ? (
                            <div className="text-xs text-slate-500 italic p-2">
                                Nenhuma skill ativa
                            </div>
                        ) : (
                            activeSkills.map(skill => (
                                <DraggableItem
                                    key={skill.id}
                                    id={skill.id}
                                    type="skill"
                                    title={skill.name}
                                    color={skill.colorTheme || 'emerald'}
                                    subtitle={skill.dailyGoalMinutes ? formatGoal(skill.dailyGoalMinutes) : undefined}
                                    icon={<Target size={14} />}
                                    onTap={onItemTap ? () => onItemTap('skill', skill.id) : undefined}
                                    isSelected={selectedItemId === skill.id}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Activities Section */}
            <div className="mb-4">
                <SectionHeader
                    title="Atividades"
                    icon={<Clock size={16} className="text-blue-400" />}
                    count={activities.length}
                    isOpen={openSections.activities}
                    onToggle={() => toggleSection('activities')}
                />
                {openSections.activities && (
                    <div className="space-y-2 mt-2 pl-2">
                        {activities.length === 0 ? (
                            <div className="text-xs text-slate-500 italic p-2">
                                Nenhuma atividade
                            </div>
                        ) : (
                            activities.map(activity => (
                                <DraggableItem
                                    key={activity.id}
                                    id={activity.id}
                                    type="activity"
                                    title={activity.title}
                                    color={activity.color || 'blue'}
                                    subtitle={formatGoal(activity.dailyGoalMinutes)}
                                    icon={<Clock size={14} />}
                                    onTap={onItemTap ? () => onItemTap('activity', activity.id) : undefined}
                                    isSelected={selectedItemId === activity.id}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Events Section */}
            <div className="mb-4">
                <SectionHeader
                    title="Eventos"
                    icon={<Calendar size={16} className="text-purple-400" />}
                    count={events.length}
                    isOpen={openSections.events}
                    onToggle={() => toggleSection('events')}
                />
                {openSections.events && (
                    <div className="space-y-2 mt-2 pl-2">
                        {events.map(event => (
                            <DraggableItem
                                key={event.id}
                                id={event.id}
                                type="event"
                                title={event.title}
                                color={event.color || 'purple'}
                                subtitle={`${Math.floor(event.defaultDurationMinutes / 60)}h padrão`}
                                icon={<Calendar size={14} />}
                                onTap={onItemTap ? () => onItemTap('event', event.id) : undefined}
                                isSelected={selectedItemId === event.id}
                            />
                        ))}

                        {/* Add Event Button */}
                        <button
                            onClick={onAddEvent}
                            className="w-full p-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus size={14} />
                            Novo Evento
                        </button>
                    </div>
                )}
            </div>

            {/* Quick tip */}
            <div className="text-[10px] text-slate-600 text-center mt-4 p-2 bg-slate-900/50 rounded-lg">
                💡 Arraste itens para o calendário para agendar
            </div>
        </div>
    );
};

export default SidePanel;
