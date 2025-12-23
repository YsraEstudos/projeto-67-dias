import React, { useEffect, useRef } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface SectionContextMenuProps {
    position: { x: number; y: number };
    sectionTitle: string;
    isUnlocked: boolean;
    onUnlock: () => void;
    onLock: () => void;
    onClose: () => void;
}

/**
 * Context menu for locking/unlocking roadmap sections.
 * Part of the anti-anxiety feature to hide future tasks.
 */
export const SectionContextMenu: React.FC<SectionContextMenuProps> = ({
    position,
    sectionTitle,
    isUnlocked,
    onUnlock,
    onLock,
    onClose
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position to stay within viewport
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 200),
        y: Math.min(position.y, window.innerHeight - 100)
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-slate-800 border border-slate-600 rounded-xl shadow-2xl py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
            style={{
                left: adjustedPosition.x,
                top: adjustedPosition.y
            }}
        >
            {/* Section Title */}
            <div className="px-3 py-1.5 text-xs text-slate-500 font-medium truncate border-b border-slate-700 mb-1">
                {sectionTitle}
            </div>

            {isUnlocked ? (
                <button
                    onClick={() => {
                        onLock();
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                    <Lock size={16} className="text-amber-400" />
                    <span>Bloquear seção</span>
                </button>
            ) : (
                <button
                    onClick={() => {
                        onUnlock();
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                    <Unlock size={16} className="text-emerald-400" />
                    <span>Liberar seção</span>
                </button>
            )}
        </div>
    );
};
