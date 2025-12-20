import React, { useEffect, useMemo } from 'react';
import { Clock, Edit2, Timer, CalendarClock } from 'lucide-react';
import { Skill, SkillGoalType } from '../../types';
import { useEditableField } from '../../hooks/useEditableField';
import { useSkillsStore } from '../../stores/skillsStore';
import { THEME_VARIANTS, ThemeKey } from './constants';
import { GoalTypeSelector } from './GoalTypeSelector';
import { calculateDailyRequirement, calculateDailyPlan } from '../../utils/skillPrediction';

interface ProgressStatsProps {
    skill: Skill;
    onAddSession: (minutes: number) => void;
    onUpdateGoal: (goalMinutes: number) => void;
    onUpdateGoalType: (goalType: SkillGoalType) => void;
    onUpdateDeadline?: (deadline: string | undefined) => void;
}

/**
 * Progress statistics component showing current progress, remaining hours/pomodoros,
 * session count, and editable goal.
 */
export const ProgressStats: React.FC<ProgressStatsProps> = ({ skill, onAddSession, onUpdateGoal, onUpdateGoalType, onUpdateDeadline }) => {
    const { addPomodoro, updateSkill } = useSkillsStore();
    const isPomodoro = skill.goalType === 'POMODOROS';

    // Auto-sync goalPomodoros if it doesn't match goalMinutes
    useEffect(() => {
        const expectedPomodoros = Math.ceil(skill.goalMinutes / 25);
        const currentPomodoros = skill.goalPomodoros || 0;

        // If there's a significant mismatch, auto-fix it
        if (Math.abs(expectedPomodoros - currentPomodoros) > 1 && skill.goalMinutes > 0) {
            updateSkill(skill.id, { goalPomodoros: expectedPomodoros });
        }
    }, [skill.id, skill.goalMinutes, skill.goalPomodoros, updateSkill]);

    // Calculate progress based on goal type
    const percentage = isPomodoro
        ? Math.min(100, Math.round(((skill.pomodorosCompleted || 0) / (skill.goalPomodoros || 1)) * 100))
        : Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));

    const remainingHours = Math.max(0, (skill.goalMinutes - skill.currentMinutes) / 60);
    const remainingPomodoros = Math.max(0, (skill.goalPomodoros || 0) - (skill.pomodorosCompleted || 0));

    // Memoized daily prediction - only recalculates when relevant skill fields change
    const prediction = useMemo(() => calculateDailyRequirement(skill), [
        skill.deadline,
        skill.goalType,
        skill.goalMinutes,
        skill.currentMinutes,
        skill.goalPomodoros,
        skill.pomodorosCompleted
    ]);

    // Memoized exponential daily plan - for phase-aware predictions
    const dailyPlan = useMemo(() => {
        if (skill.distributionType !== 'EXPONENTIAL') return null;
        return calculateDailyPlan(skill);
    }, [
        skill.deadline,
        skill.goalType,
        skill.goalMinutes,
        skill.currentMinutes,
        skill.goalPomodoros,
        skill.pomodorosCompleted,
        skill.distributionType,
        skill.exponentialIntensity,
        skill.excludedDays
    ]);

    // Get today's plan from exponential distribution
    const todayPlan = useMemo(() => {
        if (!dailyPlan || dailyPlan.isExpired || dailyPlan.items.length === 0) return null;
        const today = new Date().toISOString().split('T')[0];
        return dailyPlan.items.find(item => item.date === today) || dailyPlan.items[0];
    }, [dailyPlan]);

    // Get current phase info
    const currentPhase = useMemo(() => {
        if (!dailyPlan || dailyPlan.phases.length === 0 || !todayPlan) return null;
        const today = new Date().toISOString().split('T')[0];
        const todayIndex = dailyPlan.items.filter(i => !i.isExcluded).findIndex(i => i.date === today);
        if (todayIndex === -1) return dailyPlan.phases[0];
        
        for (const phase of dailyPlan.phases) {
            if (todayIndex >= phase.startDay - 1 && todayIndex < phase.endDay) {
                return phase;
            }
        }
        return dailyPlan.phases[dailyPlan.phases.length - 1];
    }, [dailyPlan, todayPlan]);

    const theme = skill.colorTheme as ThemeKey || 'emerald';
    const variants = THEME_VARIANTS[theme];

    const goalEditor = useEditableField(
        isPomodoro
            ? (skill.goalPomodoros || 10).toString()
            : (skill.goalMinutes / 60).toString(),
        (newValue) => {
            const value = parseFloat(newValue);
            if (!isNaN(value) && value > 0) {
                if (isPomodoro) {
                    // Ao alterar pomodoros, sincronizar com minutos
                    const newMinutes = Math.round(value * 25);
                    onUpdateGoal(newMinutes);
                } else {
                    onUpdateGoal(Math.round(value * 60));
                }
            }
        }
    );

    const handleRegisterStudy = () => {
        const mins = prompt("Adicionar quantos minutos?", "60");
        if (mins) {
            const m = parseInt(mins);
            if (!isNaN(m) && m > 0) {
                onAddSession(m);
            }
        }
    };

    const handleAddPomodoro = () => {
        addPomodoro(skill.id);
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
                <div className={`h-full ${variants.bg} transition-all`} style={{ width: `${percentage}%` }}></div>
            </div>

            {/* Toggle Pomodoro/Horas */}
            <div className="mb-4">
                <GoalTypeSelector
                    value={skill.goalType || 'TIME'}
                    onChange={onUpdateGoalType}
                    theme={theme}
                />
            </div>

            <div className="text-center py-4">
                {isPomodoro ? (
                    <>
                        <div className="text-5xl font-bold text-white font-mono flex items-center justify-center gap-2">
                            {skill.pomodorosCompleted || 0}
                            <span className="text-3xl">🍅</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                            de {skill.goalPomodoros || 10} pomodoros
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-5xl font-bold text-white font-mono">
                            {(skill.currentMinutes / 60).toFixed(1)}<span className="text-xl text-slate-500">h</span>
                        </div>
                        {goalEditor.isEditing ? (
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-sm text-slate-400">de</span>
                                <input
                                    ref={goalEditor.inputRef}
                                    type="number"
                                    min="1"
                                    step="0.5"
                                    value={goalEditor.editedValue}
                                    onChange={e => goalEditor.setEditedValue(e.target.value)}
                                    onBlur={goalEditor.save}
                                    onKeyDown={goalEditor.handleKeyDown}
                                    className={`w-20 text-center text-sm font-mono ${variants.text} bg-slate-900 border ${variants.border} rounded-lg px-2 py-1 outline-none`}
                                />
                                <span className="text-sm text-slate-400">h meta</span>
                            </div>
                        ) : (
                            <div
                                className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-1 group cursor-pointer hover:text-slate-300 transition-colors"
                                onClick={goalEditor.startEditing}
                                title="Clique para alterar a meta de horas"
                            >
                                <span>de {(skill.goalMinutes / 60)}h meta</span>
                                <Edit2 size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${variants.text}`} />
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-900 p-3 rounded-xl text-center">
                    <div className="text-xs text-slate-500 uppercase">
                        {isPomodoro ? 'Restam' : 'Restam'}
                    </div>
                    <div className={`text-lg font-bold ${variants.text}`}>
                        {isPomodoro
                            ? `${remainingPomodoros} 🍅`
                            : `${remainingHours.toFixed(1)}h`
                        }
                    </div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl text-center">
                    <div className="text-xs text-slate-500 uppercase">Sessões</div>
                    <div className="text-lg font-bold text-blue-400">{skill.logs.length}</div>
                </div>
            </div>

            {/* Daily Prediction - mostra quando skill tem deadline */}
            {prediction && (
                <div className="mt-3 p-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <CalendarClock size={14} className={variants.text} />
                        <span className="text-xs text-slate-500 uppercase">Previsão Diária</span>
                        {currentPhase && (
                            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                                {currentPhase.emoji} {currentPhase.name}
                            </span>
                        )}
                    </div>
                    {prediction.isExpired ? (
                        <div className="text-center text-red-400 font-medium text-sm">
                            ⚠️ Prazo expirado!
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <div className={`text-xl font-bold ${variants.text}`}>
                                    {/* Use exponential plan for today if available, otherwise use linear average */}
                                    {todayPlan && !todayPlan.isExcluded ? (
                                        isPomodoro
                                            ? `${Math.ceil(todayPlan.minutes / 25)} 🍅/dia`
                                            : `${(todayPlan.minutes / 60).toFixed(1)}h/dia`
                                    ) : (
                                        isPomodoro
                                            ? `${prediction.pomodorosPerDay} 🍅/dia`
                                            : `${prediction.hoursPerDay.toFixed(1)}h/dia`
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {todayPlan && currentPhase ? (
                                        <>
                                            {todayPlan.percentOfAverage}% da média • Fase {currentPhase.name}
                                        </>
                                    ) : (
                                        <>para terminar em {prediction.remainingDays} dia{prediction.remainingDays !== 1 ? 's' : ''}</>
                                    )}
                                </div>
                            </div>
                            <div className="text-right text-xs text-slate-600">
                                Deadline: {new Date(skill.deadline!).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Deadline Editor */}
            {onUpdateDeadline && (
                <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarClock size={14} className="text-amber-400" />
                            <span className="text-xs text-slate-500 uppercase font-bold">Deadline</span>
                        </div>
                        {skill.deadline && (
                            <button
                                onClick={() => onUpdateDeadline(undefined)}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Remover
                            </button>
                        )}
                    </div>
                    <input
                        type="date"
                        value={skill.deadline || ''}
                        onChange={(e) => onUpdateDeadline(e.target.value || undefined)}
                        className="w-full mt-2 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none transition-colors"
                        min={new Date().toISOString().split('T')[0]}
                    />
                    {!skill.deadline && (
                        <p className="text-xs text-slate-500 mt-1">
                            Defina uma data para calcular estudo diário
                        </p>
                    )}
                </div>
            )}

            {isPomodoro ? (
                <button
                    onClick={handleAddPomodoro}
                    className={`w-full mt-4 ${variants.button} py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                >
                    <span className="text-xl">🍅</span> +1 Pomodoro (25min)
                </button>
            ) : (
                <button
                    onClick={handleRegisterStudy}
                    className={`w-full mt-4 ${variants.button} py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg`}
                >
                    <Clock size={18} /> Registrar Estudo
                </button>
            )}
        </div>
    );
};
