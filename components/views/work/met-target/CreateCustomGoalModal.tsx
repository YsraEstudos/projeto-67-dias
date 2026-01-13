import React, { useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import type { GoalInputMode } from '../../../../types';

// Simple emoji options
const EMOJI_OPTIONS = ['📚', '✍️', '🎯', '💪', '🧘', '🏃', '🎮', '🎨', '🔬', '💡', '📝', '🧠', '⚡', '🌟', '🎵', '📖'];

// Color options
const COLOR_OPTIONS = [
    { id: 'amber', label: 'Âmbar', class: 'bg-amber-500' },
    { id: 'violet', label: 'Violeta', class: 'bg-violet-500' },
    { id: 'emerald', label: 'Esmeralda', class: 'bg-emerald-500' },
    { id: 'blue', label: 'Azul', class: 'bg-blue-500' },
    { id: 'rose', label: 'Rosa', class: 'bg-rose-500' },
    { id: 'cyan', label: 'Ciano', class: 'bg-cyan-500' },
];

// Input mode options
const INPUT_MODE_OPTIONS: { id: GoalInputMode; label: string; description: string }[] = [
    { id: 'COUNTER', label: 'Contador', description: 'Quantidade (ex: 10 NCMs)' },
    { id: 'BOOLEAN', label: 'Checkbox', description: 'Feito ou não feito' },
    { id: 'TIME', label: 'Tempo', description: 'Minutos dedicados' },
];

interface CreateCustomGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: { label: string; icon: string; color: string; inputMode: GoalInputMode }) => void;
}

/**
 * Modal to create a custom goal with name, icon, color, and input mode.
 */
export const CreateCustomGoalModal: React.FC<CreateCustomGoalModalProps> = React.memo(({
    isOpen,
    onClose,
    onSave,
}) => {
    const [label, setLabel] = useState('');
    const [icon, setIcon] = useState('📚');
    const [color, setColor] = useState('blue');
    const [inputMode, setInputMode] = useState<GoalInputMode>('BOOLEAN');
    const [error, setError] = useState('');

    const resetForm = useCallback(() => {
        setLabel('');
        setIcon('📚');
        setColor('blue');
        setInputMode('BOOLEAN');
        setError('');
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    const handleSave = useCallback(() => {
        // Validate
        if (label.trim().length < 2) {
            setError('Nome deve ter pelo menos 2 caracteres');
            return;
        }

        onSave({ label: label.trim(), icon, color, inputMode });
        resetForm();
        onClose();
    }, [label, icon, color, inputMode, onSave, resetForm, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleClose}
        >
            <div
                className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white">Nova Meta Personalizada</h3>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-5">
                    {/* Name input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Nome da Meta</label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => {
                                setLabel(e.target.value);
                                setError('');
                            }}
                            placeholder="Ex: Estudar React"
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-colors"
                            autoFocus
                        />
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                    </div>

                    {/* Emoji picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Ícone</label>
                        <div className="grid grid-cols-8 gap-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setIcon(emoji)}
                                    className={`p-2 text-2xl rounded-lg transition-all ${icon === emoji
                                            ? 'bg-slate-700 ring-2 ring-emerald-500'
                                            : 'bg-slate-800 hover:bg-slate-700'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Cor</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setColor(opt.id)}
                                    className={`w-10 h-10 rounded-full ${opt.class} transition-all ${color === opt.id
                                            ? 'ring-4 ring-white/30 scale-110'
                                            : 'hover:scale-105'
                                        }`}
                                    title={opt.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Input Mode selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400">Tipo de Entrada</label>
                        <div className="grid grid-cols-3 gap-2">
                            {INPUT_MODE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setInputMode(opt.id)}
                                    className={`p-3 rounded-xl border text-center transition-all ${inputMode === opt.id
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="font-bold text-sm">{opt.label}</div>
                                    <div className="text-xs opacity-70 mt-1">{opt.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Criar Meta
                    </button>
                </div>
            </div>
        </div>
    );
});

CreateCustomGoalModal.displayName = 'CreateCustomGoalModal';

export default CreateCustomGoalModal;
