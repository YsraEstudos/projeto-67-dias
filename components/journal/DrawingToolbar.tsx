/**
 * Drawing Toolbar - Floating toolbar with drawing tools
 * 
 * PERFORMANCE OPTIMIZED:
 * - Wrapped with React.memo to prevent unnecessary re-renders
 * - Extracted COLORS constant outside component
 */
import React, { memo } from 'react';
import {
    Pen, Eraser, Undo2, Trash2, Save, X,
    ChevronLeft, ChevronRight, Plus, Minus, PlusCircle
} from 'lucide-react';

// PERF: Moved outside component to avoid recreation
const COLORS = [
    { name: 'Branco', value: '#ffffff' },
    { name: 'Preto', value: '#1e1e2e' },
    { name: 'Vermelho', value: '#ef4444' },
    { name: 'Laranja', value: '#f97316' },
    { name: 'Amarelo', value: '#eab308' },
    { name: 'Verde', value: '#22c55e' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Roxo', value: '#a855f7' },
] as const;

export type DrawingTool = 'pen' | 'eraser';

interface DrawingToolbarProps {
    tool: DrawingTool;
    color: string;
    brushSize: number;
    currentPage: number;
    totalPages: number;
    canUndo: boolean;
    isVisible: boolean;
    onToolChange: (tool: DrawingTool) => void;
    onColorChange: (color: string) => void;
    onBrushSizeChange: (size: number) => void;
    onUndo: () => void;
    onClear: () => void;
    onSave: () => void;
    onClose: () => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddPage: () => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = memo(({
    tool,
    color,
    brushSize,
    currentPage,
    totalPages,
    canUndo,
    isVisible,
    onToolChange,
    onColorChange,
    onBrushSizeChange,
    onUndo,
    onClear,
    onSave,
    onClose,
    onPrevPage,
    onNextPage,
    onAddPage
}) => {
    if (!isVisible) return null;

    // PERF: Inline handlers to avoid object recreations
    const decreaseBrush = () => onBrushSizeChange(Math.max(1, brushSize - 2));
    const increaseBrush = () => onBrushSizeChange(Math.min(40, brushSize + 2));
    const selectPen = () => onToolChange('pen');
    const selectEraser = () => onToolChange('eraser');

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-800/95 backdrop-blur-lg rounded-2xl border border-slate-700 shadow-2xl p-3 flex items-center gap-3">

                {/* Tools */}
                <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1">
                    <button
                        onClick={selectPen}
                        className={`p-2.5 rounded-lg transition-all ${tool === 'pen'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        title="Caneta"
                    >
                        <Pen size={20} />
                    </button>
                    <button
                        onClick={selectEraser}
                        className={`p-2.5 rounded-lg transition-all ${tool === 'eraser'
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        title="Borracha"
                    >
                        <Eraser size={20} />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-700" />

                {/* Colors */}
                <div className="flex items-center gap-1">
                    {COLORS.map(c => (
                        <button
                            key={c.value}
                            onClick={() => onColorChange(c.value)}
                            className={`w-7 h-7 rounded-full transition-all border-2 ${color === c.value
                                ? 'border-purple-400 scale-110 shadow-lg'
                                : 'border-transparent hover:scale-105'
                                }`}
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                        />
                    ))}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-700" />

                {/* Brush Size */}
                <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-1.5">
                    <button
                        onClick={decreaseBrush}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <Minus size={16} />
                    </button>
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                    >
                        <div
                            className="rounded-full bg-slate-900"
                            style={{
                                width: Math.min(brushSize, 20),
                                height: Math.min(brushSize, 20)
                            }}
                        />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-center">{brushSize}</span>
                    <button
                        onClick={increaseBrush}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-700" />

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-2.5 rounded-lg transition-all ${canUndo
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                            : 'text-slate-600 cursor-not-allowed'
                            }`}
                        title="Desfazer"
                    >
                        <Undo2 size={20} />
                    </button>
                    <button
                        onClick={onClear}
                        className="p-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all"
                        title="Limpar"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-700" />

                {/* Pages */}
                <div className="flex items-center gap-1 bg-slate-900 rounded-xl px-2 py-1">
                    <button
                        onClick={onPrevPage}
                        disabled={currentPage <= 1}
                        className={`p-1.5 rounded-lg transition-all ${currentPage > 1
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                            : 'text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-slate-300 font-medium px-2">
                        {currentPage}/{totalPages}
                    </span>
                    <button
                        onClick={onNextPage}
                        disabled={currentPage >= totalPages}
                        className={`p-1.5 rounded-lg transition-all ${currentPage < totalPages
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                            : 'text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={onAddPage}
                        className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 transition-all"
                        title="Nova página"
                    >
                        <PlusCircle size={18} />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-slate-700" />

                {/* Save & Close */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onSave}
                        className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all hover:scale-105"
                        title="Salvar"
                    >
                        <Save size={20} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        title="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
});

DrawingToolbar.displayName = 'DrawingToolbar';

export default DrawingToolbar;
