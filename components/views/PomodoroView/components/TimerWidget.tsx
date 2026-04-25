import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Square, Maximize2, Minimize2, Maximize, Minimize, SkipForward, Brain, Coffee, Settings, Volume2, VolumeX, CheckCircle2, Circle, Dumbbell, Minus, Plus, FolderOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { usePomodoroTimer, TimerMode } from '../hooks/usePomodoroTimer';
import { useRestStore } from '../../../../stores';
import { RestActivity } from '../../../../types';
import { getRestActivitySeriesStats } from '../../../../utils/restActivityUtils';
import {
  getRestActivityIdFromSelection,
  QUICK_BREAK_OPTIONS,
  createQuickBreakSelection,
  createRestBreakSelection,
  resolveBreakSelectionLabel,
  splitRestActivitiesByDate,
} from '../lib/breakOptions';

type BreakPickerTab = 'today' | 'otherDays' | 'quick';

export function TimerWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isBreakPickerOpen, setIsBreakPickerOpen] = useState(false);
  const [breakPickerTab, setBreakPickerTab] = useState<BreakPickerTab>('today');
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [taskPickerProjectFilter, setTaskPickerProjectFilter] = useState<string>('inbox');
  
  const {
    activeTaskId,
    tasks,
    projects,
    setActiveTaskId,
    setSettingsOpen,
    settings,
    updateSettings,
    shortBreakSelection,
    longBreakSelection,
    breakExerciseStats,
    setBreakSelection,
    clearBreakSelection,
    setBreakExerciseReps,
    updateTask,
  } = useStore();

  const restActivities = useRestStore((state) => state.activities);
  const toggleRestActivityComplete = useRestStore((state) => state.toggleActivityComplete);
  const activeTask = tasks.find(t => t.id === activeTaskId);
  const todayStr = new Date().toISOString().split('T')[0];

  const taskPickerProjects = useMemo(() => {
    const inboxCount = tasks.filter((task) => !task.completed && !task.projectId).length;

    return [
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
  }, [projects, tasks]);

  const taskPickerItems = useMemo(() => {
    const filtered = tasks.filter((task) => (
      taskPickerProjectFilter === 'inbox'
        ? !task.projectId
        : task.projectId === taskPickerProjectFilter
    ));

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
    skipPhase
  } = usePomodoroTimer();

  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';
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

  const renderActiveTaskSubtasks = (variant: 'expanded' | 'fullscreen') => {
    if (!isBreakMode || !activeTask || !activeTask.subtasks || activeTask.subtasks.length === 0) return null;
    
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
          "fixed z-[100] transition-all duration-500 overflow-hidden",
          isFullscreen 
            ? "inset-0 w-full h-full rounded-none bg-[var(--color-bg)] flex flex-col items-center justify-center"
            : cn(
                "bottom-8 left-1/2 -translate-x-1/2 bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)]",
                isExpanded ? "w-80 p-6" : "w-auto px-4 py-3 flex items-center space-x-4",
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
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
              <div className="absolute top-8 right-8 flex space-x-4">
                <button 
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen(true);
                  }} 
                  className="p-3 hover:bg-white/10 rounded-full transition-colors text-[var(--color-text-muted)] hover:text-white"
                  title="Configurações"
                >
                  <Settings className="w-8 h-8" />
                </button>
              <button 
                onClick={() => setIsFullscreen(false)} 
                className="p-3 hover:bg-white/10 rounded-full transition-colors text-[var(--color-text-muted)] hover:text-white"
                title="Minimizar"
              >
                <Minimize className="w-8 h-8" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex space-x-2 mb-12 bg-white/5 p-1.5 rounded-xl backdrop-blur-sm">
              {modes.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center",
                      mode === m.id 
                        ? "bg-[var(--color-primary)] text-white shadow-lg" 
                        : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {renderBreakPickerSection('fullscreen')}

            <div className="flex w-full items-center justify-center space-x-10 mb-8 max-w-6xl px-12">
              <div className="flex-1 flex justify-end">
                {renderActiveTaskSubtasks('fullscreen')}
              </div>
              <div className="text-[10rem] md:text-[14rem] shrink-0 font-light tracking-tight font-mono leading-none text-[var(--color-primary)] drop-shadow-[0_0_40px_var(--color-primary)]">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="flex-1" />
            </div>

            {isBreakMode ? (
              <div className="text-center mb-16 max-w-3xl px-8">
                <p className="text-xl text-[var(--color-text-muted)] uppercase tracking-widest mb-4">Pausa em andamento</p>
                <p className="text-4xl md:text-5xl font-medium text-white">
                  {selectedBreakLabel || 'Escolha um descanso para esta pausa'}
                </p>
              </div>
            ) : activeTask ? (
              <div className="text-center mb-16 max-w-3xl px-8">
                <p className="text-xl text-[var(--color-text-muted)] uppercase tracking-widest mb-4">Trabalhando em</p>
                <p className="text-4xl md:text-5xl font-medium text-white">{activeTask.title}</p>
              </div>
            ) : (
              <div className="text-center mb-16">
                <p className="text-xl text-[var(--color-text-muted)] uppercase tracking-widest mb-4">Foco Livre</p>
                <p className="text-2xl text-[var(--color-text-muted)]">Nenhuma tarefa selecionada</p>
              </div>
            )}

            {!isBreakMode && (
              <button
                type="button"
                onClick={() => setIsTaskPickerOpen(true)}
                className="mb-12 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 px-5 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10"
              >
                Selecionar ou limpar tarefa
              </button>
            )}

            <div className="flex justify-center items-center space-x-8">
              <button 
                onClick={resetTimer} 
                className="w-16 h-16 rounded-full border-2 border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
                title="Reiniciar"
              >
                <Square className="w-6 h-6" />
              </button>
              <button 
                onClick={toggleTimer} 
                className="w-24 h-24 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-2xl shadow-[var(--color-primary)]/30"
              >
                {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-2" />}
              </button>
              <button 
                onClick={skipPhase} 
                className="w-16 h-16 rounded-full border-2 border-white/20 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
                title="Pular fase"
              >
                <SkipForward className="w-6 h-6" />
              </button>
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
                className="w-8 h-8 rounded-full bg-[var(--color-surface-hover)] hover:bg-[var(--color-primary)] hover:text-white flex items-center justify-center transition-colors"
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
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-1">
                {modes.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        mode === m.id 
                          ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" 
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                      )}
                      title={m.label}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <div className="flex space-x-2">
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
                  {settings.volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                  title="Tela Cheia"
                >
                  <Maximize className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
                  title="Minimizar"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center mb-8 text-center">
              <div className="text-6xl font-light tracking-tight font-mono mb-4">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              {isBreakMode ? (
                <>
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Pausa em andamento</p>
                  <p className="text-sm font-medium text-[var(--color-text)] truncate w-full px-4">
                    {selectedBreakLabel || 'Escolha um descanso para esta pausa'}
                  </p>
                </>
              ) : activeTask ? (
                <>
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Trabalhando em</p>
                  <p className="text-sm font-medium text-[var(--color-text)] truncate w-full px-4">{activeTask.title}</p>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">Foco Livre (Sem tarefa)</p>
              )}

              {!isBreakMode && (
                <button
                  type="button"
                  onClick={() => setIsTaskPickerOpen(true)}
                  className="mt-3 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/50 hover:text-[var(--color-text)]"
                >
                  Selecionar ou limpar tarefa
                </button>
              )}
            </div>

            {renderBreakPickerSection('expanded')}
            {renderActiveTaskSubtasks('expanded')}

            <div className="flex justify-center items-center space-x-6">
              <button 
                onClick={resetTimer}
                className="w-12 h-12 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] flex items-center justify-center transition-colors text-[var(--color-text-muted)]"
                title="Reiniciar"
              >
                <Square className="w-4 h-4" />
              </button>
              <button 
                onClick={toggleTimer}
                className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[var(--color-primary)]/20"
              >
                {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              <button 
                onClick={skipPhase}
                className="w-12 h-12 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] flex items-center justify-center transition-colors text-[var(--color-text-muted)]"
                title="Pular fase"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </motion.div>

      {renderTaskPickerModal()}
    </>
  );
}
