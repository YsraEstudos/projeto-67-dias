import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface StorySelectionContextMenuProps {
    x: number;
    y: number;
    text: string;
    onStudyLater: () => void;
    onClose: () => void;
}

export const StorySelectionContextMenu: React.FC<StorySelectionContextMenuProps> = ({
    x,
    y,
    text,
    onStudyLater,
    onClose,
}) => {
    return (
        <div
            className="fixed z-[70] min-w-64 max-w-sm overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl shadow-blue-950/30 backdrop-blur-xl"
            style={{ left: x, top: y }}
        >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Selecao</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-300">{text}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                    aria-label="Fechar menu de seleção"
                >
                    <X size={16} />
                </button>
            </div>

            <button
                type="button"
                onClick={onStudyLater}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-blue-500/10 hover:text-white"
            >
                <BookOpen size={16} className="text-blue-400" />
                Estudar depois em Notas
            </button>
        </div>
    );
};
