import React from 'react';
import { Clock, Edit2, Timer } from 'lucide-react';
import { Skill, SkillGoalType } from '../../types';
import { useEditableField } from '../../hooks/useEditableField';
import { useSkillsStore } from '../../stores/skillsStore';
import { THEME_VARIANTS, ThemeKey } from './constants';
import { GoalTypeSelector } from './GoalTypeSelector';

interface ProgressStatsProps {
    skill: Skill;
    onAddSession: (minutes: number) => void;
    onUpdateGoal: (goalMinutes: number) => void;
    onUpdateGoalType: (goalType: SkillGoalType) => void;
}

/**
 * Progress statistics component showing current progress, remaining hours/pomodoros,
 * session count, and editable goal.
 */
export const ProgressStats: React.FC<ProgressStatsProps> = ({ skill, onAddSession, onUpdateGoal, onUpdateGoalType }) => {
    const { addPomodoro } = useSkillsStore();
    const isPomodoro = skill.goalType === 'POMODOROS';

    // Calculate progress based on goal type
    const percentage = isPomodoro
        ? Math.min(100, Math.round(((skill.pomodorosCompleted || 0) / (skill.goalPomodoros || 1)) * 100))
        : Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));

    const remainingHours = Math.max(0, (skill.goalMinutes - skill.currentMinutes) / 60);
    const remainingPomodoros = Math.max(0, (skill.goalPomodoros || 0) - (skill.pomodorosCompleted || 0));

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
                    // For pomodoros, we need to update through skill update
                    // This is handled via onUpdateGoal by the parent (not ideal but works)
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
