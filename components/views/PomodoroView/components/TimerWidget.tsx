import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Square, Maximize2, Minimize2, Maximize, Minimize, SkipForward, Brain, Coffee, Settings, Volume2, VolumeX, CheckCircle2, Circle, Dumbbell, Minus, Plus, FolderOpen, X, AlertTriangle, GraduationCap, ChevronDown, ChevronRight, Sparkles, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { usePomodoroTimer, TimerMode } from '../hooks/usePomodoroTimer';
import { useRestStore } from '../../../../stores';
import { useSkillsStore } from '../../../../stores/skillsStore';
import { RestActivity, Skill, SkillRoadmapItem } from '../../../../types';
import { getRestActivitySeriesStats } from '../../../../utils/restActivityUtils';
import { getSkillRoadmapIndex } from '../lib/skillRoadmapIndex';
import {
  getRestActivityIdFromSelection,
  QUICK_BREAK_OPTIONS,
  createQuickBreakSelection,
  createRestBreakSelection,
  resolveBreakSelectionLabel,
  splitRestActivitiesByDate,
} from '../lib/breakOptions';

type BreakPickerTab = 'today' | 'otherDays' | 'quick';

interface TimerControlsProps {
  isActive: boolean;
  isAlertCountdown: boolean;
  onReset: () => void;
  onToggle: () => void;
  onSkip: () => void;
  variant?: 'expanded' | 'fullscreen';
}

const TimerControls = React.memo(function TimerControls({
  isActive,
  isAlertCountdown,
  onReset,
  onToggle,
  onSkip,
  variant = 'expanded',
}: TimerControlsProps) {
  const isFullscreen = variant === 'fullscreen';
  const sideButtonClass = isFullscreen
    ? 'w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white'
    : 'w-12 h-12 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] flex items-center justify-center transition-colors text-[var(--color-text-muted)]';
  const mainButtonClass = isFullscreen
    ? 'w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-2xl shadow-[var(--color-primary)]/30'
    : 'w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[var(--color-primary)]/20';

  return (
    <div className="flex justify-center items-center space-x-6">
      <button
        onClick={onReset}
        disabled={isAlertCountdown}
        className={cn(
          sideButtonClass,
          isAlertCountdown && "opacity-45 cursor-not-allowed hover:bg-transparent"
        )}
        title="Reiniciar"
      >
        <Square className={isFullscreen ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4"} />
      </button>
      <button
        onClick={onToggle}
        disabled={isAlertCountdown}
        className={cn(
          mainButtonClass,
          isAlertCountdown && "opacity-45 cursor-not-allowed hover:scale-100"
        )}
      >
        {isActive ? (
          <Pause className={isFullscreen ? "w-8 h-8 sm:w-10 sm:h-10" : "w-6 h-6"} />
        ) : (
          <Play className={isFullscreen ? "w-8 h-8 sm:w-10 sm:h-10 ml-1.5 sm:ml-2" : "w-6 h-6 ml-1"} />
        )}
      </button>
      <button
        onClick={onSkip}
        disabled={isAlertCountdown}
        className={cn(
          sideButtonClass,
          isAlertCountdown && "opacity-45 cursor-not-allowed hover:bg-transparent"
        )}
        title="Pular fase"
      >
        <SkipForward className={isFullscreen ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4"} />
      </button>
    </div>
  );
});

export function TimerWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBreakPickerOpen, setIsBreakPickerOpen] = useState(false);
  const [breakPickerTab, setBreakPickerTab] = useState<BreakPickerTab>('today');
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [taskPickerProjectFilter, setTaskPickerProjectFilter] = useState<string>('inbox');
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [skillTaskDrafts, setSkillTaskDrafts] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'tasks' | 'breaks'>('tasks');
  const [mobileView, setMobileView] = useState<'timer' | 'panel'>('timer');
  
  const activeTaskId = useStore((state) => state.activeTaskId);
  const tasks = useStore((state) => state.tasks);
  const projects = useStore((state) => state.projects);
  const setActiveTaskId = useStore((state) => state.setActiveTaskId);
  const setSettingsOpen = useStore((state) => state.setSettingsOpen);
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const shortBreakSelection = useStore((state) => state.shortBreakSelection);
  const longBreakSelection = useStore((state) => state.longBreakSelection);
  const breakExerciseStats = useStore((state) => state.breakExerciseStats);
  const setBreakSelection = useStore((state) => state.setBreakSelection);
  const clearBreakSelection = useStore((state) => state.clearBreakSelection);
  const setBreakExerciseReps = useStore((state) => state.setBreakExerciseReps);
  const updateTask = useStore((state) => state.updateTask);
  const toggleTask = useStore((state) => state.toggleTask);
  const addTask = useStore((state) => state.addTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const timerState = useStore((state) => state.timerState);
  const setTimerState = useStore((state) => state.setTimerState);

  const [newDailyTaskTitle, setNewDailyTaskTitle] = useState('');

  const handleCreateDailyQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDailyTaskTitle.trim()) return;

    addTask({
      title: newDailyTaskTitle.trim(),
      completed: false,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      isDailyQuickTask: true,
    });
    setNewDailyTaskTitle('');
  };

  const renderDailyTasksSection = (variant: 'expanded' | 'compact') => {
    const dailyQuickTasks = tasks.filter(t => t.isDailyQuickTask);

    return (
      <div className="space-y-4">
        {/* Form to Add Daily Task */}
        <form onSubmit={handleCreateDailyQuickTask} className="flex gap-2">
          <input
            type="text"
            placeholder="Nova tarefa diária (ex: comer comida)..."
            value={newDailyTaskTitle}
            onChange={(e) => setNewDailyTaskTitle(e.target.value)}
            className="flex-1 bg-slate-950/40 border border-slate-800/85 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors"
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-white px-3 py-2 text-xs font-semibold transition-colors"
          >
            Adicionar
          </button>
        </form>

        {/* Current Active Task Card */}
        {activeTask && (
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Trabalhando em</p>
                <h4 className="text-xs font-semibold text-white leading-tight truncate">{activeTask.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskId(null)}
                className="rounded-lg bg-slate-900/60 border border-slate-800 px-2 py-1 text-[9px] font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Limpar Foco
              </button>
            </div>
          </div>
        )}

        {/* Daily Tasks List */}
        <div className={cn(
          "space-y-2 overflow-y-auto pr-1 custom-scrollbar",
          variant === 'compact' ? "max-h-[140px]" : "max-h-[220px]"
        )}>
          {dailyQuickTasks.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800/60 rounded-xl bg-slate-950/10">
              <p className="text-[11px] text-[var(--color-text-muted)]">Nenhuma tarefa diária adicionada.</p>
            </div>
          ) : (
            dailyQuickTasks.map((task) => {
              const isActive = task.id === activeTaskId;
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    if (isActive) {
                      setActiveTaskId(null);
                    } else {
                      setActiveTaskId(task.id);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer",
                    isActive
                      ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10"
                      : "border-slate-800/60 bg-slate-900/20 hover:border-slate-700/60 hover:bg-slate-900/40"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                      ) : (
                        <Circle className="w-4.5 h-4.5" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "text-xs font-medium truncate",
                        task.completed ? "line-through text-slate-500" : "text-slate-200",
                        isActive && "font-semibold text-white"
                      )}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && (
                      <span className="text-[9px] uppercase tracking-wider bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-1.5 py-0.5 rounded font-semibold">
                        Ativa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                      title="Excluir tarefa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Picker Button */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setIsTaskPickerOpen(true)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 py-2 px-3 text-xs font-semibold text-slate-300 transition-colors"
          >
            Selecionar do Cronograma/Projetos
          </button>
        </div>
      </div>
    );
  };

  const restActivities = useRestStore((state) => state.activities);
  const toggleRestActivityComplete = useRestStore((state) => state.toggleActivityComplete);
  const skills = useSkillsStore((s) => s.skills);
  const addLog = useSkillsStore((s) => s.addLog);
  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    
    if (activeTaskId.startsWith('skill-focus:')) {
      const skillId = activeTaskId.replace('skill-focus:', '');
      const skill = skills.find(s => s.id === skillId);
      return {
        id: activeTaskId,
        title: skill ? `Estudar ${skill.name}` : 'Estudar Habilidade',
        completed: false,
        skillId,
        subtasks: []
      };
    }
    
    const standardTask = tasks.find(t => t.id === activeTaskId);
    if (standardTask) return standardTask;
    
    const roadmapEntry = getSkillRoadmapIndex(skills).get(activeTaskId);
    if (roadmapEntry) {
      return {
        id: roadmapEntry.item.id,
        title: roadmapEntry.item.title,
        completed: roadmapEntry.item.isCompleted,
        skillId: roadmapEntry.skillId,
        subtasks: []
      };
    }

    return null;
  }, [activeTaskId, tasks, skills]);
  const todayStr = new Date().toISOString().split('T')[0];

  const taskPickerProjects = useMemo(() => {
    const inboxCount = tasks.filter((task) => !task.completed && !task.projectId && !task.skillId).length;

    const projectList = [
      {
        id: 'inbox',
        label: 'Caixa de entrada',
        color: '#64748b',
        count: inboxCount,
      },
      ...projects.map((project) => ({
        id: project.id,
        label: project.name,
        color: project.color,
        count: tasks.filter((task) => !task.completed && task.projectId === project.id).length,
      })),
    ];

    const activeSkillsWithTasks = skills.filter(s => !s.isCompleted);
    const skillList = activeSkillsWithTasks.map(skill => ({
      id: `skill:${skill.id}`,
      label: `🎓 ${skill.name}`,
      color: '#10b981',
      count: tasks.filter((task) => !task.completed && task.skillId === skill.id).length,
    }));

    return [...projectList, ...skillList];
  }, [projects, tasks, skills]);

  const taskPickerItems = useMemo(() => {
    const isSkillFilter = taskPickerProjectFilter.startsWith('skill:');
    const filtered = tasks.filter((task) => {
      if (isSkillFilter) {
        const skillId = taskPickerProjectFilter.replace('skill:', '');
        return task.skillId === skillId;
      }
      return taskPickerProjectFilter === 'inbox'
        ? (!task.projectId && !task.skillId)
        : task.projectId === taskPickerProjectFilter;
    });

    return [...filtered].sort((left, right) => {
      if (left.completed !== right.completed) {
        return left.completed ? 1 : -1;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [taskPickerProjectFilter, tasks]);

  const {
    isActive,
    minutes,
    seconds,
    progress,
    mode,
    toggleTimer,
    resetTimer,
    setMode,
    skipPhase,
    timeLeft
  } = usePomodoroTimer();

  const alertStep = useMemo(() => {
    if (mode === 'alert') {
      return (typeof window !== 'undefined' ? localStorage.getItem('alert-timer-step') : 'countdown') || 'countdown';
    }
    return null;
  }, [timerState, mode]);

  const isAlertCountdown = mode === 'alert' && alertStep === 'countdown';

  const handleCompleteAlertSteps = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('alert-timer-step', 'breathing');
    }
    const duration = 300; // 5 minutes
    setTimerState({
      mode: 'alert',
      status: 'RUNNING',
      timeLeft: duration,
      endTime: Date.now() + duration * 1000,
      sessionCount: timerState.sessionCount,
    });
  };

  const getBreathingInstruction = (timeLeft: number) => {
    const cycle = (300 - timeLeft) % 10;
    if (cycle < 4) return { text: 'Inspire', action: 'inhale' };
    if (cycle < 6) return { text: 'Segure', action: 'hold' };
    return { text: 'Expire', action: 'exhale' };
  };

  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  useEffect(() => {
    if (isBreakMode) {
      setActiveTab('breaks');
    } else {
      setActiveTab('tasks');
    }
  }, [isBreakMode]);
  const currentBreakMode = mode === 'shortBreak' || mode === 'longBreak' ? mode : null;
  const activeBreakSelection = mode === 'shortBreak'
    ? shortBreakSelection
    : mode === 'longBreak'
      ? longBreakSelection
      : null;

  const selectedBreakLabel = useMemo(
    () => resolveBreakSelectionLabel(activeBreakSelection, restActivities),
    [activeBreakSelection, restActivities],
  );

  const selectedRestActivityId = useMemo(
    () => getRestActivityIdFromSelection(activeBreakSelection),
    [activeBreakSelection],
  );

  const selectedRestActivity = useMemo(
    () => selectedRestActivityId
      ? restActivities.find((activity) => activity.id === selectedRestActivityId) || null
      : null,
    [restActivities, selectedRestActivityId],
  );

  const seriesStats = useMemo(
    () => selectedRestActivity ? getRestActivitySeriesStats(selectedRestActivity) : null,
    [selectedRestActivity]
  );


  const { today: todayRestActivities, otherDays: otherDayRestActivities } = useMemo(
    () => splitRestActivitiesByDate(restActivities, new Date()),
    [restActivities],
  );

  const quickOptionsForCurrentMode = useMemo(
    () => QUICK_BREAK_OPTIONS.filter((option) => option.recommendedFor === 'both' || option.recommendedFor === mode),
    [mode],
  );

  const quickExerciseOptions = useMemo(
    () => quickOptionsForCurrentMode.filter((option) => option.kind === 'exercise'),
    [quickOptionsForCurrentMode],
  );

  const quickGeneralOptions = useMemo(
    () => quickOptionsForCurrentMode.filter((option) => option.kind !== 'exercise'),
    [quickOptionsForCurrentMode],
  );

  const selectedQuickOption = useMemo(
    () => activeBreakSelection?.source === 'QUICK_OPTION'
      ? quickOptionsForCurrentMode.find((option) => option.id === activeBreakSelection.key) ?? null
      : null,
    [activeBreakSelection, quickOptionsForCurrentMode],
  );

  const selectedQuickExerciseOption = selectedQuickOption?.kind === 'exercise' ? selectedQuickOption : null;
  const selectedQuickExerciseStats = selectedQuickExerciseOption
    ? breakExerciseStats[selectedQuickExerciseOption.id] ?? null
    : null;

  const [exerciseRepsDraft, setExerciseRepsDraft] = useState(0);

  useEffect(() => {
    if (!isBreakMode) {
      setIsBreakPickerOpen(false);
      setBreakPickerTab('today');
    }
  }, [isBreakMode]);

  useEffect(() => {
    if (isBreakMode) {
      setIsTaskPickerOpen(false);
    }
  }, [isBreakMode]);

  useEffect(() => {
    if (!isTaskPickerOpen) return;

    const currentTask = tasks.find((task) => task.id === activeTaskId);
    setTaskPickerProjectFilter(currentTask?.projectId ?? 'inbox');
  }, [activeTaskId, isTaskPickerOpen, tasks]);

  useEffect(() => {
    if (!selectedQuickExerciseOption) {
      setExerciseRepsDraft(0);
      return;
    }

    setExerciseRepsDraft(
      breakExerciseStats[selectedQuickExerciseOption.id]?.reps ?? selectedQuickExerciseOption.defaultReps ?? 0,
    );
  }, [breakExerciseStats, selectedQuickExerciseOption]);

  const handleSelectRestBreak = (activity: RestActivity) => {
    if (!currentBreakMode) return;
    setBreakSelection(currentBreakMode, createRestBreakSelection(activity));
    setIsBreakPickerOpen(false);
  };

  const handleSelectQuickBreak = (optionId: string) => {
    if (!currentBreakMode) return;
    const option = QUICK_BREAK_OPTIONS.find((candidate) => candidate.id === optionId);
    if (!option) return;

    setBreakSelection(currentBreakMode, createQuickBreakSelection(option));

    if (option.kind === 'exercise') {
      setBreakPickerTab('quick');
      setIsBreakPickerOpen(true);
      setExerciseRepsDraft(
        breakExerciseStats[option.id]?.reps ?? option.defaultReps ?? 0,
      );
      return;
    }

    setIsBreakPickerOpen(false);
  };

  const handleClearBreakSelection = () => {
    if (!currentBreakMode) return;
    clearBreakSelection(currentBreakMode);
  };

  const handleSaveExerciseReps = () => {
    if (!selectedQuickExerciseOption) return;

    const reps = Math.max(0, Math.round(exerciseRepsDraft));
    if (reps <= 0) return;

    setBreakExerciseReps(selectedQuickExerciseOption.id, reps);
    setIsBreakPickerOpen(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!activeTask) return;
    updateTask(activeTask.id, {
      subtasks: activeTask.subtasks?.map(st => {
        if (st.id !== subtaskId) return st;

        const isCompletedToday = st.completed && st.lastCompletedDate === todayStr;
        return {
          ...st,
          completed: !isCompletedToday,
          lastCompletedDate: !isCompletedToday ? todayStr : null,
        };
      })
    });
  };

  const [justCompleted, setJustCompleted] = useState(false);

  const handleSelectFocusTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setIsTaskPickerOpen(false);
  };

  const handleClearActiveTask = () => {
    setActiveTaskId(null);
    setIsTaskPickerOpen(false);
  };

  const handleMarkSelectedRestAsCompleted = () => {
    if (!selectedRestActivity || selectedRestActivity.isCompleted) return;
    toggleRestActivityComplete(selectedRestActivity.id);

    setJustCompleted(true);
    setTimeout(() => {
      setJustCompleted(false);
    }, 2000);
  };

  const getOtherDayMetaLabel = (activity: RestActivity): string => {
    if (activity.type === 'DAILY') return 'Diário';
    if (activity.type === 'WEEKLY') return 'Semanal';
    if (activity.specificDate) {
      return new Date(`${activity.specificDate}T00:00:00`).toLocaleDateString('pt-BR');
    }
    return 'Outro dia';
  };

  const renderTabSelector = () => {
    if (!isBreakMode) return null;

    const tabs = [
      { id: 'tasks' as const, label: 'Foco', icon: Brain },
      { id: 'breaks' as const, label: 'Descanso', icon: Coffee },
    ];

    return (
      <div className="flex bg-slate-950/40 p-1 rounded-xl border border-slate-800/80 mb-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/10"
                  : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderActiveTaskSubtasks = (variant: 'expanded' | 'fullscreen') => {
    if (!activeTask || !activeTask.subtasks || activeTask.subtasks.length === 0) return null;
    
    return (
      <div className={cn("w-full mx-auto text-left relative", variant === 'fullscreen' ? "max-w-2xl mb-12" : "mb-6")}>
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent rounded-2xl -z-10" />
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 p-4 backdrop-blur-sm">
          <p className={cn(
            "font-semibold text-[var(--color-primary)] mb-3 flex items-center justify-between",
            variant === 'fullscreen' ? "text-lg" : "text-sm"
          )}>
            <span>Subtarefas de Foco</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[var(--color-primary)]/10 rounded-full">
              Dever Cumprido
            </span>
          </p>
          <div className={cn("space-y-1.5 overflow-y-auto pr-2 custom-scrollbar", variant === 'fullscreen' ? "max-h-[220px]" : "max-h-[140px]")}>
            {activeTask.subtasks.map(subtask => {
              const isChecked = subtask.completed && subtask.lastCompletedDate === todayStr;
              return (
                <div 
                  key={subtask.id} 
                  className={cn(
                    "group flex items-center p-2.5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
                    isChecked 
                      ? "bg-green-500/5 border-green-500/20" 
                      : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30 shadow-sm hover:shadow-md"
                  )}
                  onClick={() => handleToggleSubtask(subtask.id)}
                >
                  <button 
                    className={cn(
                      "mr-3 transition-colors duration-300 z-10", 
                      isChecked ? "text-green-500" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]"
                    )}
                  >
                    {isChecked ? <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className={cn(
                    "flex-1 min-w-0 transition-all duration-300 z-10",
                    isChecked ? "text-green-500/70" : "text-[var(--color-text)]",
                    isChecked ? "translate-x-1" : ""
                  )}>
                    <span className={cn(
                      "block font-medium",
                      variant === 'fullscreen' ? "text-base" : "text-sm",
                      isChecked ? "line-through decoration-green-500/40" : ""
                    )}>
                      {subtask.title}
                    </span>
                    {subtask.description && (
                      <span className={cn(
                        "mt-1 block leading-relaxed text-[var(--color-text-muted)]",
                        variant === 'fullscreen' ? "text-sm" : "text-xs",
                        isChecked ? "line-through decoration-green-500/40" : ""
                      )}>
                        {subtask.description}
                      </span>
                    )}
                  </div>
                  {/* Subtle success flash background */}
                  <AnimatePresence>
                    {isChecked && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-green-500 flex items-center justify-center rounded-xl origin-left"
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSkillsPanel = (variant: 'expanded' | 'fullscreen') => {
    const activeSkills = skills.filter(s => !s.isCompleted);

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

    interface SectionGroup {
      sectionItem: SkillRoadmapItem | null;
      items: SkillRoadmapItem[];
    }

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
      setCollapsedSections(prev => ({
        ...prev,
        [sectionId]: !prev[sectionId]
      }));
    };

    return (
      <div className={cn(
        "w-full mx-auto animate-in fade-in duration-300",
        variant === 'fullscreen' ? "max-w-4xl mb-12" : "mb-6"
      )}>
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/40 p-4 sm:p-5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-500/10">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap size={18} className="animate-pulse text-emerald-400" /> Habilidades de Estudo
            </h3>
            <button
              onClick={() => {
                setIsSkillsOpen(false);
                setMobileView('timer');
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
            <div className={cn(
              "grid gap-4",
              variant === 'fullscreen' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
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
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", 
                          levelColors[skill.level] || 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        )}>
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
                      <div className={cn(
                        "space-y-3 my-3 overflow-y-auto pr-1 scrollbar-thin text-left transition-all duration-300",
                        variant === 'fullscreen' ? "max-h-[450px]" : "max-h-[260px]"
                      )}>
                        {skill.roadmap && skill.roadmap.length > 0 ? (
                          (() => {
                            const groups = getSectionedRoadmap(skill.roadmap);
                            const firstUncompletedGroupIdx = groups.findIndex(g => !isGroupCompleted(g));
                            return groups.map((group, idx) => {
                              const sectionId = group.sectionItem?.id || `${skill.id}-no-section-${idx}`;
                              
                              const hasActiveTask = activeTaskId ? group.items.some(item => {
                                if (item.id === activeTaskId) return true;
                                if (item.subTasks) {
                                  return item.subTasks.some(sub => sub.id === activeTaskId);
                                }
                                return false;
                              }) : false;
                              
                              const isCompleted = isGroupCompleted(group);
                              const defaultCollapse = isCompleted || (!hasActiveTask && idx !== firstUncompletedGroupIdx);
                              
                              const isCollapsed = group.sectionItem 
                                ? (collapsedSections[sectionId] !== undefined ? collapsedSections[sectionId] : defaultCollapse)
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
                                        {isCollapsed ? (
                                          <ChevronRight size={12} />
                                        ) : (
                                          <ChevronDown size={12} />
                                        )}
                                      </span>
                                    </button>
                                  )}

                                  {!isCollapsed && (
                                    <div className="space-y-1.5 pl-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                      {group.items.length === 0 ? (
                                        <p className="text-[10px] text-slate-600 italic pl-2 py-1">Sem tarefas nesta seção.</p>
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
                                                      isItemCompleted ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400"
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
                                                      isItemCompleted ? "text-slate-500 line-through" : "text-slate-300 hover:text-white",
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
                                                              isSubCompleted ? "text-emerald-400" : "text-slate-650 hover:text-emerald-400"
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
                                                              isSubCompleted ? "text-slate-500 line-through" : "text-slate-400 hover:text-white",
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
                            
                            const firstUncompletedItem = getFirstUncompletedRoadmapItem(skill.roadmap);
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
  };

  const renderBreakPickerSection = (variant: 'expanded' | 'fullscreen') => {
    if (!isBreakMode) return null;

    return (
      <div className={cn('w-full', variant === 'fullscreen' ? 'max-w-2xl mb-10' : 'mb-6')}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Descanso escolhido</p>
          <div className="mt-1 flex items-center justify-between">
            <p className={cn('font-medium truncate', variant === 'fullscreen' ? 'text-2xl' : 'text-sm')}>
              {selectedBreakLabel || 'Nenhum descanso selecionado'}
            </p>
            {seriesStats?.hasSeries && (
              <span className={cn(
                "ml-2 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                seriesStats.completed === seriesStats.total
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
                variant === 'fullscreen' ? "text-sm" : "text-[10px]"
              )}>
                {seriesStats.completed} / {seriesStats.total} séries
              </span>
            )}
          </div>

          {selectedQuickExerciseOption && (
            <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)]">
              <Dumbbell className="h-3.5 w-3.5 text-[var(--color-primary)]" />
              <span>
                {selectedQuickExerciseStats
                  ? `Último salvo: ${selectedQuickExerciseStats.reps} reps`
                  : `Sugestão inicial: ${selectedQuickExerciseOption.defaultReps ?? 10} reps`}
              </span>
              {selectedQuickExerciseStats?.updatedAt && (
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]/70">
                  às{' '}
                  {new Date(selectedQuickExerciseStats.updatedAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsBreakPickerOpen((open) => !open)}
              className="rounded-lg bg-[var(--color-primary)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/30"
            >
              {isBreakPickerOpen ? 'Fechar seletor' : 'Escolher descanso'}
            </button>
            {activeBreakSelection && (
              <button
                type="button"
                onClick={handleClearBreakSelection}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              >
                Limpar
              </button>
            )}
            {selectedRestActivity && (
              <button
                type="button"
                onClick={handleMarkSelectedRestAsCompleted}
                disabled={selectedRestActivity.isCompleted || justCompleted}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5',
                  (selectedRestActivity.isCompleted || justCompleted)
                    ? 'cursor-not-allowed border-[var(--color-border)] text-green-400 bg-green-500/10 opacity-100'
                    : 'border-[var(--color-primary)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10',
                )}
              >
                {(selectedRestActivity.isCompleted || justCompleted) ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {justCompleted ? 'Concluído!' : 'Já concluído'}
                  </>
                ) : seriesStats?.hasSeries ? (
                  `Marcar série (${seriesStats.completed + 1}/${seriesStats.total}) como concluída`
                ) : (
                  'Marcar como concluído no descanso'
                )}
              </button>
            )}
          </div>

          <AnimatePresence>
            {isBreakPickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.16 }}
                className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBreakPickerTab('today')}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                      breakPickerTab === 'today'
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
                    )}
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakPickerTab('otherDays')}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                      breakPickerTab === 'otherDays'
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
                    )}
                  >
                    Outros dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakPickerTab('quick')}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                      breakPickerTab === 'quick'
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
                    )}
                  >
                    Sugestões rápidas
                  </button>
                </div>

                <div className={cn('space-y-2 overflow-y-auto pr-1', variant === 'fullscreen' ? 'max-h-64' : 'max-h-40')}>
                  {breakPickerTab === 'today' && (
                    <>
                      {todayRestActivities.length === 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">Nenhum descanso pendente para hoje.</p>
                      )}
                      {todayRestActivities.map((activity) => (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => handleSelectRestBreak(activity)}
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10"
                        >
                          {activity.title}
                        </button>
                      ))}
                    </>
                  )}

                  {breakPickerTab === 'otherDays' && (
                    <>
                      {otherDayRestActivities.length === 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">Nenhum descanso de outros dias disponível.</p>
                      )}
                      {otherDayRestActivities.map((activity) => (
                        <button
                          key={activity.id}
                          type="button"
                          onClick={() => handleSelectRestBreak(activity)}
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10"
                        >
                          <span className="block">{activity.title}</span>
                          <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                            {getOtherDayMetaLabel(activity)}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {breakPickerTab === 'quick' && (
                    <div className="space-y-4">
                      {quickExerciseOptions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                              Movimento
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]/70">
                              Salva reps
                            </p>
                          </div>

                          {quickExerciseOptions.map((option) => {
                            const isSelected = activeBreakSelection?.source === 'QUICK_OPTION'
                              && activeBreakSelection.key === option.id;
                            const savedStat = breakExerciseStats[option.id];
                            const inputId = `quick-exercise-reps-${option.id}`;

                            return (
                              <div
                                key={option.id}
                                className={cn(
                                  'rounded-xl border bg-[var(--color-surface-hover)]/35 transition-all',
                                  isSelected
                                    ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/8 shadow-[0_0_0_1px_rgba(139,92,246,0.18)]'
                                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/6',
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleSelectQuickBreak(option.id)}
                                  className="w-full rounded-xl px-3 py-2.5 text-left"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <span className="block text-sm font-medium text-[var(--color-text)]">
                                        {option.label}
                                      </span>
                                      <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                                        {option.description}
                                      </span>
                                    </div>

                                    <span className={cn(
                                      'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                                      option.kind === 'exercise'
                                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
                                    )}>
                                      {option.kind === 'exercise' ? (
                                        <>
                                          <Dumbbell className="h-3 w-3" />
                                          Reps
                                        </>
                                      ) : (
                                        'Leve'
                                      )}
                                    </span>
                                  </div>

                                  {option.kind === 'exercise' && savedStat && (
                                    <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                                      Último registro: {savedStat.reps} reps
                                    </p>
                                  )}
                                </button>

                                {option.kind === 'exercise' && isSelected && (
                                  <div className="border-t border-[var(--color-border)] px-3 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <label
                                          htmlFor={inputId}
                                          className="block text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                                        >
                                          Quantas reps você fez?
                                        </label>
                                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                          Ajuste o número e salve para reutilizar depois.
                                        </p>
                                      </div>
                                      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                                        {savedStat ? `Salvo: ${savedStat.reps}` : 'Ainda não salvo'}
                                      </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-[44px_minmax(0,1fr)_44px] gap-2">
                                      <button
                                        type="button"
                                        aria-label="Diminuir reps"
                                        onClick={() => setExerciseRepsDraft((current) => Math.max(0, current - 1))}
                                        className="flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text)]"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>

                                      <input
                                        id={inputId}
                                        type="number"
                                        min={0}
                                        inputMode="numeric"
                                        value={exerciseRepsDraft}
                                        onChange={(event) => setExerciseRepsDraft(Math.max(0, Number(event.target.value) || 0))}
                                        className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-center text-lg font-semibold tabular-nums text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-primary)]"
                                      />

                                      <button
                                        type="button"
                                        aria-label="Aumentar reps"
                                        onClick={() => setExerciseRepsDraft((current) => current + 1)}
                                        className="flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text)]"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                      <p className="text-[11px] text-[var(--color-text-muted)]">
                                        O valor salvo fica disponível na próxima vez que você selecionar este descanso.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={handleSaveExerciseReps}
                                        disabled={exerciseRepsDraft <= 0}
                                        className={cn(
                                          'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                                          exerciseRepsDraft > 0
                                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25'
                                            : 'cursor-not-allowed bg-[var(--color-surface)] text-[var(--color-text-muted)] opacity-60',
                                        )}
                                      >
                                        Salvar reps
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {quickGeneralOptions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                            Recuperação leve
                          </p>
                          {quickGeneralOptions.map((option) => {
                            const isSelected = activeBreakSelection?.source === 'QUICK_OPTION'
                              && activeBreakSelection.key === option.id;

                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelectQuickBreak(option.id)}
                                className={cn(
                                  'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                                  isSelected
                                    ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10'
                                    : 'border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 hover:border-[var(--color-primary)]/35 hover:bg-[var(--color-primary)]/8',
                                )}
                              >
                                <span className="block">{option.label}</span>
                                <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                                  {option.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderTaskPickerModal = () => {
    if (!isTaskPickerOpen) return null;

    return (
      <AnimatePresence>
        <motion.div
          key="task-picker-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-sm"
          onClick={() => setIsTaskPickerOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Foco do timer</p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--color-text)]">Selecionar tarefa de foco</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskPickerOpen(false)}
                className="rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                aria-label="Fechar seletor de tarefa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {taskPickerProjects.map((project) => {
                  const isActive = project.id === taskPickerProjectFilter;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setTaskPickerProjectFilter(project.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                        isActive
                          ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text)]',
                      )}
                    >
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)]',
                        )}
                      />
                      <span>{project.label}</span>
                      <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-muted)]">
                        {project.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[52vh] overflow-y-auto px-4 py-3">
              {taskPickerItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-[var(--color-text-muted)]">
                  <FolderOpen className="mx-auto mb-2 h-5 w-5" />
                  <p>Nenhuma tarefa encontrada neste projeto.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {taskPickerItems.map((task) => {
                    const isSelected = task.id === activeTaskId;

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleSelectFocusTask(task.id)}
                        disabled={task.completed}
                        className={cn(
                          'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                          task.completed
                            ? 'cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 opacity-60'
                            : isSelected
                              ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10'
                              : 'border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/8',
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--color-text)]">{task.title}</p>
                            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                              {task.completed ? 'Concluída' : 'Clique para focar nesta tarefa'}
                            </p>
                          </div>
                          {isSelected && !task.completed && (
                            <span className="rounded-full bg-[var(--color-primary)]/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                              Ativa
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
              {activeTaskId && (
                <button
                  type="button"
                  onClick={handleClearActiveTask}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
                >
                  Limpar seleção atual
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsTaskPickerOpen(false)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      setActiveTaskId(taskId);
      setIsExpanded(true); // Auto expand when a task is dropped
    }
  };

  const modes: { id: TimerMode; label: string; icon: React.ElementType }[] = [
    { id: 'pomodoro', label: 'Foco', icon: Brain },
    { id: 'shortBreak', label: 'Pausa Curta', icon: Coffee },
    { id: 'longBreak', label: 'Pausa Longa', icon: Coffee },
    { id: 'alert', label: 'Alerta', icon: AlertTriangle },
  ];

  return (
    <>
      <motion.div 
        layout
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "fixed z-[100] transition-all duration-500",
          isFullscreen 
            ? "inset-0 w-full h-full rounded-none bg-[var(--color-bg)] flex flex-col items-center justify-center overflow-hidden"
            : cn(
                "bottom-8 left-1/2 -translate-x-1/2 bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)]",
                isExpanded 
                  ? "w-[calc(100%-2rem)] sm:w-[380px] p-4 sm:p-6 max-h-[85vh] overflow-y-auto scrollbar-thin" 
                  : "w-auto px-4 py-3 flex items-center space-x-4 overflow-hidden",
                isDragOver && "ring-2 ring-[var(--color-primary)] scale-105"
              )
        )}
        style={!isFullscreen ? {
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
        } : {}}
      >
        {isFullscreen ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center w-full h-full relative px-4 sm:px-8 py-8 overflow-y-auto scrollbar-thin"
          >
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex space-x-2 sm:space-x-4 z-50">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen(true);
                }}
                className="p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors text-[var(--color-text-muted)] hover:text-white"
                title="Configurações"
              >
                <Settings className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors text-[var(--color-text-muted)] hover:text-white"
                title="Minimizar"
              >
                <Minimize className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </div>

            {/* Mobile View Toggle Segment (Timer vs Painel) */}
            <div className="flex lg:hidden bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 mb-2 w-60 mx-auto z-40 mt-12">
              <button
                type="button"
                onClick={() => setMobileView('timer')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
                  mobileView === 'timer'
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Timer
              </button>
              <button
                type="button"
                onClick={() => setMobileView('panel')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
                  mobileView === 'panel'
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Painel
              </button>
            </div>

            {/* Layout Side-by-Side (Duas Colunas) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl px-4 sm:px-8 mt-4 lg:mt-12 items-center flex-1 w-full">
              
              {/* Coluna Esquerda: Timer, Modos, Controles e Instruções de Alerta (7/12 cols) */}
              <div className={cn(
                "lg:col-span-7 flex flex-col items-center justify-center text-center space-y-8 w-full",
                mobileView !== 'timer' && "hidden lg:flex"
              )}>
                {/* Mode Selector */}
                <div className="flex flex-wrap justify-center gap-1.5 bg-white/5 p-1.5 rounded-xl backdrop-blur-sm max-w-full">
                  {modes.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        disabled={isAlertCountdown}
                        onClick={() => setMode(m.id)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center whitespace-nowrap",
                          mode === m.id 
                            ? "bg-[var(--color-primary)] text-white shadow-lg" 
                            : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5",
                          isAlertCountdown && "opacity-44 cursor-not-allowed"
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {m.label}
                      </button>
                    );
                  })}
                  
                  {/* GraduationCap (Skills) Toggle Button in Fullscreen Mode Selector */}
                  <button
                    disabled={isAlertCountdown}
                    onClick={() => {
                      setIsSkillsOpen((prev) => {
                        const next = !prev;
                        if (next) {
                          setMobileView('panel');
                        }
                        return next;
                      });
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center whitespace-nowrap border border-transparent",
                      isSkillsOpen 
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg font-semibold" 
                        : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5",
                      isAlertCountdown && "opacity-44 cursor-not-allowed"
                    )}
                    title="Habilidades de Estudo"
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Habilidades
                  </button>
                </div>

                {/* Countdown Time & Mode Information */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-[6rem] sm:text-[8rem] md:text-[10rem] font-light tracking-tight font-mono leading-none text-[var(--color-primary)] drop-shadow-[0_0_40px_var(--color-primary)]">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </div>
                  
                  <div className="mt-4 max-w-md">
                    {mode === 'alert' ? (
                      alertStep === 'breathing' ? (
                        <p className="text-lg text-emerald-400 font-bold tracking-widest uppercase animate-pulse">Respiração</p>
                      ) : (
                        <p className="text-lg text-amber-400 font-bold tracking-widest uppercase animate-pulse">Modo Alerta Ativo</p>
                      )
                    ) : isBreakMode ? (
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Pausa em andamento</p>
                        <p className="text-xl font-medium text-white truncate max-w-xs sm:max-w-md mx-auto">
                          {selectedBreakLabel || 'Escolha um descanso para esta pausa'}
                        </p>
                      </div>
                    ) : activeTask ? (
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Trabalhando em</p>
                        <p className="text-xl font-medium text-white truncate max-w-xs sm:max-w-md mx-auto">{activeTask.title}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Foco Livre</p>
                        <p className="text-md text-[var(--color-text-muted)]">Nenhuma tarefa selecionada</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alert steps Breathing / Checklist UI (Only rendered if mode === 'alert') */}
                {mode === 'alert' && (
                  <div className="w-full max-w-md animate-in fade-in duration-300">
                    {alertStep === 'breathing' ? (
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-slate-350 mb-4 max-w-xs">
                          Siga o ritmo do círculo. Respire fundo e relaxe.
                        </p>
                        <div className="relative flex items-center justify-center w-40 h-40">
                          <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 rounded-full bg-emerald-500/20"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute w-28 h-28 rounded-full bg-emerald-500/25"
                          />
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-20 h-20 rounded-full bg-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/25"
                          >
                            <span className="text-white font-bold text-xs select-none">
                              {getBreathingInstruction(timeLeft).text}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left mb-4 backdrop-blur-sm w-full">
                          <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2.5 text-slate-200">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">1</span>
                              <span>Levante-se da cadeira imediatamente</span>
                            </li>
                            <li className="flex items-center gap-2.5 text-slate-200">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">2</span>
                              <span>Faça polichinelos para ativar a circulação</span>
                            </li>
                            <li className="flex items-center gap-2.5 text-slate-200">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs">3</span>
                              <span>Desligue ou afaste o seu telefone</span>
                            </li>
                          </ul>
                        </div>
                        <button
                          onClick={handleCompleteAlertSteps}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
                        >
                          Já Fiz os Passos!
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Left Column Button for Task Picker */}
                {!isBreakMode && mode !== 'alert' && (
                  <button
                    type="button"
                    onClick={() => setIsTaskPickerOpen(true)}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 px-5 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10"
                  >
                    Selecionar ou limpar tarefa
                  </button>
                )}

                <TimerControls
                  isActive={isActive}
                  isAlertCountdown={isAlertCountdown}
                  onReset={resetTimer}
                  onToggle={toggleTimer}
                  onSkip={skipPhase}
                  variant="fullscreen"
                />
              </div>

              {/* Coluna Direita: Sidebar Tabbed Panel (5/12 cols) */}
              <div className={cn(
                "lg:col-span-5 w-full flex flex-col justify-stretch mt-6 lg:mt-0",
                mobileView !== 'panel' && "hidden lg:flex"
              )}>
                <div className={cn(
                  "bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md flex flex-col overflow-hidden shadow-2xl transition-all duration-300",
                  isSkillsOpen 
                    ? "h-[75vh] lg:h-[64vh] min-h-[480px] max-h-[720px]" 
                    : "h-[50vh] lg:h-[58vh] min-h-[380px] max-h-[520px]"
                )}>
                  {isSkillsOpen ? (
                    <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar text-left">
                      {renderSkillsPanel('expanded')}
                    </div>
                  ) : (
                    <>
                      {/* Tab Selector inside Sidebar */}
                      {renderTabSelector()}

                      {/* Scrollable Tab Content Area */}
                      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar text-left">
                        {activeTab === 'tasks' && (
                          <div className="space-y-4">
                            {renderDailyTasksSection('expanded')}
                            {renderActiveTaskSubtasks('expanded')}
                          </div>
                        )}

                        {activeTab === 'breaks' && renderBreakPickerSection('expanded')}
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        ) : !isExpanded ? (
          <>
            {/* Compact View */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[var(--color-border)]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="text-[var(--color-primary)] transition-all duration-1000 ease-linear"
                  strokeDasharray={`${progress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-xs font-mono font-medium">{minutes}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleTimer}
                disabled={isAlertCountdown}
                className={cn(
                  "w-8 h-8 rounded-full bg-[var(--color-surface-hover)] hover:bg-[var(--color-primary)] hover:text-white flex items-center justify-center transition-colors",
                  isAlertCountdown && "opacity-45 cursor-not-allowed"
                )}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <button 
                onClick={() => setIsExpanded(true)}
                title="Expandir timer"
                aria-label="Expandir timer"
                className="w-8 h-8 rounded-full hover:bg-[var(--color-surface-hover)] flex items-center justify-center transition-colors text-[var(--color-text-muted)]"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Expanded View */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-0.5 sm:gap-1">
                {modes.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      disabled={isAlertCountdown}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "p-1 sm:p-1.5 rounded-md transition-colors",
                        mode === m.id 
                          ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" 
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]",
                        isAlertCountdown && "opacity-40 cursor-not-allowed"
                      )}
                      title={m.label}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  );
                })}
                
                {/* GraduationCap (Skills) Button in Expanded View Header */}
                <button
                  disabled={isAlertCountdown}
                  onClick={() => setIsSkillsOpen((prev) => !prev)}
                  className={cn(
                    "p-1 sm:p-1.5 rounded-md transition-colors border border-transparent sm:ml-1",
                    isSkillsOpen 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg font-semibold" 
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-white",
                    isAlertCountdown && "opacity-40 cursor-not-allowed"
                  )}
                  title="Habilidades de Estudo"
                >
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={() => {
                    if (settings.volume > 0) {
                      updateSettings({ previousVolume: settings.volume, volume: 0 });
                    } else {
                      updateSettings({ volume: settings.previousVolume || 50 });
                    }
                  }}
                  className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                  title={settings.volume > 0 ? "Mute" : "Unmute"}
                >
                  {settings.volume > 0 ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
                <button 
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(true);
                  }}
                  className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                  title="Configurações"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                  title="Tela Cheia"
                >
                  <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                  title="Minimizar"
                >
                  <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
            
            {mode === 'alert' ? (
              <div className="flex flex-col items-center justify-center mb-6 text-center w-full">
                <div className="text-6xl font-light tracking-tight font-mono mb-4">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                {alertStep === 'breathing' ? (
                  <div className="flex flex-col items-center justify-center w-full text-center">
                    <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold mb-2">Respiração</p>
                    <div className="relative flex items-center justify-center w-28 h-28 mx-auto my-2">
                      <motion.div
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                          duration: 10,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-emerald-500/20"
                      />
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 10,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute w-20 h-20 rounded-full bg-emerald-500/40 flex items-center justify-center shadow-md shadow-emerald-500/20"
                      >
                        <span className="text-white font-bold text-sm select-none">
                          {getBreathingInstruction(timeLeft).text}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full text-center">
                    <p className="text-xs text-amber-400 uppercase tracking-widest font-bold mb-1 animate-pulse">Modo Alerta</p>
                    <p className="text-xs text-slate-300 max-w-[240px] mb-3">
                      Levante-se, faça polichinelos e desligue o telefone!
                    </p>
                    <button
                                onClick={handleCompleteAlertSteps}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      Já Fiz os Passos!
                    </button>
                  </div>
                )}
              </div>
            ) : isSkillsOpen ? (
              <div className="max-h-[380px] overflow-y-auto pr-1 mb-6 custom-scrollbar text-left">
                {renderSkillsPanel('expanded')}
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center mb-4 text-center">
                  <div className="text-6xl font-light tracking-tight font-mono mb-2">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
                    {isBreakMode ? (mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa') : 'Foco'}
                  </p>
                </div>

                {renderTabSelector()}

                <div className="max-h-[280px] overflow-y-auto pr-1 mb-6 custom-scrollbar text-left">
                  {activeTab === 'tasks' && (
                    <div className="space-y-4">
                      {renderDailyTasksSection('compact')}
                      {renderActiveTaskSubtasks('expanded')}
                    </div>
                  )}

                  {activeTab === 'breaks' && renderBreakPickerSection('expanded')}
                </div>
              </>
            )}

            <TimerControls
              isActive={isActive}
              isAlertCountdown={isAlertCountdown}
              onReset={resetTimer}
              onToggle={toggleTimer}
              onSkip={skipPhase}
            />
          </>
        )}
      </motion.div>

      {renderTaskPickerModal()}
    </>
  );
}
