import React, { useState } from 'react';
import { Play, CheckCircle2, X } from 'lucide-react';
import { Skill } from '../../types';
import { THEMES } from './constants';

interface SkillCardProps {
    skill: Skill;
    onClick: () => void;
    onAddSession: (m: number) => void;
    isCompact?: boolean;
}

export const SkillCard: React.FC<SkillCardProps> = React.memo((props) => {
    const { skill, onClick, onAddSession } = props;
    const percentage = Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));
    const themeColor = THEMES[skill.colorTheme as keyof typeof THEMES] || THEMES.emerald;
    const textColor = themeColor.split(' ')[0];
    const barColor = themeColor.split(' ')[1];

    const [isAdding, setIsAdding] = useState(false);
    const [sessionMinutes, setSessionMinutes] = useState('30');

    const handleConfirmSession = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        const mins = parseInt(sessionMinutes);
        if (!isNaN(mins) && mins > 0) {
            onAddSession(mins);
            setIsAdding(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAdding(false);
    };

    if (props.isCompact) {
        return (
            <div
                onClick={onClick}
                className="group bg-slate-900/50 border border-slate-700/50 hover:border-yellow-500/30 hover:bg-yellow-500/5 rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-yellow-500 shadow-lg shadow-yellow-900/10">
                        <CheckCircle2 size={18} fill="currentColor" className="text-yellow-500/20" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm line-clamp-1">{skill.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="text-yellow-500/80">Dominada</span>
                            <span>•</span>
                            <span>{(skill.currentMinutes / 60).toFixed(0)}h totais</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            className={`group bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-lg relative overflow-hidden ${skill.isCompleted ? 'ring-1 ring-yellow-500/30' : ''}`}
        >
            {/* Progress Bar Background */}
            <div className="absolute top-0 left-0 h-1 w-full bg-slate-900">
                <div className={`h-full ${barColor} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
            </div>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${textColor}`}>{skill.level}</div>
                    <h3 className="text-xl font-bold text-white mb-1">{skill.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                    {percentage}%
                </div>
            </div>

            <div className="flex items-end justify-between mt-6">
                <div className="text-sm text-slate-500">
                    <span className="text-white font-mono text-lg">{(skill.currentMinutes / 60).toFixed(1)}</span>
                    <span className="text-xs"> / {(skill.goalMinutes / 60).toFixed(0)}h</span>
                </div>

                {isAdding ? (
                    <div
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 bg-slate-900 border border-emerald-500/50 rounded-lg p-1 pr-2 animate-in slide-in-from-right-5 fade-in duration-300 shadow-lg shadow-emerald-900/20"
                    >
                        <input
                            type="number"
                            value={sessionMinutes}
                            onChange={e => setSessionMinutes(e.target.value)}
                            className="w-12 bg-transparent text-white text-sm font-bold text-center outline-none"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleConfirmSession(e)}
                            onClick={e => e.stopPropagation()}
                        />
                        <span className="text-[10px] text-slate-500 font-medium mr-1">min</span>

                        <button
                            onClick={handleConfirmSession}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                        >
                            <CheckCircle2 size={12} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                        className="group/btn p-2 bg-slate-700 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-lg active:scale-95 flex items-center gap-2 text-xs font-medium hover:pr-3"
                    >
                        <Play size={14} fill="currentColor" />
                        <span>+Sessão</span>
                    </button>
                )}
            </div>
        </div>
    );
});

SkillCard.displayName = 'SkillCard';
