/**
 * ScheduledBlockCard Component
 * 
 * Draggable block that appears in the calendar grid
 * Shows skill/activity/event info with time range
 */
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { ScheduledBlock } from '../../../types';

// Color mapping for Tailwind classes
const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-300' },
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300' },
    rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-300' },
    amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300' },
    cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300' },
    orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-300' },
    pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-300' },
    indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-300' },
    teal: { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-300' },
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300' },
};

interface ScheduledBlockCardProps {
    block: ScheduledBlock;
    title: string;
    color: string;
    style?: React.CSSProperties;
    onClick: () => void;
    onDelete: () => void;
}

// Format time range (e.g., "14:00 - 16:00")
const formatTimeRange = (startHour: number, startMinute: number, durationMinutes: number): string => {
    const startStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

    const endMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMinute = endMinutes % 60;
    const endStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

    return `${startStr} - ${endStr}`;
};

// Format duration (e.g., "2h", "1h30")
const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}`;
};

export const ScheduledBlockCard: React.FC<ScheduledBlockCardProps> = ({
    block,
    title,
    color,
    style,
    onClick,
    onDelete
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        data: { isBlock: true, blockId: block.id }
    });

    const colors = COLOR_MAP[color] || COLOR_MAP.emerald;
    const timeRange = formatTimeRange(block.startHour, block.startMinute, block.durationMinutes);
    const duration = formatDuration(block.durationMinutes);

    const transformStyle = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    const isCompact = block.durationMinutes <= 30;

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...transformStyle }}
            className={`
                ${colors.bg} ${colors.border} border rounded-lg 
                cursor-pointer transition-all overflow-hidden
                hover:shadow-lg hover:scale-[1.02] z-10
                ${isDragging ? 'opacity-50 shadow-2xl scale-105 z-50' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-0 left-0 right-0 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing bg-black/10 rounded-t-lg"
            >
                <GripVertical size={12} className="text-slate-400" />
            </div>

            {/* Delete button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="absolute top-0 right-0 p-1 hover:bg-red-500/30 rounded-tr-lg rounded-bl-lg transition-colors"
            >
                <X size={12} className="text-slate-400 hover:text-red-400" />
            </button>

            {/* Content */}
            <div className={`px-2 ${isCompact ? 'pt-4 pb-1' : 'pt-5 pb-2'}`}>
                <div className={`font-medium ${colors.text} ${isCompact ? 'text-xs' : 'text-sm'} truncate`}>
                    {title}
                </div>

                {!isCompact && (
                    <>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                            {timeRange}
                        </div>
                        <div className="text-[10px] text-slate-500">
                            {duration}
                        </div>
                    </>
                )}
            </div>

            {/* Resize handle */}
            <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-gradient-to-t from-black/20 to-transparent" />
        </div>
    );
};

export default ScheduledBlockCard;
