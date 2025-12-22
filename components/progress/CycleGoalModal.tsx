import React, { useState } from 'react';
import { Target, Save, X } from 'lucide-react';
import { DECADE_CONFIG } from '../../services/decadeCycle';

interface CycleGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialGoal: string;
    onSave: (goal: string) => void;
    cycleNumber: number;
}

export const CycleGoalModal: React.FC<CycleGoalModalProps> = ({
    isOpen,
    onClose,
    initialGoal,
    onSave,
    cycleNumber
}) => {
    const [goal, setGoal] = useState(initialGoal);
    const minLength = DECADE_CONFIG.MIN_GOAL_LENGTH || 20;
    const isValid = goal.trim().length >= minLength;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Objetivo do Ciclo {cycleNumber}</h2>
                            <p className="text-xs text-slate-400">Defina sua meta principal para estes 67 dias</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Onde você quer chegar ao final deste ciclo?
                    </label>
                    <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="Ex: Quero finalizar meu portfólio, ler 3 livros técnicos e manter constância na academia..."
                        className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none transition-all"
                    />

                    <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs ${isValid ? 'text-green-500' : 'text-slate-500'}`}>
                            {goal.length} / {minLength} caracteres mínimos
                        </span>
                        {!isValid && goal.length > 0 && (
                            <span className="text-xs text-red-400">
                                Escreva um pouco mais para definir bem seu objetivo.
                            </span>
                        )}
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 mt-4">
                        <p className="text-xs text-amber-400/80">
                            <strong>Dica:</strong> Objetivos claros e específicos aumentam suas chances de sucesso.
                            Este texto será salvo no histórico do ciclo.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            if (isValid) {
                                onSave(goal);
                                onClose();
                            }
                        }}
                        disabled={!isValid}
                        className={`
                            px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all
                            ${isValid
                                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20 hover:scale-105'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                            }
                        `}
                    >
                        <Save size={18} />
                        Salvar Objetivo
                    </button>
                </div>
            </div>
        </div>
    );
};
