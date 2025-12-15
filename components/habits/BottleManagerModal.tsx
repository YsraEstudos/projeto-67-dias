import React, { useState } from 'react';
import { useWaterStore, BottleType } from '../../stores';
import { X, Plus, Trash2, Edit2, RotateCcw, Check, GlassWater, AlertCircle } from 'lucide-react';

interface BottleManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Validation limits (must match store)
const MIN_BOTTLE_AMOUNT = 50;
const MAX_BOTTLE_AMOUNT = 5000;
const MAX_BOTTLES = 12;

const EMOJI_OPTIONS = ['🥛', '🧴', '🍶', '🫗', '💧', '🚰', '🧊', '☕', '🍵', '🥤'];
const COLOR_OPTIONS = ['#60a5fa', '#34d399', '#a78bfa', '#22d3ee', '#2dd4bf', '#f472b6', '#fb923c', '#facc15'];

export const BottleManagerModal: React.FC<BottleManagerModalProps> = ({ isOpen, onClose }) => {
    const { bottles, addBottle, updateBottle, removeBottle, resetBottlesToDefault } = useWaterStore();

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New bottle form state
    const [newLabel, setNewLabel] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newIcon, setNewIcon] = useState('💧');
    const [newColor, setNewColor] = useState('#22d3ee');

    // Edit form state
    const [editLabel, setEditLabel] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [editColor, setEditColor] = useState('');

    if (!isOpen) return null;

    const resetForm = () => {
        setNewLabel('');
        setNewAmount('');
        setNewIcon('💧');
        setNewColor('#22d3ee');
        setIsAdding(false);
    };

    const handleAddBottle = () => {
        if (!newLabel.trim() || !newAmount || isNaN(Number(newAmount))) return;

        addBottle({
            label: newLabel.trim(),
            amount: Number(newAmount),
            icon: newIcon,
            color: newColor
        });
        resetForm();
    };

    const startEditing = (bottle: BottleType) => {
        setEditingId(bottle.id);
        setEditLabel(bottle.label);
        setEditAmount(bottle.amount.toString());
        setEditIcon(bottle.icon || '💧');
        setEditColor(bottle.color || '#22d3ee');
    };

    const handleUpdateBottle = () => {
        if (!editingId || !editLabel.trim() || !editAmount || isNaN(Number(editAmount))) return;

        updateBottle(editingId, {
            label: editLabel.trim(),
            amount: Number(editAmount),
            icon: editIcon,
            color: editColor
        });
        setEditingId(null);
    };

    const handleRemoveBottle = (id: string) => {
        if (bottles.length <= 1) return; // Keep at least one bottle
        removeBottle(id);
    };

    const handleReset = () => {
        if (confirm('Restaurar garrafas para o padrão? Isso removerá todas as garrafas customizadas.')) {
            resetBottlesToDefault();
            setEditingId(null);
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-cyan-900/50 to-blue-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <GlassWater className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Gerenciar Garrafas</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {/* Bottle List */}
                    <div className="space-y-2 mb-4">
                        {bottles.map((bottle) => (
                            <div
                                key={bottle.id}
                                className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl group"
                            >
                                {editingId === bottle.id ? (
                                    // Edit Mode
                                    <div className="flex-1 space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editLabel}
                                                onChange={(e) => setEditLabel(e.target.value)}
                                                placeholder="Nome"
                                                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                                            />
                                            <input
                                                type="number"
                                                value={editAmount}
                                                onChange={(e) => setEditAmount(e.target.value)}
                                                placeholder="ml"
                                                className="w-24 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                                            />
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="flex gap-1">
                                                {EMOJI_OPTIONS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => setEditIcon(emoji)}
                                                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${editIcon === emoji
                                                            ? 'bg-cyan-500/30 ring-2 ring-cyan-400'
                                                            : 'hover:bg-slate-700'
                                                            }`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {COLOR_OPTIONS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setEditColor(color)}
                                                    className={`w-6 h-6 rounded-full transition-all ${editColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdateBottle}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors"
                                            >
                                                <Check className="w-4 h-4" /> Salvar
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 text-slate-400 hover:text-white text-sm rounded-lg transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <>
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                            style={{ backgroundColor: `${bottle.color}20` }}
                                        >
                                            {bottle.icon || '💧'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-white">{bottle.label}</div>
                                            <div className="text-sm text-slate-400">{bottle.amount}ml</div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(bottle)}
                                                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveBottle(bottle.id)}
                                                disabled={bottles.length <= 1}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Remover"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add New Bottle Form */}
                    {isAdding ? (
                        <div className="p-4 bg-slate-800/50 border border-dashed border-cyan-500/50 rounded-xl space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    placeholder="Nome da garrafa"
                                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                                />
                                <input
                                    type="number"
                                    value={newAmount}
                                    onChange={(e) => setNewAmount(e.target.value)}
                                    placeholder="ml"
                                    className="w-24 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Ícone</label>
                                <div className="flex gap-1 flex-wrap">
                                    {EMOJI_OPTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => setNewIcon(emoji)}
                                            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${newIcon === emoji
                                                ? 'bg-cyan-500/30 ring-2 ring-cyan-400'
                                                : 'hover:bg-slate-700'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Cor</label>
                                <div className="flex gap-2 flex-wrap">
                                    {COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setNewColor(color)}
                                            className={`w-7 h-7 rounded-full transition-all ${newColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleAddBottle}
                                    disabled={!newLabel.trim() || !newAmount}
                                    className="flex items-center gap-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Adicionar
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full p-3 border border-dashed border-slate-600 hover:border-cyan-500/50 rounded-xl text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Nova Garrafa
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/30">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Restaurar Padrão
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
