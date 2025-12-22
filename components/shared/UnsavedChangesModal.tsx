import React from 'react';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

/**
 * Modal to confirm unsaved changes when user tries to close an editor.
 * Provides three options: Save, Discard, or Cancel.
 */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    isOpen,
    onSave,
    onDiscard,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
                    aria-label="Fechar"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                        <AlertTriangle size={24} className="text-amber-400" />
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-bold text-white mb-2">Alterações não salvas</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        Você tem alterações que não foram salvas. O que deseja fazer?
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onSave}
                            className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            Salvar alterações
                        </button>
                        <button
                            onClick={onDiscard}
                            className="w-full px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium rounded-xl border border-red-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} />
                            Descartar alterações
                        </button>
                        <button
                            onClick={onCancel}
                            className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnsavedChangesModal;
