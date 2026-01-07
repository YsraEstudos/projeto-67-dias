import React from 'react';
import {
    Clock, AlertCircle, Check, X, Edit2,
    Flame, GraduationCap, BookOpen, CheckCircle2, PenLine
} from 'lucide-react';
import { WeeklySnapshot } from '../../types';

interface SnapshotConfirmationModalProps {
    snapshot: WeeklySnapshot;
    onConfirm: () => void;
    onSkip: () => void;
    onClose: () => void;
    onEdit: (area: 'habits' | 'skills' | 'reading' | 'tasks' | 'journal') => void;
}

export const SnapshotConfirmationModal: React.FC<SnapshotConfirmationModalProps> = React.memo(({
    snapshot,
    onConfirm,
    onSkip,
    onClose,
    onEdit
}) => {
    const { metrics } = snapshot;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-xl">
                                <Clock size={24} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Snapshot Semanal</h2>
                                <p className="text-sm text-slate-400">
                                    Semana {snapshot.weekNumber} • {(() => {
                                        const [y, m, d] = snapshot.endDate.split('-').map(Number);
                                        return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                                    })()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
                        <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-200 font-medium">Revise os dados antes de confirmar</p>
                            <p className="text-xs text-amber-300/70 mt-1">
                                Estes são os dados capturados para esta semana. Você pode editar qualquer área antes de confirmar.
                            </p>
                        </div>
                    </div>

                    {/* Metrics Cards */}
                    <div className="space-y-3">
                        {/* Habits */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 group hover:border-orange-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <Flame size={20} className="text-orange-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">Hábitos</div>
                                    <div className="text-xs text-slate-500">{metrics.habitsCompleted}/{metrics.habitsTotal} check-ins</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">{metrics.habitConsistency}%</span>
                                <button
                                    onClick={() => onEdit('habits')}
                                    className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    title="Editar hábitos"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 group hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <GraduationCap size={20} className="text-emerald-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">Skills</div>
                                    <div className="text-xs text-slate-500">{metrics.skillsProgressed.length} skills praticadas</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">{Math.round(metrics.skillMinutes / 60)}h {metrics.skillMinutes % 60}m</span>
                                <button
                                    onClick={() => onEdit('skills')}
                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    title="Editar skills"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Reading */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 group hover:border-yellow-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <BookOpen size={20} className="text-yellow-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">Leitura</div>
                                    <div className="text-xs text-slate-500">{metrics.booksCompleted} livros finalizados</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">{metrics.booksProgress} págs</span>
                                <button
                                    onClick={() => onEdit('reading')}
                                    className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    title="Editar leitura"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 group hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={20} className="text-blue-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">Tarefas</div>
                                    <div className="text-xs text-slate-500">Esta semana</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">{metrics.tasksCompleted}</span>
                                <button
                                    onClick={() => onEdit('tasks')}
                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    title="Editar tarefas"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Journal */}
                        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 group hover:border-purple-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <PenLine size={20} className="text-purple-400" />
                                <div>
                                    <div className="text-sm font-medium text-white">Diário</div>
                                    <div className="text-xs text-slate-500">Entradas escritas</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-white">{metrics.journalEntries}</span>
                                <button
                                    onClick={() => onEdit('journal')}
                                    className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    title="Editar diário"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Overall Score Preview */}
                    {snapshot.evolution && (
                        <div className="p-4 bg-gradient-to-r from-cyan-900/30 to-teal-900/30 rounded-xl border border-cyan-500/30">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-cyan-300">Score Geral da Semana</span>
                                <span className="text-2xl font-bold text-cyan-400">{snapshot.evolution.overallScore} pts</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex gap-3">
                    <button
                        onClick={onSkip}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-colors"
                    >
                        Pular Semana
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check size={18} />
                        Confirmar Snapshot
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SnapshotConfirmationModal;
