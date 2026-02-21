import React, { useState } from 'react';
import {
    X, RotateCcw, CheckSquare, Square, BookOpen, Calendar,
    Activity, Link, PenTool, AlertTriangle, Trophy, ArrowRight
} from 'lucide-react';

import { useConfigStore } from '../../stores/configStore';
import { useHabitsStore } from '../../stores/habitsStore';
import { useSkillsStore } from '../../stores/skillsStore';
import { useReadingStore } from '../../stores/readingStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useGamesStore } from '../../stores/gamesStore';
import { useDecadeStore } from '../../stores/decadeStore';
import { calculateCurrentDay } from '../../services/weeklySnapshot';

interface ResetProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ResetProjectModal: React.FC<ResetProjectModalProps> = ({ isOpen, onClose }) => {
    // Stores
    const { config, setConfig, resetConfig } = useConfigStore();
    const { _reset: resetHabits } = useHabitsStore();
    const { _reset: resetSkills } = useSkillsStore();
    const { _reset: resetReading } = useReadingStore();
    const { _reset: resetReview } = useReviewStore();
    const { _reset: resetGames } = useGamesStore();
    const { decadeData, completeCycle } = useDecadeStore();
    const { reviewData } = useReviewStore();

    // Local State
    const [confirmation, setConfirmation] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [options, setOptions] = useState({
        keepBooks: true,
        keepSkills: true,
        keepLinks: true,
        keepJournal: true,
        keepHabits: true,
        keepPlanning: true
    });

    // Check Eligibility for Cycle Completion
    const currentDay = calculateCurrentDay(config.startDate);
    const canCompleteCycle = currentDay >= 67 && !!decadeData.pendingCycleGoal;



    if (!isOpen) return null;

    const toggle = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCompleteCycle = () => {
        // Redirecionar para a tab 10 Anos para finalizar lá
        // (Ou poderíamos abrir o modal de complete aqui, mas redirecionar é mais simples e educa o usuário)
        onClose();
        // Pequeno hack para forçar mudança de tab se já estiver no ProgressView, 
        // mas idealmente o usuário deveria navegar.
        // Como não temos acesso fácil ao setActiveTab do pai, vamos apenas fechar e talvez notificar.
        // Melhor: apenas fechar. O usuário verá a opção na view.
        alert("Vá para a aba '10 Anos' no menu de Progresso para finalizar o ciclo!");
    };

    const handleReset = async () => {
        if (confirmation !== 'REINICIAR') return;

        setIsResetting(true);
        setTimeout(() => {
            // 1. Resetar Config (Data de Início)
            if (config.userName) {
                // Mantém nome se existir, mas reseta data
                setConfig({
                    ...config,
                    startDate: new Date().toISOString(),
                    isProjectStarted: false,
                    restartCount: (config.restartCount || 0) + 1
                });
            } else {
                resetConfig();
            }

            // 2. Resetar Stores baseado nas opções
            if (!options.keepHabits) resetHabits();
            if (!options.keepSkills) resetSkills();
            if (!options.keepBooks) resetReading();
            if (!options.keepJournal) resetReview();
            // Games geralmente reseta junto
            resetGames();

            // 3. Fechar modal sem recarregar a página.
            // Recarregar imediatamente podia interromper o flush do sync remoto,
            // fazendo o estado voltar para "projeto iniciado" em alguns casos.
            setIsResetting(false);
            setConfirmation('');
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-orange-900/20 to-slate-900 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <RotateCcw className="text-orange-500" /> Gerenciar Reinício
                    </h3>
                    <button onClick={onClose} aria-label="Fechar modal">
                        <X className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* OPTION A: COMPLETE CYCLE (Prominent if available) */}
                    {canCompleteCycle && (
                        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>

                            <div className="relative z-10">
                                <h4 className="flex items-center gap-2 text-indigo-300 font-bold mb-2">
                                    <Trophy size={18} />
                                    Ciclo {decadeData.currentCycle} Concluído!
                                </h4>
                                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                                    Você atingiu o dia 67 e definiu seu objetivo. Parabéns!
                                    Em vez de reiniciar do zero, você deve <strong>finalizar o ciclo</strong> para progredir na jornada de 10 anos e manter seus dados.
                                </p>
                                <button
                                    onClick={handleCompleteCycle}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
                                >
                                    Ir para Finalização
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OPTION B: HARD RESET */}
                    <div className={canCompleteCycle ? 'opacity-80' : ''}>
                        {canCompleteCycle && (
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-px bg-slate-700 flex-1"></div>
                                <span className="text-xs text-slate-500 uppercase font-bold">OU (Reset Manual)</span>
                                <div className="h-px bg-slate-700 flex-1"></div>
                            </div>
                        )}

                        <p className="text-slate-300 mb-6 text-sm">
                            <AlertTriangle className="inline text-orange-500 mr-1 mb-1" size={14} />
                            <strong>Atenção:</strong> Esta opção reinicia o contador para o <strong>Dia 1</strong>.
                            Use isso apenas se você falhou na jornada e quer começar de novo.
                        </p>

                        <div className="space-y-3 mb-6">
                            <p className="text-xs font-bold text-slate-500 uppercase">Selecione o que MANTER:</p>
                            {/* Toggles */}
                            <div onClick={() => toggle('keepBooks')} className="reset-option-row">
                                {options.keepBooks ? <CheckSquare className="text-emerald-500" /> : <Square className="text-slate-600" />}
                                <span className="text-white text-sm ml-2">Progresso de Leitura</span>
                            </div>
                            <div onClick={() => toggle('keepSkills')} className="reset-option-row">
                                {options.keepSkills ? <CheckSquare className="text-emerald-500" /> : <Square className="text-slate-600" />}
                                <span className="text-white text-sm ml-2">Skill Tree</span>
                            </div>
                            <div onClick={() => toggle('keepHabits')} className="reset-option-row">
                                {options.keepHabits ? <CheckSquare className="text-emerald-500" /> : <Square className="text-slate-600" />}
                                <span className="text-white text-sm ml-2">Hábitos e Rotina</span>
                            </div>
                            <div onClick={() => toggle('keepJournal')} className="reset-option-row">
                                {options.keepJournal ? <CheckSquare className="text-emerald-500" /> : <Square className="text-slate-600" />}
                                <span className="text-white text-sm ml-2">Diário e Reviews</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs text-slate-500 block">
                                Digite <strong className="text-white">REINICIAR</strong> para confirmar:
                            </label>
                            <input
                                type="text"
                                value={confirmation}
                                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                                placeholder="REINICIAR"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm font-bold tracking-wider placeholder-slate-600 focus:border-red-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={confirmation !== 'REINICIAR' || isResetting}
                        className={`
                            flex-1 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                            ${confirmation === 'REINICIAR'
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                            }
                        `}
                    >
                        {isResetting ? 'Reiniciando...' : 'Confirmar Reset'}
                    </button>
                </div>
            </div>

            <style>{`
                .reset-option-row {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem;
                    background-color: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(51, 65, 85, 0.5);
                    border-radius: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .reset-option-row:hover {
                    border-color: rgba(71, 85, 105, 1);
                    background-color: rgba(30, 41, 59, 0.8);
                }
            `}</style>
        </div>
    );
};

export default ResetProjectModal;
