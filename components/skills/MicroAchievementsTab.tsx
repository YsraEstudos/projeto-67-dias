import React, { useMemo } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { Skill, SkillRoadmapItem } from '../../types';
import { THEME_VARIANTS, ThemeKey } from './constants';

interface ProgressOverviewProps {
    skill: Skill;
    onUpdate: (updates: Partial<Skill>) => void;
}

const flattenTasks = (items: SkillRoadmapItem[]): SkillRoadmapItem[] =>
    items.reduce<SkillRoadmapItem[]>((tasks, item) => {
        if (item.type === 'SECTION') return tasks;
        return [...tasks, item, ...(item.subTasks ? flattenTasks(item.subTasks) : [])];
    }, []);

const circularProgress = (progress: number, target: number, colorClass: string) => (
    <div className="relative h-28 w-28 flex-shrink-0">
        <svg className="-rotate-90 h-28 w-28" viewBox="0 0 112 112" aria-hidden="true">
            <circle cx="56" cy="56" r="47" fill="none" stroke="currentColor" strokeWidth="9" className="text-slate-700/70" />
            <circle
                cx="56"
                cy="56"
                r="47"
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 47}
                strokeDashoffset={(2 * Math.PI * 47) * (1 - progress / 100)}
                className={progress >= target ? 'text-emerald-400' : colorClass}
            />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-2xl text-white">{progress}%</strong>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">concluído</span>
        </div>
    </div>
);

export const MicroAchievementsTab: React.FC<ProgressOverviewProps> = ({ skill, onUpdate }) => {
    const theme = (skill.colorTheme as ThemeKey) || 'emerald';
    const variants = THEME_VARIANTS[theme];
    const generalTarget = skill.roadmapProgressTarget ?? 100;

    const progress = useMemo(() => {
        const allTasks = flattenTasks(skill.roadmap);
        const completed = allTasks.filter(item => item.isCompleted).length;
        const general = allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0;

        const sections = skill.roadmap
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.type === 'SECTION')
            .map(({ item, index }, sectionPosition, allSections) => {
                const end = allSections[sectionPosition + 1]?.index ?? skill.roadmap.length;
                const tasks = flattenTasks(skill.roadmap.slice(index + 1, end));
                const sectionCompleted = tasks.filter(task => task.isCompleted).length;
                return {
                    item,
                    progress: tasks.length ? Math.round((sectionCompleted / tasks.length) * 100) : 0,
                    target: item.progressTarget ?? generalTarget,
                };
            });

        const currentSection = sections.find(section => section.progress < section.target) ?? sections.at(-1);
        return { general, completed, total: allTasks.length, currentSection };
    }, [skill.roadmap, generalTarget]);

    const saveGeneralTarget = (value: string) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return;
        onUpdate({ roadmapProgressTarget: Math.max(0, Math.min(100, Math.round(parsed))) });
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={18} className={variants.text} />
                <h3 className="font-bold text-white">Progresso da Skill</h3>
            </div>

            <div className="flex flex-col items-center text-center">
                {circularProgress(progress.general, generalTarget, variants.text)}
                <p className="mt-3 text-sm text-slate-300">{progress.completed} de {progress.total} tarefas concluídas</p>
                <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Target size={14} className={variants.text} />
                    Meta geral
                    <input
                        aria-label="Meta geral da skill"
                        type="number"
                        min="0"
                        max="100"
                        value={generalTarget}
                        onChange={(event) => saveGeneralTarget(event.target.value)}
                        className="w-16 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-center font-bold text-white outline-none focus:border-emerald-500"
                    />
                    %
                </label>
                <p className="mt-2 text-[11px] text-slate-500">Esta meta vira o padrão de todas as divisórias.</p>
            </div>

            <div className="mt-6 border-t border-slate-700/60 pt-5">
                {progress.currentSection ? (
                    <div className={`rounded-xl border p-4 ${variants.borderLight} ${variants.bgLight}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Seção atual</p>
                                <p className="mt-1 truncate text-sm font-bold text-white">{progress.currentSection.item.title}</p>
                                <p className="mt-1 text-xs text-slate-400">Meta: {progress.currentSection.target}%</p>
                            </div>
                            <div className={`text-2xl font-black ${progress.currentSection.progress >= progress.currentSection.target ? 'text-emerald-400' : variants.text}`}>
                                {progress.currentSection.progress}%
                            </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/70">
                            <div className={`h-full transition-all duration-500 ${variants.bg}`} style={{ width: `${progress.currentSection.progress}%` }} />
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-sm text-slate-500">Crie uma divisória para acompanhar a seção atual.</p>
                )}
            </div>
        </div>
    );
};

export default MicroAchievementsTab;
