import React from 'react';
import { Clock, Edit2 } from 'lucide-react';
import { Skill } from '../../types';
import { useEditableField } from '../../hooks/useEditableField';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface ProgressStatsProps {
    skill: Skill;
    onAddSession: (minutes: number) => void;
    onUpdateGoal: (goalMinutes: number) => void;
}

/**
 * Progress statistics component showing current progress, remaining hours,
 * session count, and editable goal hours.
 */
export const ProgressStats: React.FC<ProgressStatsProps> = ({ skill, onAddSession, onUpdateGoal }) => {
    const percentage = Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));
    const remainingHours = Math.max(0, (skill.goalMinutes - skill.currentMinutes) / 60);

    const theme = skill.colorTheme as ThemeKey || 'emerald';
    const variants = THEME_VARIANTS[theme];

    const goalEditor = useEditableField(
        (skill.goalMinutes / 60).toString(),
        (newValue) => {
            const hours = parseFloat(newValue);
            if (!isNaN(hours) && hours > 0) {
                onUpdateGoal(Math.round(hours * 60));
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

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
                <div className={`h-full ${variants.bg} transition-all`} style={{ width: `${percentage}%` }}></div>
            </div>

            <div className="text-center py-4">
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
                        <span className="text-sm text-slate-400">h meta (Tempo)</span>
                    </div>
                ) : (
                    <div
                        className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-1 group cursor-pointer hover:text-slate-300 transition-colors"
                        onClick={goalEditor.startEditing}
                        title="Clique para alterar a meta de horas"
                    >
                        <span>de {(skill.goalMinutes / 60)}h meta (Tempo)</span>
                        <Edit2 size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${variants.text}`} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-900 p-3 rounded-xl text-center">
                    <div className="text-xs text-slate-500 uppercase">Restam</div>
                    <div className={`text-lg font-bold ${variants.text}`}>{remainingHours.toFixed(1)}h</div>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl text-center">
                    <div className="text-xs text-slate-500 uppercase">Sessões</div>
                    <div className="text-lg font-bold text-blue-400">{skill.logs.length}</div>
                </div>
            </div>

            <button
                onClick={handleRegisterStudy}
                className={`w-full mt-4 ${variants.button} py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg`}
            >
                <Clock size={18} /> Registrar Estudo
            </button>
        </div>
    );
};
