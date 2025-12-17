import React, { useState } from 'react';
import { X, RotateCcw, CheckSquare, Square, BookOpen, Calendar, Activity, Link, PenTool } from 'lucide-react';

interface ResetProjectModalProps {
    onClose: () => void;
    onConfirm: (options: {
        keepBooks: boolean;
        keepSkills: boolean;
        keepLinks: boolean;
        keepJournal: boolean;
        keepHabits: boolean;
        keepPlanning: boolean;
    }) => void;
}

export const ResetProjectModal: React.FC<ResetProjectModalProps> = ({ onClose, onConfirm }) => {
    const [options, setOptions] = useState({
        keepBooks: true,
        keepSkills: true,
        keepLinks: true,
        keepJournal: true,
        keepHabits: true,
        keepPlanning: true
    });

    const toggle = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-700 bg-gradient-to-r from-orange-900/20 to-slate-900 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <RotateCcw className="text-orange-500" /> Reiniciar Projeto
                    </h3>
                    <button onClick={onClose} aria-label="Fechar modal">
                        <X className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <p className="text-slate-300 mb-6 text-sm">
                        Isso irá redefinir o contador para o <strong>Dia 1</strong>.
                        Seu <strong>Streak será zerado</strong>.
                        <br /><br />
                        Abaixo, selecione o que você deseja <span className="text-emerald-400 font-bold">MANTER</span> (recomendado):
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Core Data */}
                        <div
                            onClick={() => toggle('keepBooks')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepBooks ? <CheckSquare className="text-emerald-500 flex-shrink-0" /> : <Square className="text-slate-600 flex-shrink-0" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <BookOpen size={14} className="text-blue-400" /> Progresso de Leitura
                                </div>
                                <div className="text-xs text-slate-500">Manter livros e páginas lidas.</div>
                            </div>
                        </div>

                        <div
                            onClick={() => toggle('keepSkills')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepSkills ? <CheckSquare className="text-emerald-500 flex-shrink-0" /> : <Square className="text-slate-600 flex-shrink-0" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <Activity size={14} className="text-purple-400" /> Skill Tree
                                </div>
                                <div className="text-xs text-slate-500">Manter habilidades e horas estudadas.</div>
                            </div>
                        </div>

                        {/* Additional Data */}
                        <div
                            onClick={() => toggle('keepHabits')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepHabits ? <CheckSquare className="text-emerald-500 flex-shrink-0" /> : <Square className="text-slate-600 flex-shrink-0" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <CheckSquare size={14} className="text-green-400" /> Hábitos e Rotina
                                </div>
                                <div className="text-xs text-slate-500">Manter seus hábitos configurados e histórico.</div>
                            </div>
                        </div>

                        <div
                            onClick={() => toggle('keepJournal')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepJournal ? <CheckSquare className="text-emerald-500 flex-shrink-0" /> : <Square className="text-slate-600 flex-shrink-0" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <PenTool size={14} className="text-pink-400" /> Diário e Reviews
                                </div>
                                <div className="text-xs text-slate-500">Manter entradas do diário e revisões semanais.</div>
                            </div>
                        </div>

                        <div
                            onClick={() => toggle('keepPlanning')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepPlanning ? <CheckSquare className="text-emerald-500 flex-shrink-0" /> : <Square className="text-slate-600 flex-shrink-0" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <Calendar size={14} className="text-yellow-400" /> Planejamento
                                </div>
                                <div className="text-xs text-slate-500">Manter planejamento de Domingo e tarefas.</div>
                            </div>
                        </div>

                        <div
                            onClick={() => toggle('keepLinks')}
                            className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-slate-900/50 border-slate-700 hover:border-slate-600"
                        >
                            {options.keepLinks ? <CheckSquare className="text-emerald-500 flex-shrink-0" /> : <Square className="text-slate-600 flex-shrink-0" />}
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <Link size={14} className="text-cyan-400" /> Links Salvos
                                </div>
                                <div className="text-xs text-slate-500">Manter sua coleção de links.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex gap-3 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors font-medium">Cancelar</button>
                    <button onClick={() => onConfirm(options)} className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2">
                        Confirmar Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetProjectModal;
