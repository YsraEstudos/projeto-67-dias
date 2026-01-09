/**
 * Entry Type Selector - Modal to choose between text and drawing entry
 * PERFORMANCE: Wrapped with React.memo
 */
import React, { memo } from 'react';
import { PenLine, FileText, X } from 'lucide-react';

interface EntryTypeSelectorProps {
    onSelectText: () => void;
    onSelectDrawing: () => void;
    onClose: () => void;
}

const EntryTypeSelector: React.FC<EntryTypeSelectorProps> = memo(({
    onSelectText,
    onSelectDrawing,
    onClose
}) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-3xl border border-slate-700 p-8 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Nova Entrada</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Text Entry */}
                    <button
                        onClick={onSelectText}
                        className="group flex flex-col items-center gap-4 p-6 bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-purple-500/50 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10"
                    >
                        <div className="p-4 bg-purple-500/20 rounded-2xl group-hover:bg-purple-500/30 transition-colors">
                            <FileText size={32} className="text-purple-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-white mb-1">Texto</h3>
                            <p className="text-xs text-slate-400">Escreva usando teclado</p>
                        </div>
                    </button>

                    {/* Drawing Entry */}
                    <button
                        onClick={onSelectDrawing}
                        className="group flex flex-col items-center gap-4 p-6 bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                        <div className="p-4 bg-emerald-500/20 rounded-2xl group-hover:bg-emerald-500/30 transition-colors">
                            <PenLine size={32} className="text-emerald-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-white mb-1">Desenho</h3>
                            <p className="text-xs text-slate-400">Use caneta ou toque</p>
                        </div>
                    </button>
                </div>

                {/* Hint */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    Suporte a S Pen, mesa digitalizadora e toque
                </p>
            </div>
        </div>
    );
});

EntryTypeSelector.displayName = 'EntryTypeSelector';

export default EntryTypeSelector;
