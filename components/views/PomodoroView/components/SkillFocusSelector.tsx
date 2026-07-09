import React, { useState } from 'react';
import {
  GraduationCap,
  X,
  Circle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSkillsStore } from '../../../../stores/skillsStore';
import { useStore } from '../store/useStore';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { useActiveTask } from '../hooks/useActiveTask';
import type { SkillRoadmapItem } from '../../../../types';

export interface SkillFocusSelectorProps {
  variant: 'expanded' | 'fullscreen';
  setIsSkillsOpen: (isOpen: boolean) => void;
  setMobileView?: (view: 'timer' | 'panel') => void;
}

interface SectionGroup {
  sectionItem: SkillRoadmapItem | null;
  items: SkillRoadmapItem[];
}

export const SkillFocusSelector = React.memo(function SkillFocusSelector({
  variant,
  setIsSkillsOpen,
  setMobileView
}: SkillFocusSelectorProps) {
  const skills = useSkillsStore((s) => s.skills);
  const addLog = useSkillsStore((s) => s.addLog);
  
  const activeTaskId = useStore((state) => state.activeTaskId);
  const setActiveTaskId = useStore((state) => state.setActiveTaskId);

  const { toggleTimer, isActive } = usePomodoroTimer();
  const activeTask = useActiveTask();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const activeSkills = skills.filter((s) => !s.isCompleted);
  const isFullscreen = variant === 'fullscreen';

  const getFirstUncompletedRoadmapItem = (items: SkillRoadmapItem[]): SkillRoadmapItem | null => {
    for (const item of items) {
      if (item.type !== 'SECTION' && !item.isCompleted) {
        return item;
      }
      if (item.subTasks) {
        const found = getFirstUncompletedRoadmapItem(item.subTasks);
        if (found) return found;
      }
    }
    return null;
  };

  const getSectionedRoadmap = (roadmap: SkillRoadmapItem[]): SectionGroup[] => {
    const groups: SectionGroup[] = [];
    let currentGroup: SectionGroup = { sectionItem: null, items: [] };

    for (const item of roadmap) {
      if (item.type === 'SECTION') {
        if (currentGroup.sectionItem !== null || currentGroup.items.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = { sectionItem: item, items: [] };
      } else {
        currentGroup.items.push(item);
      }
    }
    if (currentGroup.sectionItem !== null || currentGroup.items.length > 0) {
      groups.push(currentGroup);
    }
    return groups;
  };

  const isGroupCompleted = (group: SectionGroup): boolean => {
    if (group.items.length === 0) return false;
    const checkItemComplete = (item: SkillRoadmapItem): boolean => {
      if (item.type !== 'SECTION' && !item.isCompleted) return false;
      if (item.subTasks) {
        for (const sub of item.subTasks) {
          if (!checkItemComplete(sub)) return false;
        }
      }
      return true;
    };
    return group.items.every(checkItemComplete);
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div
      className={cn(
        "w-full mx-auto animate-in fade-in duration-300",
        variant === 'fullscreen' ? "max-w-4xl mb-12" : "mb-6"
      )}
    >
      <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/40 p-4 sm:p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-500/10">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap size={18} className="animate-pulse text-emerald-400" /> Habilidades de Estudo
          </h3>
          <button
            onClick={() => {
              setIsSkillsOpen(false);
              if (setMobileView) setMobileView('timer');
            }}
            className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {activeSkills.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            Nenhuma habilidade ativa. Crie habilidades na aba Habilidades!
          </p>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              variant === 'fullscreen' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {(isFullscreen ? activeSkills : activeSkills.slice(0, 3)).map((skill) => {
              const percentage = Math.min(100, Math.round((skill.currentMinutes / (skill.goalMinutes || 1)) * 100));
              const hours = (skill.currentMinutes / 60).toFixed(1);
              const goalHours = (skill.goalMinutes / 60).toFixed(0);
              const levelColors: Record<string, string> = {
                'Iniciante': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                'Intermediário': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                'Avançado': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
              };

              const isSkillInFocus = activeTask?.skillId === skill.id;

              return (
                <div
                  key={skill.id}
                  className={cn(
                    "group bg-slate-900/60 border rounded-2xl p-4 transition-all duration-300 shadow-md relative overflow-hidden flex flex-col justify-between",
                    isSkillInFocus
                      ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-slate-900/80"
                      : "border-slate-800 hover:border-emerald-500/20 hover:bg-slate-900/70"
                  )}
                >
                  {/* Glowing effect for active focus */}
                  {isSkillInFocus && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10" />
                  )}

                  <div>
                    {/* Skill Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          levelColors[skill.level] || 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        )}
                      >
                        {skill.level}
                      </span>

                      {isSkillInFocus ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Em Foco
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-500">{percentage}%</span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 leading-tight group-hover:text-emerald-300 transition-colors">
                      {skill.name}
                    </h4>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Linked Tasks List (from Roadmap) */}
                    <div
                      className={cn(
                        "space-y-3 my-3 overflow-y-auto pr-1 scrollbar-thin text-left transition-all duration-300",
                        variant === 'fullscreen' ? "max-h-[450px]" : "max-h-[260px]"
                      )}
                    >
                      {skill.roadmap && skill.roadmap.length > 0 ? (
                        (() => {
                          const groups = getSectionedRoadmap(skill.roadmap);
                          const firstUncompletedGroupIdx = groups.findIndex((g) => !isGroupCompleted(g));
                          return groups.map((group, idx) => {
                            const sectionId = group.sectionItem?.id || `${skill.id}-no-section-${idx}`;

                            const hasActiveTask = activeTaskId
                              ? group.items.some((item) => {
                                  if (item.id === activeTaskId) return true;
                                  if (item.subTasks) {
                                    return item.subTasks.some((sub) => sub.id === activeTaskId);
                                  }
                                  return false;
                                })
                              : false;

                            const isCompleted = isGroupCompleted(group);
                            const defaultCollapse =
                              isCompleted || (!hasActiveTask && idx !== firstUncompletedGroupIdx);

                            const isCollapsed = group.sectionItem
                              ? collapsedSections[sectionId] !== undefined
                                ? collapsedSections[sectionId]
                                : defaultCollapse
                              : false;

                            return (
                              <div key={sectionId} className="space-y-1">
                                {group.sectionItem && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSectionCollapse(sectionId)}
                                    className="w-full flex items-center justify-between pt-2 pb-1 first:pt-0 border-b border-slate-800/40 mb-1.5 hover:text-slate-350 text-left transition-colors group/sec"
                                  >
                                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase group-hover/sec:text-slate-400">
                                      {group.sectionItem.title}
                                    </span>
                                    <span className="text-slate-600 group-hover/sec:text-slate-400 transition-colors">
                                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                    </span>
                                  </button>
                                )}

                                {!isCollapsed && (
                                  <div className="space-y-1.5 pl-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    {group.items.length === 0 ? (
                                      <p className="text-[10px] text-slate-600 italic pl-2 py-1">
                                        Sem tarefas nesta seção.
                                      </p>
                                    ) : (
                                      group.items.map((item) => {
                                        const isItemFocused = activeTaskId === item.id;
                                        const isItemCompleted = item.isCompleted;

                                        return (
                                          <div key={item.id} className="space-y-1">
                                            {/* Task Item */}
                                            <div
                                              className={cn(
                                                "flex items-center justify-between p-1.5 rounded-lg transition-colors group/task border",
                                                isItemFocused
                                                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                                                  : "bg-slate-950/30 hover:bg-slate-950/60 border-slate-800/40 hover:border-slate-700/50"
                                              )}
                                            >
                                              <div className="flex items-center min-w-0 flex-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    useSkillsStore.getState().toggleRoadmapItem(skill.id, item.id);
                                                  }}
                                                  className={cn(
                                                    "mr-2 transition-colors shrink-0",
                                                    isItemCompleted
                                                      ? "text-emerald-400"
                                                      : "text-slate-500 hover:text-emerald-400"
                                                  )}
                                                  title={isItemCompleted ? "Desmarcar tarefa" : "Concluir tarefa"}
                                                >
                                                  {isItemCompleted ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                  ) : (
                                                    <Circle className="w-3.5 h-3.5" />
                                                  )}
                                                </button>
                                                <span
                                                  onClick={() => {
                                                    if (isItemFocused) {
                                                      toggleTimer();
                                                    } else {
                                                      setActiveTaskId(item.id);
                                                      if (!isActive) toggleTimer();
                                                    }
                                                  }}
                                                  className={cn(
                                                    "text-xs truncate cursor-pointer transition-colors",
                                                    isItemCompleted
                                                      ? "text-slate-500 line-through"
                                                      : "text-slate-300 hover:text-white",
                                                    isItemFocused && "font-bold text-emerald-400"
                                                  )}
                                                  title="Focar nesta tarefa"
                                                >
                                                  {item.title}
                                                </span>
                                              </div>
                                              {isItemFocused && (
                                                <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2 animate-pulse">
                                                  🍅
                                                </span>
                                              )}
                                            </div>

                                            {/* Nested Subtasks */}
                                            {item.subTasks && item.subTasks.length > 0 && (
                                              <div className="pl-3 border-l border-slate-800/60 space-y-1 ml-2">
                                                {item.subTasks.map((sub) => {
                                                  const isSubFocused = activeTaskId === sub.id;
                                                  const isSubCompleted = sub.isCompleted;

                                                  return (
                                                    <div
                                                      key={sub.id}
                                                      className={cn(
                                                        "flex items-center justify-between p-1 rounded-md transition-colors group/subtask border border-transparent",
                                                        isSubFocused
                                                          ? "bg-emerald-500/5 border-emerald-500/20"
                                                          : "bg-slate-950/15 hover:bg-slate-950/40 hover:border-slate-800/30"
                                                      )}
                                                    >
                                                      <div className="flex items-center min-w-0 flex-1">
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            useSkillsStore.getState().toggleRoadmapItem(skill.id, sub.id);
                                                          }}
                                                          className={cn(
                                                            "mr-1.5 transition-colors shrink-0",
                                                            isSubCompleted
                                                              ? "text-emerald-400"
                                                              : "text-slate-650 hover:text-emerald-400"
                                                          )}
                                                          title={isSubCompleted ? "Desmarcar subtarefa" : "Concluir subtarefa"}
                                                        >
                                                          {isSubCompleted ? (
                                                            <CheckCircle2 className="w-3 h-3" />
                                                          ) : (
                                                            <Circle className="w-3 h-3" />
                                                          )}
                                                        </button>
                                                        <span
                                                          onClick={() => {
                                                            if (isSubFocused) {
                                                              toggleTimer();
                                                            } else {
                                                              setActiveTaskId(sub.id);
                                                              if (!isActive) toggleTimer();
                                                            }
                                                          }}
                                                          className={cn(
                                                            "text-[11px] truncate cursor-pointer transition-colors",
                                                            isSubCompleted
                                                              ? "text-slate-500 line-through"
                                                              : "text-slate-400 hover:text-white",
                                                            isSubFocused && "font-bold text-emerald-400"
                                                          )}
                                                          title="Focar nesta subtarefa"
                                                        >
                                                          {sub.title}
                                                        </span>
                                                      </div>
                                                      {isSubFocused && (
                                                        <span className="text-[9px] text-emerald-400 font-mono shrink-0 ml-1.5 animate-pulse">
                                                          🍅
                                                        </span>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()
                      ) : (
                        <p className="text-[11px] text-slate-500 text-center py-4">
                          Nenhuma tarefa no roadmap desta habilidade.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-[10px] text-slate-500">
                      <span className="text-slate-300 font-mono text-xs font-semibold">{hours}</span>
                      <span> / {goalHours}h</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Manual Log Session */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addLog(skill.id, {
                            id: crypto.randomUUID(),
                            date: new Date().toISOString().split('T')[0],
                            minutes: 30,
                          });
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] font-medium transition-all"
                        title="Lançar +30 minutos manual"
                      >
                        +30m
                      </button>

                      {/* Focus & Start Pomodoro */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          const firstUncompletedItem = getFirstUncompletedRoadmapItem(skill.roadmap ?? []);
                          if (firstUncompletedItem) {
                            setActiveTaskId(firstUncompletedItem.id);
                          } else {
                            setActiveTaskId(`skill-focus:${skill.id}`);
                          }

                          if (!isActive) {
                            toggleTimer();
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1 active:scale-95 shadow-md",
                          isSkillInFocus
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                            : "bg-slate-700 hover:bg-emerald-600 text-white"
                        )}
                      >
                        <Play size={10} fill="currentColor" />
                        <span>{isSkillInFocus ? 'Timer Ativo' : 'Focar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
