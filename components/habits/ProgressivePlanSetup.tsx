import React, { useMemo } from 'react';
import { Calendar, TrendingUp, Flame } from 'lucide-react';
import { ProgressivePlan } from '../../types';
import { generateFullSchedule } from '../../utils/habitProgressiveCalc';

interface ProgressivePlanSetupProps {
    plan: ProgressivePlan | undefined;
    onChange: (plan: ProgressivePlan | undefined) => void;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const ProgressivePlanSetup: React.FC<ProgressivePlanSetupProps> = ({ plan, onChange }) => {
    const isEnabled = !!plan;

    const defaultPlan: ProgressivePlan = {
        startDate: new Date().toISOString().split('T')[0],
        targetMinutes: 30,
        daysPerWeek: 3,
        scheduledDays: [1, 3, 5], // Seg, Qua, Sex
    };

    const currentPlan = plan || defaultPlan;

    const toggleEnabled = () => {
        if (isEnabled) {
            onChange(undefined);
        } else {
            onChange(defaultPlan);
        }
    };

    const updatePlan = (updates: Partial<ProgressivePlan>) => {
        onChange({ ...currentPlan, ...updates });
    };

    const toggleDay = (dayNum: number) => {
        const current = currentPlan.scheduledDays;
        let newDays: number[];
        if (current.includes(dayNum)) {
            newDays = current.filter(d => d !== dayNum);
        } else {
            newDays = [...current, dayNum].sort();
        }
        updatePlan({
            scheduledDays: newDays,
            daysPerWeek: newDays.length,
        });
    };

    // Generate preview schedule
    const schedule = useMemo(() => {
        if (!isEnabled) return [];
        return generateFullSchedule(currentPlan);
    }, [isEnabled, currentPlan]);

    // Get preview milestones (first, 25%, 50%, 75%, last)
    const milestones = useMemo(() => {
        if (schedule.length === 0) return [];
        const indices = [
            0,
            Math.floor(schedule.length * 0.25),
            Math.floor(schedule.length * 0.5),
            Math.floor(schedule.length * 0.75),
            schedule.length - 1,
        ];
        // Remove duplicates
        return [...new Set(indices)].map(i => schedule[i]);
    }, [schedule]);

    return (
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            {/* Header with Toggle */}
            <div
                onClick={toggleEnabled}
                className={`flex items-center justify-between cursor-pointer mb-3 ${isEnabled ? '' : 'opacity-70'}`}
            >
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-1 cursor-pointer">
                    <Flame size={14} className={isEnabled ? 'text-orange-400' : ''} />
                    Plano Progressivo 67 Dias
                </label>
                <div className={`w-12 h-6 rounded-full transition-all relative ${
                    isEnabled ? 'bg-orange-500' : 'bg-slate-600'
                }`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                        isEnabled ? 'right-0.5' : 'left-0.5'
                    }`} />
                </div>
            </div>

            {!isEnabled && (
                <p className="text-xs text-slate-500">
                    Ative para criar uma progressão gradual de 67 dias — comece devagar e aumente até a meta final.
                </p>
            )}

            {isEnabled && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    {/* Target Minutes */}
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                            Meta Final (minutos por sessão)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={5}
                                max={180}
                                step={5}
                                value={currentPlan.targetMinutes}
                                onChange={e => updatePlan({ targetMinutes: Number(e.target.value) })}
                                className="flex-1 accent-orange-500"
                            />
                            <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1 text-center min-w-[80px]">
                                <span className="text-lg font-bold text-orange-400">{currentPlan.targetMinutes}</span>
                                <span className="text-xs text-slate-400 ml-1">min</span>
                            </div>
                        </div>
                    </div>

                    {/* Scheduled Days */}
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                            Dias da Semana ({currentPlan.scheduledDays.length}x por semana)
                        </label>
                        <div className="flex gap-1.5">
                            {DAY_LABELS.map((label, idx) => {
                                const isSelected = currentPlan.scheduledDays.includes(idx);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => toggleDay(idx)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                            isSelected
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                : 'bg-slate-800 text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                            <Calendar size={10} className="inline mr-1" />
                            Data de Início
                        </label>
                        <input
                            type="date"
                            value={currentPlan.startDate}
                            onChange={e => updatePlan({ startDate: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
                        />
                    </div>

                    {/* Schedule Preview — Mini Bar Chart */}
                    {schedule.length > 0 && (
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-1 mb-2">
                                <TrendingUp size={12} className="text-orange-400" />
                                <span className="text-[10px] text-slate-400 uppercase font-bold">
                                    Progressão ({schedule.length} sessões em 67 dias)
                                </span>
                            </div>

                            {/* Mini bar chart */}
                            <div className="flex items-end gap-px h-16 mb-2">
                                {schedule.map((session, i) => {
                                    const heightPercent = currentPlan.targetMinutes > 0
                                        ? (session.targetMinutes / currentPlan.targetMinutes) * 100
                                        : 0;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity min-w-[2px]"
                                            style={{ height: `${Math.max(8, heightPercent)}%` }}
                                            title={`Sessão ${session.sessionNumber}: ${session.targetMinutes}min (Dia ${session.dayNumber})`}
                                        />
                                    );
                                })}
                            </div>

                            {/* Milestones */}
                            <div className="flex justify-between text-[10px] text-slate-500">
                                {milestones.map((m, i) => (
                                    <span key={i}>
                                        D{m.dayNumber}: <span className="text-orange-400 font-bold">{m.targetMinutes}m</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 text-xs text-orange-300">
                        <strong>Resumo:</strong> Começar com <strong>5 min</strong> e aumentar gradualmente até{' '}
                        <strong>{currentPlan.targetMinutes} min</strong> por sessão ao longo de 67 dias.{' '}
                        {currentPlan.scheduledDays.length}x por semana ({currentPlan.scheduledDays.map(d => DAY_LABELS[d]).join(', ')}).
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressivePlanSetup;
