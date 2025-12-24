import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, Save } from 'lucide-react';
import { Skill, AgendaActivity, DayOfWeekPlan } from '../../../types';
import { useWeeklyAgendaStore } from '../../../stores/weeklyAgendaStore';
import { getDayName } from '../../../utils/weeklyAgendaUtils';

interface DayPlanModalProps {
    dayOfWeek: number;
    skills: Skill[];
    activities: AgendaActivity[];
    existingPlan?: DayOfWeekPlan;
    onClose: () => void;
}

export const DayPlanModal: React.FC<DayPlanModalProps> = ({
    dayOfWeek,
    skills,
    activities,
    existingPlan,
    onClose
}) => {
    const { setDayPlan } = useWeeklyAgendaStore();

    // Initialize with existing plan or empty
    const [skillGoals, setSkillGoals] = useState<Record<string, number>>(() => {
        const goals: Record<string, number> = {};
        existingPlan?.skillGoals.forEach(g => {
            goals[g.skillId] = g.targetMinutes;
        });
        return goals;
    });

    const [activityGoals, setActivityGoals] = useState<Record<string, number>>(() => {
        const goals: Record<string, number> = {};
        existingPlan?.activityGoals.forEach(g => {
            goals[g.activityId] = g.targetMinutes;
        });
        return goals;
    });

    const totalMinutes = useMemo(() => {
        const skillTotal = Object.values(skillGoals).reduce((sum, mins) => sum + (mins || 0), 0);
        const activityTotal = Object.values(activityGoals).reduce((sum, mins) => sum + (mins || 0), 0);
        return skillTotal + activityTotal;
    }, [skillGoals, activityGoals]);

    const handleSkillToggle = (skillId: string, enabled: boolean) => {
        if (enabled) {
            const skill = skills.find(s => s.id === skillId);
            setSkillGoals(prev => ({ ...prev, [skillId]: skill?.dailyGoalMinutes || 30 }));
        } else {
            setSkillGoals(prev => {
                const next = { ...prev };
                delete next[skillId];
                return next;
            });
        }
    };

    const handleActivityToggle = (activityId: string, enabled: boolean) => {
        if (enabled) {
            const activity = activities.find(a => a.id === activityId);
            setActivityGoals(prev => ({ ...prev, [activityId]: activity?.dailyGoalMinutes || 30 }));
        } else {
            setActivityGoals(prev => {
                const next = { ...prev };
                delete next[activityId];
                return next;
            });
        }
    };

    const handleSave = () => {
        const skillGoalsList = Object.entries(skillGoals)
            .filter(([_, mins]) => mins > 0)
            .map(([skillId, targetMinutes]) => ({ skillId, targetMinutes }));

        const activityGoalsList = Object.entries(activityGoals)
            .filter(([_, mins]) => mins > 0)
            .map(([activityId, targetMinutes]) => ({ activityId, targetMinutes }));

        setDayPlan(dayOfWeek, skillGoalsList, activityGoalsList);
        onClose();
    };

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h === 0) return `${m}min`;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-800 w-full max-w-lg max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Calendar className="text-blue-400" size={20} />
                            Configurar {getDayName(dayOfWeek)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Defina as metas padrão para este dia da semana
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="text-slate-400 hover:text-white" size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Skills Section */}
                    {skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">
                                Habilidades ({skills.length})
                            </h4>
                            <div className="space-y-2">
                                {skills.filter(s => !s.isCompleted).map(skill => {
                                    const isEnabled = skillGoals[skill.id] !== undefined;
                                    return (
                                        <div
                                            key={skill.id}
                                            className={`p-3 rounded-xl border transition-all ${isEnabled
                                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isEnabled}
                                                        onChange={e => handleSkillToggle(skill.id, e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                    <span className="text-white font-medium">{skill.name}</span>
                                                </label>
                                                {isEnabled && (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="5"
                                                            max="480"
                                                            step="5"
                                                            value={skillGoals[skill.id] || 0}
                                                            onChange={e => setSkillGoals(prev => ({ ...prev, [skill.id]: parseInt(e.target.value) || 0 }))}
                                                            className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-center text-white text-sm focus:border-emerald-500 outline-none"
                                                        />
                                                        <span className="text-xs text-slate-500">min</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Activities Section */}
                    {activities.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-3">
                                Atividades Extras ({activities.length})
                            </h4>
                            <div className="space-y-2">
                                {activities.map(activity => {
                                    const isEnabled = activityGoals[activity.id] !== undefined;
                                    return (
                                        <div
                                            key={activity.id}
                                            className={`p-3 rounded-xl border transition-all ${isEnabled
                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isEnabled}
                                                        onChange={e => handleActivityToggle(activity.id, e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                                                    />
                                                    <span className="text-white font-medium">{activity.title}</span>
                                                </label>
                                                {isEnabled && (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="5"
                                                            max="480"
                                                            step="5"
                                                            value={activityGoals[activity.id] || 0}
                                                            onChange={e => setActivityGoals(prev => ({ ...prev, [activity.id]: parseInt(e.target.value) || 0 }))}
                                                            className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-center text-white text-sm focus:border-blue-500 outline-none"
                                                        />
                                                        <span className="text-xs text-slate-500">min</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {skills.length === 0 && activities.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            Nenhuma habilidade ou atividade disponível.
                            <br />
                            <span className="text-xs">Crie habilidades ou atividades extras primeiro.</span>
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
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold flex items-center gap-2 transition-colors"
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

export default DayPlanModal;
