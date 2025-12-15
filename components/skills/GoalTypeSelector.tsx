import React from 'react';
import { Clock, Timer } from 'lucide-react';
import { SkillGoalType } from '../../types';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface GoalTypeSelectorProps {
    value: SkillGoalType;
    onChange: (type: SkillGoalType) => void;
    theme?: ThemeKey;
}

/**
 * GoalTypeSelector - Toggle between Time and Pomodoro goal tracking
 */
export const GoalTypeSelector: React.FC<GoalTypeSelectorProps> = ({
    value,
    onChange,
    theme = 'emerald'
}) => {
    const variants = THEME_VARIANTS[theme];

    return (
        <div>
            <label className="block text-xs text-slate-500 uppercase font-bold mb-2">
                Tipo de Progresso
            </label>
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
                <button
                    type="button"
                    onClick={() => onChange('TIME')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${value === 'TIME'
                            ? `${variants.bg} text-white shadow-lg`
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <Clock size={16} />
                    <span>Tempo</span>
                </button>
                <button
                    type="button"
                    onClick={() => onChange('POMODOROS')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${value === 'POMODOROS'
                            ? `${variants.bg} text-white shadow-lg`
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                >
                    <span className="text-lg">🍅</span>
                    <span>Pomodoros</span>
                </button>
            </div>
        </div>
    );
};

export default GoalTypeSelector;
