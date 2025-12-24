import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Save, Sparkles } from 'lucide-react';
import { Skill, AgendaActivity, DayOfWeekPlan, DayOverride } from '../../../types';
import { useWeeklyAgendaStore } from '../../../stores/weeklyAgendaStore';
import { getTomorrowDate, getDayOfWeek, getDayName, formatDateDisplay } from '../../../utils/weeklyAgendaUtils';

interface TomorrowModalProps {
    skills: Skill[];
    activities: AgendaActivity[];
    weeklyPlan: DayOfWeekPlan[];
    existingOverride?: DayOverride;
    onClose: () => void;
}

export const TomorrowModal: React.FC<TomorrowModalProps> = ({
    skills,
    activities,
    weeklyPlan,
    existingOverride,
    onClose
}) => {
    const { addOverride, removeOverride } = useWeeklyAgendaStore();

    const tomorrowDate = getTomorrowDate();
    const tomorrowDayOfWeek = getDayOfWeek(tomorrowDate);
    const defaultPlan = weeklyPlan.find(p => p.dayOfWeek === tomorrowDayOfWeek);

    // Initialize from existing override or default plan
    const [reason, setReason] = useState(existingOverride?.reason || '');

    const [skillGoals, setSkillGoals] = useState<Record<string, number>>(() => {
        if (existingOverride) {
            const goals: Record<string, number> = {};
            existingOverride.skillGoals.forEach(g => { goals[g.skillId] = g.targetMinutes; });
            return goals;
        }
        if (defaultPlan) {
            const goals: Record<string, number> = {};
            defaultPlan.skillGoals.forEach(g => { goals[g.skillId] = g.targetMinutes; });
            return goals;
        }
        return {};
    });

    const [activityGoals, setActivityGoals] = useState<Record<string, number>>(() => {
        if (existingOverride) {
            const goals: Record<string, number> = {};
            existingOverride.activityGoals.forEach(g => { goals[g.activityId] = g.targetMinutes; });
            return goals;
        }
        if (defaultPlan) {
            const goals: Record<string, number> = {};
            defaultPlan.activityGoals.forEach(g => { goals[g.activityId] = g.targetMinutes; });
            return goals;
        }
        return {};
    });

    const totalMinutes = useMemo(() => {
        const skillTotal = Object.values(skillGoals).reduce((sum, mins) => sum + (mins || 0), 0);
        const activityTotal = Object.values(activityGoals).reduce((sum, mins) => sum + (mins || 0), 0);
        return skillTotal + activityTotal;
    }, [skillGoals, activityGoals]);

    const handleSave = () => {
        const skillGoalsList = Object.entries(skillGoals)
            .filter(([_, mins]) => mins > 0)
            .map(([skillId, targetMinutes]) => ({ skillId, targetMinutes }));

        const activityGoalsList = Object.entries(activityGoals)
            .filter(([_, mins]) => mins > 0)
            .map(([activityId, targetMinutes]) => ({ activityId, targetMinutes }));

        addOverride({
            date: tomorrowDate,
            reason: reason || undefined,
            skillGoals: skillGoalsList,
            activityGoals: activityGoalsList
        });
        onClose();
    };

    const handleRemoveOverride = () => {
        removeOverride(tomorrowDate);
        onClose();
    };

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h === 0) return `${m}min`;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    const REASON_SUGGESTIONS = ['Feriado', 'Folga', 'Disponibilidade extra', 'Compromisso', 'Imprevistos'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Sparkles className="text-amber-400" size={20} />
                            Ajustar Amanhã
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar size={10} />
                            {getDayName(tomorrowDayOfWeek)}, {formatDateDisplay(tomorrowDate)}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Reason */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">
                            Motivo (opcional)
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Ex: Feriado, Disponibilidade extra..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                            {REASON_SUGGESTIONS.map(sug => (
                                <button
                                    key={sug}
                                    onClick={() => setReason(sug)}
                                    className="text-[10px] px-2 py-1 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Skills */}
                    {skills.filter(s => !s.isCompleted).length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                                Habilidades
                            </h4>
                            <div className="space-y-2">
                                {skills.filter(s => !s.isCompleted).map(skill => (
                                    <div key={skill.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                                        <span className="flex-1 text-white text-sm">{skill.name}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="480"
                                            step="5"
                                            value={skillGoals[skill.id] || 0}
                                            onChange={e => setSkillGoals(prev => ({
                                                ...prev,
                                                [skill.id]: parseInt(e.target.value) || 0
                                            }))}
                                            className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-center text-white text-sm focus:border-emerald-500 outline-none"
                                        />
                                        <span className="text-xs text-slate-500 w-8">min</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Activities */}
                    {activities.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                                Atividades Extras
                            </h4>
                            <div className="space-y-2">
                                {activities.map(activity => (
                                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                                        <span className="flex-1 text-white text-sm">{activity.title}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="480"
                                            step="5"
                                            value={activityGoals[activity.id] || 0}
                                            onChange={e => setActivityGoals(prev => ({
                                                ...prev,
                                                [activity.id]: parseInt(e.target.value) || 0
                                            }))}
                                            className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-center text-white text-sm focus:border-blue-500 outline-none"
                                        />
                                        <span className="text-xs text-slate-500 w-8">min</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                        <Clock size={14} />
                        Total: <span className="text-white font-bold">{formatHours(totalMinutes)}</span>
                    </div>
                    <div className="flex gap-2">
                        {existingOverride && (
                            <button
                                onClick={handleRemoveOverride}
                                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                Remover
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-bold flex items-center gap-2 transition-colors"
                        >
                            <Save size={16} />
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TomorrowModal;
