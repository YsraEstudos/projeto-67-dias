/**
 * FloatingToolbar - Toolbar contextual que aparece ao selecionar texto
 * 
 * Posiciona-se acima da seleção e oferece ações de formatação rápida.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Bold, Italic, Link2, Code, Heading, List, Quote } from 'lucide-react';

interface FloatingToolbarProps {
    containerRef: React.RefObject<HTMLElement>;
    onFormat: (command: string, value?: string) => void;
}

interface Position {
    top: number;
    left: number;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = React.memo(({
    containerRef,
    onFormat
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

    const updatePosition = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
            setIsVisible(false);
            return;
        }

        // Check if selection is within our container
        const container = containerRef.current;
        if (!container) {
            setIsVisible(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;

        // Verify selection is inside container
        if (!container.contains(commonAncestor)) {
            setIsVisible(false);
            return;
        }

        const rect = range.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Position toolbar above selection, centered
        const toolbarWidth = 280; // Approximate toolbar width
        let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);

        // Keep within container bounds
        left = Math.max(containerRect.left + 8, Math.min(left, containerRect.right - toolbarWidth - 8));

        setPosition({
            top: rect.top - 48, // 48px above selection
            left: left
        });
        setIsVisible(true);
    }, [containerRef]);

    useEffect(() => {
        const handleSelectionChange = () => {
            // Small delay to ensure selection is complete
            requestAnimationFrame(updatePosition);
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [updatePosition]);

    // Hide on scroll
    useEffect(() => {
        const handleScroll = () => setIsVisible(false);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, []);

    const handleFormat = (command: string, value?: string) => {
        onFormat(command, value);
        // Keep selection after formatting
        requestAnimationFrame(updatePosition);
    };

    const handleLinkClick = () => {
        const url = prompt('Digite a URL:', 'https://');
        if (url && url !== 'https://') {
            handleFormat('createLink', url);
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed z-[100] flex items-center gap-0.5 p-1.5 bg-slate-800/95 backdrop-blur-md rounded-xl border border-slate-600/50 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`
            }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
        >
            <ToolbarButton
                icon={<Bold size={15} />}
                title="Negrito"
                onClick={() => handleFormat('bold')}
            />
            <ToolbarButton
                icon={<Italic size={15} />}
                title="Itálico"
                onClick={() => handleFormat('italic')}
            />
            <ToolbarButton
                icon={<Code size={15} />}
                title="Código"
                onClick={() => handleFormat('code')}
            />

            <div className="w-px h-5 bg-slate-600 mx-1" />

            <ToolbarButton
                icon={<Link2 size={15} />}
                title="Link"
                onClick={handleLinkClick}
            />
            <ToolbarButton
                icon={<Heading size={15} />}
                title="Título"
                onClick={() => handleFormat('heading')}
            />
            <ToolbarButton
                icon={<List size={15} />}
                title="Lista"
                onClick={() => handleFormat('list')}
            />
            <ToolbarButton
                icon={<Quote size={15} />}
                title="Citação"
                onClick={() => handleFormat('quote')}
            />
        </div>
    );
});

interface ToolbarButtonProps {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
    active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, title, onClick, active }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-all ${active
                ? 'bg-purple-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
        title={title}
    >
        {icon}
    </button>
);

FloatingToolbar.displayName = 'FloatingToolbar';
