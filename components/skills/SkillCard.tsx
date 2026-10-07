import React, { useMemo, useState } from 'react';
import { Play, CheckCircle2, X, BarChart3 } from 'lucide-react';
import { Skill, SkillLog } from '../../types';
import { THEMES } from './constants';
import { SkillContextMenu } from './SkillContextMenu';
import { SessionHistoryModal } from './SessionHistoryModal';
import { useSkillsStore } from '../../stores/skillsStore';

interface SkillCardProps {
    skill: Skill;
    onClick: () => void;
    onAddSession: (m: number) => void;
    isCompact?: boolean;
    onToggleDistribution?: (skillId: string) => void;
    onViewDailyPlan?: (skill: Skill) => void;
}

/** Sum of minutes logged on the current local calendar day (log dates are UTC ISO strings). */
export const getTodayMinutes = (logs: SkillLog[] | undefined, now: Date = new Date()): number => {
    if (!logs?.length) return 0;
    return logs.reduce((sum, log) => {
        const d = new Date(log.date);
        const isSameLocalDay = d.getFullYear() === now.getFullYear()
            && d.getMonth() === now.getMonth()
            && d.getDate() === now.getDate();
        return isSameLocalDay ? sum + (log.minutes || 0) : sum;
    }, 0);
};

const formatTodayMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

export const SkillCard: React.FC<SkillCardProps> = React.memo((props) => {
    const { skill, onClick, onAddSession, onToggleDistribution, onViewDailyPlan } = props;
    const deleteLog = useSkillsStore(s => s.deleteLog);
    const percentage = Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));
    const themeColor = THEMES[skill.colorTheme as keyof typeof THEMES] || THEMES.emerald;
    const textColor = themeColor.split(' ')[0];
    const barColor = themeColor.split(' ')[1];

    const [isAdding, setIsAdding] = useState(false);
    const [sessionMinutes, setSessionMinutes] = useState('30');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [showHistory, setShowHistory] = useState(false);

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

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleDeleteLog = (logId: string) => {
        deleteLog(skill.id, logId);
    };

    const isExponential = skill.distributionType === 'EXPONENTIAL';
    const todayMinutes = useMemo(() => getTodayMinutes(skill.logs), [skill.logs]);

    // Keyboard activation for the card itself; ignore keys bubbling from inner inputs/buttons
    const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    if (props.isCompact) {
        return (
            <>
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir habilidade ${skill.name}`}
                    onClick={onClick}
                    onKeyDown={handleCardKeyDown}
                    onContextMenu={handleContextMenu}
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

                    {contextMenu && (
                        <SkillContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            skill={skill}
                            onClose={() => setContextMenu(null)}
                            onToggleDistribution={() => onToggleDistribution?.(skill.id)}
                            onViewDailyPlan={() => onViewDailyPlan?.(skill)}
                            onViewHistory={() => setShowHistory(true)}
                        />
                    )}
                </div>

                {showHistory && (
                    <SessionHistoryModal
                        skill={skill}
                        onClose={() => setShowHistory(false)}
                        onDeleteLog={handleDeleteLog}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                aria-label={`Abrir habilidade ${skill.name}`}
                onClick={onClick}
                onKeyDown={handleCardKeyDown}
                onContextMenu={handleContextMenu}
                className={`group bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 border border-slate-700 hover:border-emerald-500/30 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/10 relative overflow-hidden ${skill.isCompleted ? 'ring-1 ring-yellow-500/30' : ''}`}
            >
                {/* Animated gradient border glow */}
                <div className="absolute inset-0 rounded-2xl p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-emerald-500/30 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
                </div>

                {/* Background gradient glow */}
                <div className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 transition-all duration-700 blur-xl pointer-events-none bg-emerald-500" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none">
                    <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                </div>

                {/* Progress Bar Background */}
                <div className="absolute top-0 left-0 h-1 w-full bg-slate-900 z-10">
                    <div className={`h-full ${barColor} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                </div>

                {/* Distribution indicator */}
                {isExponential && skill.deadline && (
                    <div className="absolute top-2 right-2">
                        <div className="p-1 bg-purple-500/20 rounded text-purple-400" title="Distribuição Exponencial">
                            <BarChart3 size={12} />
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{skill.level}</div>
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-900/60 border border-slate-700 rounded-full px-2 py-[2px] leading-none">
                                Nível {skill.levelNumber ?? 1}
                                {(skill.totalXp ?? 0) > 0 && (
                                    <span className="text-emerald-400/90">• {(skill.totalXp ?? 0).toLocaleString('pt-BR')} XP</span>
                                )}
                            </span>
                        </div>
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
                        {todayMinutes > 0 && (
                            <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5" data-testid="skill-today-minutes">
                                Hoje: {formatTodayMinutes(todayMinutes)}
                            </div>
                        )}
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
                                aria-label="Minutos da sessão"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleConfirmSession(e);
                                    if (e.key === 'Escape') { e.stopPropagation(); setIsAdding(false); }
                                }}
                                onClick={e => e.stopPropagation()}
                            />
                            <span className="text-[10px] text-slate-500 font-medium mr-1">min</span>

                            <button
                                onClick={handleConfirmSession}
                                aria-label="Confirmar sessão"
                                className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
                            >
                                <CheckCircle2 size={12} />
                            </button>
                            <button
                                onClick={handleCancel}
                                aria-label="Cancelar sessão"
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

                {/* Context Menu */}
                {contextMenu && (
                    <SkillContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        skill={skill}
                        onClose={() => setContextMenu(null)}
                        onToggleDistribution={() => onToggleDistribution?.(skill.id)}
                        onViewDailyPlan={() => onViewDailyPlan?.(skill)}
                        onViewHistory={() => setShowHistory(true)}
                    />
                )}
            </div>

            {/* Session History Modal */}
            {showHistory && (
                <SessionHistoryModal
                    skill={skill}
                    onClose={() => setShowHistory(false)}
                    onDeleteLog={handleDeleteLog}
                />
            )}
        </>
    );
});

SkillCard.displayName = 'SkillCard';

