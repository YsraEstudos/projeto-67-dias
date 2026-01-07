import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarCheck, GripVertical } from 'lucide-react';
import { useSundayTimerStore, getTimeRemaining } from '../stores/sundayTimerStore';
import { WidgetPosition } from '../types';

interface SundayTimerWidgetProps {
    onClick: () => void;
}

const POSITION_CLASSES: Record<WidgetPosition, string> = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-24 right-6',
    'top-left': 'top-24 left-6'
};

const getClosestCorner = (x: number, y: number): WidgetPosition => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const isRight = x > vw / 2;
    const isBottom = y > vh / 2;

    if (isBottom && isRight) return 'bottom-right';
    if (isBottom && !isRight) return 'bottom-left';
    if (!isBottom && isRight) return 'top-right';
    return 'top-left';
};

const formatTime = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SundayTimerWidget: React.FC<SundayTimerWidgetProps> = React.memo(({ onClick }) => {
    const timer = useSundayTimerStore((state) => state.timer);
    const setPosition = useSundayTimerStore((state) => state.setPosition);

    const [display, setDisplay] = useState('00:00:00');
    const [expanded, setExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [tempPosition, setTempPosition] = useState<{ x: number; y: number } | null>(null);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Update display every second
    useEffect(() => {
        if (timer.status === 'IDLE' || timer.status === 'FINISHED') return;

        const update = () => {
            const remaining = getTimeRemaining(timer);
            setDisplay(formatTime(remaining));
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    // Drag handlers
    const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!widgetRef.current) return;

        const rect = widgetRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setIsDragging(true);
        setDragOffset({
            x: clientX - rect.left,
            y: clientY - rect.top
        });
        setTempPosition({ x: rect.left, y: rect.top });
        e.preventDefault();
    }, []);

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setTempPosition({
            x: clientX - dragOffset.x,
            y: clientY - dragOffset.y
        });
    }, [isDragging, dragOffset]);

    const handleDragEnd = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

        const newPosition = getClosestCorner(clientX, clientY);
        setPosition(newPosition);
        setIsDragging(false);
        setTempPosition(null);
    }, [isDragging, setPosition]);

    // Add/remove global drag listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Don't render if idle or finished
    if (timer.status === 'IDLE' || timer.status === 'FINISHED') return null;

    const isRunning = timer.status === 'RUNNING';
    const positionClass = POSITION_CLASSES[timer.widgetPosition];

    // Style for dragging mode
    const dragStyle = tempPosition ? {
        position: 'fixed' as const,
        left: tempPosition.x,
        top: tempPosition.y,
        right: 'auto',
        bottom: 'auto',
        transition: 'none'
    } : {};

    return (
        <div
            ref={widgetRef}
            className={`fixed z-50 flex flex-col items-end gap-2 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${!tempPosition ? positionClass : ''}`}
            style={dragStyle}
            onMouseEnter={() => !isDragging && setExpanded(true)}
            onMouseLeave={() => !isDragging && setExpanded(false)}
            data-testid="sunday-timer-widget"
        >
            {expanded && !isDragging && (
                <div className="glass-strong p-4 rounded-2xl shadow-2xl animate-scale-in mb-2 w-56">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-pink-400 uppercase tracking-wider">
                            Ajeitar Rápido
                        </span>
                        {isRunning && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                            </span>
                        )}
                    </div>
                    <div className="text-4xl font-mono font-bold text-white text-center my-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                        {display}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="w-full text-xs bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white py-2.5 rounded-xl transition-all font-semibold hover:shadow-lg hover:shadow-pink-500/20"
                    >
                        Ir para Ajeitar Rápido
                    </button>
                </div>
            )}

            {/* Main FAB button */}
            <div className="relative">
                {/* Drag handle */}
                <button
                    className="absolute -left-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-800/90 rounded-lg text-slate-400 hover:text-white cursor-grab active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100 hover:opacity-100 transition-opacity z-10"
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    title="Arrastar para mover"
                >
                    <GripVertical size={14} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className={`
                        relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 group
                        ${isRunning
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-pink-500/30'
                            : 'bg-slate-800 border border-pink-500/30 text-pink-400 hover:border-pink-400'
                        }
                    `}
                >
                    {/* Pulsing ring effect when running */}
                    {isRunning && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-pink-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-md animate-pulse" />
                        </>
                    )}

                    <CalendarCheck size={24} className={`relative z-10 ${isRunning ? 'animate-pulse' : ''}`} />

                    {!expanded && (
                        <span className={`
                            absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950
                            ${isRunning ? 'bg-pink-500 animate-pulse' : 'bg-amber-500'}
                        `} />
                    )}
                </button>
            </div>
        </div>
    );
});

SundayTimerWidget.displayName = 'SundayTimerWidget';
