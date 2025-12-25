/**
 * ActivityLogModal Component
 * 
 * Specialized modal to log time for activities/skills and visualize debt.
 */
import React, { useState, useMemo } from 'react';
import { X, Clock, Target, History, Plus, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import { ScheduledBlock, Skill, AgendaActivity } from '../../../types';
import { calculateActivityStats, formatMinutes } from '../../../utils/weeklyAgendaUtils';

interface ActivityLogModalProps {
    block: ScheduledBlock;
    item: Skill | AgendaActivity;
    type: 'skill' | 'activity';
    onClose: () => void;
    onLogTime: (minutes: number) => void;
    onEditBlock: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
    block,
    item,
    type,
    onClose,
    onLogTime,
    onEditBlock
}) => {
    const stats = useMemo(() => calculateActivityStats(item, type), [item, type]);

    // Logic for input
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('0');

    const title = type === 'skill' ? (item as Skill).name : (item as AgendaActivity).title;
    const color = block.color || (type === 'skill' ? (item as Skill).colorTheme : (item as AgendaActivity).color) || 'emerald';

    const handleQuickLogMeta = () => {
        const remaining = Math.max(0, stats.dailyGoal - stats.todayDone);
        setHours(Math.floor(remaining / 60).toString());
        setMinutes((remaining % 60).toString());
    };

    const handleQuickLogDebt = () => {
        setHours(Math.floor(stats.totalDebt / 60).toString());
        setMinutes((stats.totalDebt % 60).toString());
    };

    const handleSubmit = () => {
        const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
        if (totalMinutes > 0) {
            onLogTime(totalMinutes);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${color}-500 shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                        <div>
                            <h3 className="font-bold text-white text-lg leading-tight">{title}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                                {type === 'skill' ? 'Desenvolvimento de Skill' : 'Atividade Extra'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">
                    {/* Stats Section */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <Target size={14} />
                                <span>Meta do Dia</span>
                            </div>
                            <div className="text-xl font-bold text-white">
                                {formatMinutes(stats.dailyGoal)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                {Math.min(100, Math.round((stats.todayDone / stats.dailyGoal) * 100))}% completo
                            </div>
                        </div>
                        <div className={`p-3 rounded-xl border ${stats.totalDebt > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                <AlertCircle size={14} className={stats.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                                <span>Dívida Total</span>
                            </div>
                            <div className={`text-xl font-bold ${stats.totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {formatMinutes(stats.totalDebt)}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase">
                                {stats.totalDebt > 0 ? 'Pendente' : 'Em dia'}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar (Visual) */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold px-0.5">
                            <span className="text-slate-400">Progresso hoje</span>
                            <span className="text-white">{formatMinutes(stats.todayDone)} / {formatMinutes(stats.dailyGoal)}</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700/30">
                            <div
                                className={`h-full transition-all duration-500 bg-${color}-500 shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                                style={{ width: `${Math.min(100, (stats.todayDone / stats.dailyGoal) * 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Logging Section */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                            <Clock size={16} />
                            Registrar Tempo Investido
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <div className="space-y-1">
                                <input
                                    type="number"
                                    value={hours}
                                    onChange={e => setHours(e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-xl font-bold text-white focus:border-emerald-500 outline-none"
                                />
                                <span className="block text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider">Horas</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-700">:</span>
                            <div className="space-y-1">
                                <input
                                    type="number"
                                    value={minutes}
                                    onChange={e => setMinutes(e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 rounded-xl p-3 text-center text-xl font-bold text-white focus:border-emerald-500 outline-none"
                                />
                                <span className="block text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider">Minutos</span>
                            </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleQuickLogMeta}
                                className="flex items-center justify-center gap-2 py-2.5 px-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-600/30 active:scale-95"
                            >
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                Bater Meta (Hoje)
                            </button>
                            <button
                                onClick={handleQuickLogDebt}
                                className="flex items-center justify-center gap-2 py-2.5 px-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-600/30 active:scale-95"
                            >
                                <History size={14} className="text-rose-400" />
                                Quitar Dívida
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-900/50 rounded-b-2xl border-t border-slate-700 space-y-3">
                    <button
                        onClick={handleSubmit}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        Registrar Agora
                    </button>

                    <button
                        onClick={onEditBlock}
                        className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-bold"
                    >
                        <Edit2 size={12} />
                        Apenas editar horário do bloco
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;
