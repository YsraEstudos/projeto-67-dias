import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Styled confirmation modal to replace native window.confirm().
 * Provides consistent UX with the app's design system.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-400',
            iconBg: 'bg-red-500/20',
            button: 'bg-red-500 hover:bg-red-600',
        },
        warning: {
            icon: 'text-amber-400',
            iconBg: 'bg-amber-500/20',
            button: 'bg-amber-500 hover:bg-amber-600',
        },
        info: {
            icon: 'text-cyan-400',
            iconBg: 'bg-cyan-500/20',
            button: 'bg-cyan-500 hover:bg-cyan-600',
        },
    };

    const styles = variantStyles[variant];

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
                    <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center mb-4`}>
                        <AlertTriangle size={24} className={styles.icon} />
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">{message}</p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2.5 ${styles.button} text-white font-medium rounded-xl transition-all`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
