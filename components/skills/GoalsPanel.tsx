import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle2, ChevronDown, Flame, Pencil, Plus, Target, Trash2, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Skill, SkillGoal } from '../../types';
import { useSkillsStore } from '../../stores/skillsStore';
import { THEME_VARIANTS, ThemeKey } from './constants';

// Gradient stops per theme (progress bar + glow)
const THEME_GRADIENTS: Record<ThemeKey, string> = {
    emerald: 'from-emerald-600 to-emerald-400',
    blue: 'from-blue-600 to-blue-400',
    purple: 'from-purple-600 to-purple-400',
    amber: 'from-amber-600 to-amber-400',
    rose: 'from-rose-600 to-rose-400',
};

/** A few celebratory bursts from the bottom of the screen */
const fireLevelUpConfetti = () => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.8 } });
    window.setTimeout(() => {
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.85, x: 0.3 }, scalar: 0.8 });
    }, 180);
    window.setTimeout(() => {
        confetti({ particleCount: 60, spread: 100, origin: { y: 0.85, x: 0.7 }, scalar: 0.8 });
    }, 360);
};

interface GoalsPanelProps {
    skill: Skill;
}

/**
 * Metas & Pontos - goals with XP/level progression for a single skill.
 * Completing a goal grants its points to totalXp and +1 level (store mechanic).
 */
export const GoalsPanel: React.FC<GoalsPanelProps> = ({ skill }) => {
    const { addGoal, updateGoal, toggleGoalComplete, deleteGoal } = useSkillsStore();

    const theme = (skill.colorTheme as ThemeKey) || 'emerald';
    const variants = THEME_VARIANTS[theme];
    const gradient = THEME_GRADIENTS[theme] || THEME_GRADIENTS.emerald;

    // Always fall back - older skills may not have the goals system fields
    const goals = skill.goals ?? [];
    const totalXp = skill.totalXp ?? 0;
    const level = skill.levelNumber ?? 1;

    const pendingGoals = useMemo(() => goals.filter(g => g.status === 'pending'), [goals]);
    const completedGoals = useMemo(
        () => goals.filter(g => g.status === 'completed').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
        [goals]
    );

    const total = goals.length;
    const completedCount = completedGoals.length;
    const progress = total === 0 ? 0 : Math.round((completedCount / total) * 100);

    // Add-goal form state
    const [title, setTitle] = useState('');
    const [points, setPoints] = useState('100');
    const [description, setDescription] = useState('');

    // Inline edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editPoints, setEditPoints] = useState('100');
    const [editDescription, setEditDescription] = useState('');

    // Completed section collapsible
    const [showCompleted, setShowCompleted] = useState(true);

    // Level-up celebration
    const [showLevelUp, setShowLevelUp] = useState(false);
    const prevLevelRef = useRef(level);
    const hideTimerRef = useRef<number | null>(null);

    // Reset tracked level when switching skills (no false celebration)
    useEffect(() => {
        prevLevelRef.current = level;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skill.id]);

    // Detect pending -> completed transition by comparing the new level with the previous one
    useEffect(() => {
        if (level > prevLevelRef.current) {
            fireLevelUpConfetti();
            setShowLevelUp(true);
            if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = window.setTimeout(() => setShowLevelUp(false), 2500);
        }
        prevLevelRef.current = level;
    }, [level]);

    // Clear the auto-hide timer on unmount
    useEffect(() => {
        return () => {
            if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
        };
    }, []);

    const canSubmit = title.trim().length > 0;

    const handleAddGoal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        addGoal(skill.id, {
            title: title.trim(),
            description: description.trim() || undefined,
            points: Math.max(1, parseInt(points, 10) || 1),
        });
        setTitle('');
        setPoints('100');
        setDescription('');
    };

    const startEditing = (goal: SkillGoal) => {
        setEditingId(goal.id);
        setEditTitle(goal.title);
        setEditPoints(String(goal.points));
        setEditDescription(goal.description ?? '');
    };

    const saveEdit = () => {
        if (!editingId || !editTitle.trim()) return;
        updateGoal(skill.id, editingId, {
            title: editTitle.trim(),
            description: editDescription.trim() || undefined,
            points: Math.max(1, parseInt(editPoints, 10) || 1),
        });
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    const motivationalLine =
        total === 0
            ? 'Defina metas, ganhe XP e suba de nível nesta skill.'
            : pendingGoals.length > 0
                ? `Faltam ${pendingGoals.length} ${pendingGoals.length === 1 ? 'meta' : 'metas'} para subir de nível.`
                : 'Todas as metas concluídas — crie novas para continuar evoluindo.';

    return (
        <div className="relative bg-slate-800 rounded-2xl p-6 border border-slate-700 animate-in fade-in duration-300">
            {/* Level-up toast */}
            {showLevelUp && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap animate-in slide-in-from-top-3 fade-in duration-300">
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-900/50 border border-emerald-400/30">
                        🎉 Você subiu para o Nível {level}!
                    </div>
                </div>
            )}

            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
                <Target size={18} className={variants.text} />
                <h3 className="font-bold text-white">Metas & Pontos</h3>
            </div>

            {/* Level + XP header */}
            <div className={`relative overflow-hidden rounded-xl border ${variants.borderLight} ${variants.bgLight} p-4 mb-5`}>
                {/* Subtle theme glow */}
                <div className={`pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl`} />

                <div className="relative flex items-center gap-4">
                    <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border ${variants.borderLight} bg-slate-900/60 shadow-lg`}>
                        <Flame size={26} className={variants.text} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                            <span className="text-2xl font-black tracking-tight text-white">Nível {level}</span>
                            <span className={`flex items-center gap-1 text-base font-bold ${variants.text}`}>
                                <Zap size={14} fill="currentColor" />
                                {totalXp.toLocaleString('pt-BR')} XP
                            </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{motivationalLine}</p>
                    </div>
                </div>

                {/* Progress toward next level */}
                <div className="relative mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-[10px]">
                        <span className="font-semibold uppercase tracking-widest text-slate-500">
                            {completedCount}/{total} metas concluídas
                        </span>
                        <span className={`font-black ${variants.text}`}>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-900/70">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Add-goal form */}
            <form onSubmit={handleAddGoal} className="mb-6 space-y-2.5">
                <div className="flex gap-2.5">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ex.: Ler 20 páginas do livro de Python"
                        className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                    <div className="relative w-24 flex-shrink-0">
                        <input
                            type="number"
                            min={1}
                            value={points}
                            onChange={e => setPoints(e.target.value)}
                            aria-label="Pontos da meta"
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 py-2.5 pl-3 pr-9 text-sm font-bold text-white outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            XP
                        </span>
                    </div>
                </div>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Descrição (opcional)"
                    className="w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                />
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.99] ${variants.button} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                    <Plus size={16} />
                    Adicionar meta
                </button>
            </form>

            {total === 0 ? (
                /* Empty state */
                <div className="rounded-xl border-2 border-dashed border-slate-700 p-6 text-center">
                    <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${variants.borderLight} ${variants.bgLight}`}>
                        <Target size={20} className={variants.text} />
                    </div>
                    <p className="text-sm font-bold text-white">Defina sua primeira meta</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                        Crie metas com pontos de XP e conclua cada uma para ganhar pontos, subir de nível e acompanhar sua evolução nesta skill.
                    </p>
                </div>
            ) : (
                <>
                    {/* Pending goals */}
                    {pendingGoals.length > 0 && (
                        <ul className="space-y-2">
                            {pendingGoals.map(goal => (
                                <li key={goal.id} className="animate-in fade-in duration-300">
                                    {editingId === goal.id ? (
                                        <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-slate-900/60 p-3 animate-in fade-in duration-200">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                autoFocus
                                                placeholder="Título da meta"
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm font-bold text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                            />
                                            <textarea
                                                value={editDescription}
                                                onChange={e => setEditDescription(e.target.value)}
                                                rows={2}
                                                placeholder="Descrição (opcional)"
                                                className="w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                            />
                                            <div className="flex items-center gap-2.5">
                                                <div className="relative w-24 flex-shrink-0">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={editPoints}
                                                        onChange={e => setEditPoints(e.target.value)}
                                                        aria-label="Pontos da meta"
                                                        className="w-full rounded-lg border border-slate-600 bg-slate-900 py-2 pl-3 pr-9 text-sm font-bold text-white outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                                                    />
                                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                        XP
                                                    </span>
                                                </div>
                                                <div className="ml-auto flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-800"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={saveEdit}
                                                        disabled={!editTitle.trim()}
                                                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        <Check size={12} strokeWidth={3} />
                                                        Salvar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group flex items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-3 transition-colors hover:border-slate-600/80">
                                            <button
                                                onClick={() => toggleGoalComplete(skill.id, goal.id)}
                                                title="Concluir meta"
                                                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-slate-600 text-transparent transition-all hover:border-emerald-500/70 hover:bg-emerald-500/10"
                                            >
                                                <Check size={12} strokeWidth={3} />
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-white">{goal.title}</p>
                                                {goal.description && (
                                                    <p className="mt-0.5 text-xs text-slate-400">{goal.description}</p>
                                                )}
                                            </div>
                                            <span className={`mt-0.5 flex-shrink-0 rounded-full border ${variants.borderLight} ${variants.bgLight} px-2 py-0.5 text-[10px] font-black ${variants.text}`}>
                                                +{goal.points.toLocaleString('pt-BR')} XP
                                            </span>
                                            <div className="flex flex-shrink-0 items-center gap-0.5">
                                                <button
                                                    onClick={() => startEditing(goal)}
                                                    title="Editar meta"
                                                    className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-800 hover:text-emerald-400"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteGoal(skill.id, goal.id)}
                                                    title="Excluir meta"
                                                    className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-800 hover:text-red-400"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Completed goals (collapsible) */}
                    {completedGoals.length > 0 && (
                        <div className="mt-6 border-t border-slate-700/60 pt-4">
                            <button
                                onClick={() => setShowCompleted(v => !v)}
                                className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 transition-colors hover:bg-slate-900/50"
                            >
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 size={14} className={variants.text} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Concluídas</span>
                                    <span className={`rounded-full border ${variants.borderLight} ${variants.bgLight} px-1.5 py-px text-[9px] font-black ${variants.text}`}>
                                        {completedCount} {completedCount === 1 ? 'concluída' : 'concluídas'}
                                    </span>
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-500 transition-transform duration-300 ${showCompleted ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {showCompleted && (
                                <ul className="mt-2 space-y-1">
                                    {completedGoals.map(goal => (
                                        <li key={goal.id} className="group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-900/40">
                                            <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${variants.borderLight} ${variants.bgLight}`}>
                                                <Check size={12} strokeWidth={3} className={variants.text} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-500 line-through">{goal.title}</p>
                                                <p className="mt-0.5 text-[10px] text-slate-600">
                                                    Concluída em {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString('pt-BR') : '—'}
                                                </p>
                                            </div>
                                            <span className={`flex-shrink-0 text-[10px] font-bold opacity-70 ${variants.text}`}>
                                                +{goal.points.toLocaleString('pt-BR')} XP
                                            </span>
                                            <button
                                                onClick={() => deleteGoal(skill.id, goal.id)}
                                                title="Excluir meta"
                                                className="flex-shrink-0 rounded-lg p-1.5 text-slate-700 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GoalsPanel;
