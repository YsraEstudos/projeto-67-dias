/**
 * ScheduledBlockCard Component
 * 
 * Draggable block that appears in the calendar grid
 * Shows skill/activity/event info with time range
 * 
 * Features:
 * - Drag to move
 * - Resize via bottom handle
 * - Context menu (right-click / long-press)
 * - Notes indicator
 */
import React, { useState, useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, MessageSquare } from 'lucide-react';
import { ScheduledBlock } from '../../../types';

// Pixels per hour for resize calculations
const HOUR_HEIGHT = 80;
const HOUR_HEIGHT_MOBILE = 100;

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
    onResize?: (blockId: string, newDuration: number) => void;
    onContextMenu?: (block: ScheduledBlock, position: { x: number; y: number }) => void;
    isMobile?: boolean;
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

export const ScheduledBlockCard = React.memo<ScheduledBlockCardProps>(({
    block,
    title,
    color,
    style,
    onClick,
    onDelete,
    onResize,
    onContextMenu,
    isMobile = false
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: block.id,
        data: { isBlock: true, blockId: block.id }
    });

    // Resize state
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDelta, setResizeDelta] = useState(0);
    const resizeStartRef = useRef({ y: 0, duration: 0 });

    // Long press state for mobile context menu
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartPos = useRef({ x: 0, y: 0 });

    const hourHeight = isMobile ? HOUR_HEIGHT_MOBILE : HOUR_HEIGHT;

    const colors = COLOR_MAP[color] || COLOR_MAP.emerald;
    const timeRange = formatTimeRange(block.startHour, block.startMinute, block.durationMinutes);
    const duration = formatDuration(block.durationMinutes);

    // Handle resize start
    const handleResizeStart = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        resizeStartRef.current = { y: e.clientY, duration: block.durationMinutes };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [block.durationMinutes]);

    // Handle resize move
    const handleResizeMove = useCallback((e: React.PointerEvent) => {
        if (!isResizing) return;
        const deltaY = e.clientY - resizeStartRef.current.y;
        // Convert pixels to minutes (snap to 15 min intervals)
        const deltaMinutes = Math.round((deltaY / hourHeight) * 60 / 15) * 15;
        setResizeDelta(deltaMinutes);
    }, [isResizing, hourHeight]);

    // Handle resize end
    const handleResizeEnd = useCallback((e: React.PointerEvent) => {
        if (!isResizing) return;
        setIsResizing(false);
        const newDuration = Math.max(15, resizeStartRef.current.duration + resizeDelta);
        setResizeDelta(0);
        if (onResize && newDuration !== block.durationMinutes) {
            onResize(block.id, newDuration);
        }
    }, [isResizing, resizeDelta, onResize, block.id, block.durationMinutes]);

    // Handle context menu (right-click)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(block, { x: e.clientX, y: e.clientY });
    }, [block, onContextMenu]);

    // Long press handlers for mobile
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        longPressTimer.current = setTimeout(() => {
            onContextMenu?.(block, { x: touchStartPos.current.x, y: touchStartPos.current.y });
        }, 600); // 600ms long press
    }, [block, onContextMenu]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        // Cancel long press if finger moves too much
        const dx = e.touches[0].clientX - touchStartPos.current.x;
        const dy = e.touches[0].clientY - touchStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }
    }, []);

    // Calculate visual height including resize delta
    const visualDuration = isResizing ? resizeStartRef.current.duration + resizeDelta : block.durationMinutes;
    const clampedDuration = Math.max(15, visualDuration);

    // Only apply positioning and transform styles
    const combinedStyle: React.CSSProperties = {
        ...style,
        ...(transform && !isResizing ? { transform: CSS.Translate.toString(transform) } : {}),
        touchAction: 'none',
        height: isResizing ? `${(clampedDuration / 60) * hourHeight}px` : style?.height,
    };

    const isCompact = block.durationMinutes <= 30;

    return (
        <div
            ref={setNodeRef}
            style={combinedStyle}
            {...(isResizing ? {} : { ...attributes, ...listeners })}
            className={`
                ${colors.bg} ${colors.border} border rounded-lg 
                cursor-grab active:cursor-grabbing transition-all overflow-hidden z-10
                touch-action-none select-none
                ${!isMobile ? 'hover:shadow-lg hover:scale-[1.02]' : ''}
                ${isDragging ? 'opacity-0 shadow-2xl scale-105 z-50' : ''}
                ${isResizing ? 'ring-2 ring-blue-500 z-50' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onContextMenu={handleContextMenu}
            onTouchStart={onContextMenu ? handleTouchStart : undefined}
            onTouchEnd={onContextMenu ? handleTouchEnd : undefined}
            onTouchMove={onContextMenu ? handleTouchMove : undefined}
        >
            {/* Visual drag indicator */}
            <div
                className={`absolute top-0 left-0 right-0 ${isMobile ? 'h-10' : 'h-6'} flex items-center justify-center bg-black/20 hover:bg-black/30 rounded-t-lg transition-colors pointer-events-none`}
            >
                <GripVertical size={isMobile ? 18 : 14} className="text-slate-300" />
            </div>

            {/* Notes indicator */}
            {block.notes && (
                <div className="absolute top-1 left-1 text-blue-400">
                    <MessageSquare size={isMobile ? 14 : 10} />
                </div>
            )}

            {/* Delete button - larger touch target on mobile */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`absolute top-0 right-0 z-20 ${isMobile ? 'min-w-[44px] min-h-[44px] p-3' : 'p-1'} hover:bg-red-500/30 rounded-tr-lg rounded-bl-lg transition-colors flex items-center justify-center`}
            >
                <X size={isMobile ? 16 : 12} className="text-slate-400 hover:text-red-400" />
            </button>

            {/* Content - adjusted padding for mobile */}
            <div className={`px-3 ${isCompact ? (isMobile ? 'pt-10 pb-1' : 'pt-6 pb-1') : (isMobile ? 'pt-11 pb-2' : 'pt-7 pb-2')}`}>
                <div className={`font-medium ${colors.text} ${isCompact ? 'text-xs' : 'text-sm'} ${isMobile ? 'line-clamp-2' : 'truncate'}`}>
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

            {/* Resize handle - functional drag zone */}
            <div
                className={`absolute bottom-0 left-0 right-0 ${isMobile ? 'h-6' : 'h-3'} cursor-ns-resize bg-gradient-to-t from-black/30 to-transparent hover:from-blue-500/30 transition-colors`}
                onPointerDown={onResize ? handleResizeStart : undefined}
                onPointerMove={isResizing ? handleResizeMove : undefined}
                onPointerUp={isResizing ? handleResizeEnd : undefined}
                onPointerCancel={isResizing ? handleResizeEnd : undefined}
            >
                {/* Visual resize indicator */}
                <div className="flex justify-center items-end h-full pb-0.5">
                    <div className={`w-8 h-1 rounded-full ${isResizing ? 'bg-blue-400' : 'bg-slate-500/50'}`} />
                </div>
            </div>
        </div>
    );
});

ScheduledBlockCard.displayName = 'ScheduledBlockCard';

export default ScheduledBlockCard;
