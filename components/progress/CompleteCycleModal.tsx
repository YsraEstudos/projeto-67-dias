import React, { useState } from 'react';
import { Trophy, AlertTriangle, ArrowRight, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface CompleteCycleModalProps {
    isOpen: boolean;
    onClose: () => void;
    cycleNumber: number;
    cycleGoal: string;
    onConfirm: (goalAchieved: 'YES' | 'PARTIAL' | 'NO') => void;
}

export const CompleteCycleModal: React.FC<CompleteCycleModalProps> = ({
    isOpen,
    onClose,
    cycleNumber,
    cycleGoal,
    onConfirm
}) => {
    const [goalAchieved, setGoalAchieved] = useState<'YES' | 'PARTIAL' | 'NO' | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500"></div>

                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                            <Trophy size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Parabéns!</h2>
                        <p className="text-slate-400 text-lg">
                            Você completou os 67 dias do <span className="text-indigo-400 font-bold">Ciclo {cycleNumber}</span>.
                        </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seu Objetivo neste Ciclo</h3>
                        <p className="text-white italic text-lg leading-relaxed">"{cycleGoal}"</p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-slate-300 mb-4 text-center">Você atingiu seu objetivo?</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => setGoalAchieved('YES')}
                                className={`
                                    p-4 rounded-xl border flex flex-col items-center gap-3 transition-all
                                    ${goalAchieved === 'YES'
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-emerald-500/50'
                                    }
                                `}
                            >
                                <CheckCircle2 size={24} />
                                <span className="font-bold">Sim, atingi!</span>
                            </button>

                            <button
                                onClick={() => setGoalAchieved('PARTIAL')}
                                className={`
                                    p-4 rounded-xl border flex flex-col items-center gap-3 transition-all
                                    ${goalAchieved === 'PARTIAL'
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 ring-1 ring-amber-500'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-amber-500/50'
                                    }
                                `}
                            >
                                <AlertCircle size={24} />
                                <span className="font-bold">Parcialmente</span>
                            </button>

                            <button
                                onClick={() => setGoalAchieved('NO')}
                                className={`
                                    p-4 rounded-xl border flex flex-col items-center gap-3 transition-all
                                    ${goalAchieved === 'NO'
                                        ? 'bg-red-500/20 border-red-500 text-red-400 ring-1 ring-red-500'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-red-500/50'
                                    }
                                `}
                            >
                                <XCircle size={24} />
                                <span className="font-bold">Não consegui</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 mb-8">
                        <AlertTriangle size={20} className="text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                            <strong>O que acontece agora?</strong>
                            <ul className="list-disc pl-4 mt-1 space-y-1 text-blue-200/80">
                                <li>Um snapshot deste ciclo será salvo no seu histórico.</li>
                                <li>Seus dados atuais (hábitos, skills, etc) <strong>NÃO serão apagados</strong>.</li>
                                <li>O contador de "Dia Atual" continuará progressivamente.</li>
                                <li>Você iniciará oficialmente o <strong>Ciclo {cycleNumber + 1}</strong>.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => goalAchieved && onConfirm(goalAchieved)}
                            disabled={!goalAchieved}
                            className={`
                                flex-2 py-3 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg
                                ${goalAchieved
                                    ? 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-600/30'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                }
                            `}
                        >
                            Finalizar Ciclo e Continuar
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
