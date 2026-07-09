import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Play, Pause, Square, Maximize2, Minimize2, Maximize, Minimize, SkipForward, Brain, Coffee, Settings, Volume2, VolumeX, CheckCircle2, Circle, FolderOpen, X, AlertTriangle, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { usePomodoroTimer, TimerMode } from '../hooks/usePomodoroTimer';
import { useRestStore } from '../../../../stores';
import { useSkillsStore } from '../../../../stores/skillsStore';
import { RestActivity, Skill } from '../../../../types';
import { resolveBreakSelectionLabel } from '../lib/breakOptions';
import { useShallow } from 'zustand/react/shallow';

// Extracted Subcomponents & Hooks
import { TimerControls } from './TimerControls';
import { DailyTasksList } from './DailyTasksList';
import { BreakPicker } from './BreakPicker';
import { SkillFocusSelector } from './SkillFocusSelector';
import { useActiveTask } from '../hooks/useActiveTask';

type BreakPickerTab = 'today' | 'otherDays' | 'quick';


export function TimerWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [taskPickerProjectFilter, setTaskPickerProjectFilter] = useState<string>('inbox');
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [skillTaskDrafts, setSkillTaskDrafts] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'tasks' | 'breaks'>('tasks');
  const [mobileView, setMobileView] = useState<'timer' | 'panel'>('timer');
  
  const activeTaskId = useStore((state) => state.activeTaskId);
  const tasks = useStore(useShallow((state) => state.tasks));
  const projects = useStore(useShallow((state) => state.projects));
  const setActiveTaskId = useStore((state) => state.setActiveTaskId);
  const setSettingsOpen = useStore((state) => state.setSettingsOpen);
  const settings = useStore(useShallow((state) => state.settings));
  const updateSettings = useStore((state) => state.updateSettings);
  const shortBreakSelection = useStore(useShallow((state) => state.shortBreakSelection));
  const longBreakSelection = useStore(useShallow((state) => state.longBreakSelection));
  const updateTask = useStore((state) => state.updateTask);
  const timerState = useStore(useShallow((state) => state.timerState));
  const setTimerState = useStore((state) => state.setTimerState);

  const handleOpenTaskPicker = useCallback(() => {
    setIsTaskPickerOpen(true);
  }, []);

  const restActivities = useRestStore((state) => state.activities);
  const skills = useSkillsStore((s) => s.skills);
  const activeTask = useActiveTask();
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

  const isLightMode = settings.performanceMode === 'light';

  const alertStep = timerState.alertStep;

  const isAlertCountdown = timerState.mode === 'alert' && alertStep === 'countdown';

  const handleCompleteAlertSteps = () => {
    const duration = 300; // 5 minutes
    setTimerState({
      mode: 'alert',
      status: 'RUNNING',
      timeLeft: duration,
      endTime: Date.now() + duration * 1000,
      sessionCount: timerState.sessionCount,
      sessionStartTime: Date.now(),
      alertStep: 'breathing',
    });
  };

  const getBreathingInstruction = (timeLeft: number) => {
    const cycle = (300 - timeLeft) % 10;
    if (cycle < 4) return { text: 'Inspire', action: 'inhale' };
    if (cycle < 6) return { text: 'Segure', action: 'hold' };
    return { text: 'Expire', action: 'exhale' };
  };

  const isBreakMode = timerState.mode === 'shortBreak' || timerState.mode === 'longBreak';

  useEffect(() => {
    if (isBreakMode) {
      setActiveTab('breaks');
    } else {
      setActiveTab('tasks');
    }
  }, [isBreakMode]);
  const currentBreakMode = timerState.mode === 'shortBreak' || timerState.mode === 'longBreak' ? timerState.mode : null;
  const activeBreakSelection = timerState.mode === 'shortBreak'
    ? shortBreakSelection
    : timerState.mode === 'longBreak'
      ? longBreakSelection
      : null;

  const selectedBreakLabel = useMemo(
    () => resolveBreakSelectionLabel(activeBreakSelection, restActivities),
    [activeBreakSelection, restActivities],
  );





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



  const handleToggleSubtask = (subtaskId: string) => {
    if (!activeTask) return;
    updateTask(activeTask.id, {
      subtasks: activeTask.subtasks?.map(st => {
        if (st.id !== subtaskId) return st;

        const wasCompleted = st.completed;
        return {
          ...st,
          completed: !wasCompleted,
          lastCompletedDate: !wasCompleted ? todayStr : null,
        };
      })
    });
  };



  const handleSelectFocusTask = (taskId: string) => {
    setActiveTaskId(taskId);
    setIsTaskPickerOpen(false);
  };

  const handleClearActiveTask = () => {
    setActiveTaskId(null);
    setIsTaskPickerOpen(false);
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
    <MotionConfig reducedMotion={isLightMode ? "always" : "user"}>
      <motion.div 
        layout={isLightMode ? undefined : "position"}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "fixed z-[100] transition-all duration-500",
          isLightMode && "performance-light",
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
        style={(!isFullscreen && !isLightMode) ? {
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
        } : {}}
      >
        {isFullscreen ? (
          <motion.div 
            initial={isLightMode ? false : { opacity: 0 }} 
            animate={isLightMode ? false : { opacity: 1 }}
            className="flex flex-col items-center justify-center w-full h-full relative px-4 sm:px-8 py-8 overflow-y-auto scrollbar-thin"
          >
            {/* Absolute controls, modes bar and left column ticking display are all in FullscreenTimerDisplayAndControls! */}
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex space-x-2 sm:space-x-4 z-50">
              {/* These are rendered inside FullscreenTimerDisplayAndControls */}
            </div>

            {/* Mobile View Toggle Segment (Timer vs Painel) */}
            <div className="order-1 flex lg:hidden bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 mb-2 w-60 mx-auto z-40 mt-12">
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
                <FullscreenTimerDisplayAndControls
                  isLightMode={isLightMode}
                  isAlertCountdown={isAlertCountdown}
                  alertStep={alertStep}
                  handleCompleteAlertSteps={handleCompleteAlertSteps}
                  getBreathingInstruction={getBreathingInstruction}
                  isBreakMode={isBreakMode}
                  selectedBreakLabel={selectedBreakLabel}
                  activeTask={activeTask}
                  isSkillsOpen={isSkillsOpen}
                  setIsSkillsOpen={setIsSkillsOpen}
                  setMobileView={setMobileView}
                  setSettingsOpen={setSettingsOpen}
                  setIsFullscreen={setIsFullscreen}
                  setIsTaskPickerOpen={setIsTaskPickerOpen}
                  modes={modes}
                />
              </div>

              {/* Coluna Direita: Sidebar Tabbed Panel (5/12 cols) (Never ticks!) */}
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
                      <SkillFocusSelector variant="expanded" setIsSkillsOpen={setIsSkillsOpen} setMobileView={setMobileView} />
                    </div>
                  ) : (
                    <>
                      {/* Tab Selector inside Sidebar */}
                      {renderTabSelector()}

                      {/* Scrollable Tab Content Area */}
                      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar text-left">
                        {activeTab === 'tasks' && (
                          <div className="space-y-4">
                            <DailyTasksList variant="expanded" onOpenTaskPicker={handleOpenTaskPicker} />
                            {renderActiveTaskSubtasks('expanded')}
                          </div>
                        )}

                        {activeTab === 'breaks' && <BreakPicker variant="expanded" />}
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        ) : !isExpanded ? (
          <CompactTimerView
            isLightMode={isLightMode}
            isAlertCountdown={isAlertCountdown}
            setIsExpanded={setIsExpanded}
          />
        ) : (
          <div className="flex flex-col h-full w-full">
            <ExpandedTimerDisplayAndControls
              isLightMode={isLightMode}
              isAlertCountdown={isAlertCountdown}
              alertStep={alertStep}
              handleCompleteAlertSteps={handleCompleteAlertSteps}
              getBreathingInstruction={getBreathingInstruction}
              isBreakMode={isBreakMode}
              isSkillsOpen={isSkillsOpen}
              setIsSkillsOpen={setIsSkillsOpen}
              setSettingsOpen={setSettingsOpen}
              setIsFullscreen={setIsFullscreen}
              setIsExpanded={setIsExpanded}
              settings={settings}
              updateSettings={updateSettings}
              modes={modes}
            />

            {/* Panels rendered in the middle at order-3 (Never ticks!) */}
            <div className="order-3 max-h-[280px] overflow-y-auto pr-1 mb-6 custom-scrollbar text-left">
              {isSkillsOpen ? (
                <SkillFocusSelector variant="expanded" setIsSkillsOpen={setIsSkillsOpen} />
              ) : (
                <>
                  {renderTabSelector()}
                  <div className="space-y-4">
                    {activeTab === 'tasks' && (
                      <>
                        <DailyTasksList variant="compact" onOpenTaskPicker={handleOpenTaskPicker} />
                        {renderActiveTaskSubtasks('expanded')}
                      </>
                    )}
                    {activeTab === 'breaks' && <BreakPicker variant="expanded" />}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {renderTaskPickerModal()}
    </MotionConfig>
  );
}

interface CompactTimerViewProps {
  isLightMode: boolean;
  isAlertCountdown: boolean;
  setIsExpanded: (val: boolean) => void;
}

const CompactTimerView = React.memo(function CompactTimerView({
  isLightMode,
  isAlertCountdown,
  setIsExpanded,
}: CompactTimerViewProps) {
  const {
    isActive,
    minutes,
    progress,
    toggleTimer,
  } = usePomodoroTimer();

  return (
    <>
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
            className={cn(
              "text-[var(--color-primary)]",
              !isLightMode && "transition-all duration-1000 ease-linear"
            )}
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
  );
});

interface ExpandedTimerDisplayAndControlsProps {
  isLightMode: boolean;
  isAlertCountdown: boolean;
  alertStep: AlertStep | null;
  handleCompleteAlertSteps: () => void;
  getBreathingInstruction: (timeLeft: number) => { text: string; action: string };
  isBreakMode: boolean;
  isSkillsOpen: boolean;
  setIsSkillsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSettingsOpen: (val: boolean) => void;
  setIsFullscreen: (val: boolean) => void;
  setIsExpanded: (val: boolean) => void;
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  modes: { id: TimerMode; label: string; icon: React.ElementType }[];
}

const ExpandedTimerDisplayAndControls = React.memo(function ExpandedTimerDisplayAndControls({
  isLightMode,
  isAlertCountdown,
  alertStep,
  handleCompleteAlertSteps,
  getBreathingInstruction,
  isBreakMode,
  isSkillsOpen,
  setIsSkillsOpen,
  setSettingsOpen,
  setIsFullscreen,
  setIsExpanded,
  settings,
  updateSettings,
  modes,
}: ExpandedTimerDisplayAndControlsProps) {
  const {
    isActive,
    minutes,
    seconds,
    mode,
    timeLeft,
    toggleTimer,
    resetTimer,
    setMode,
    skipPhase,
  } = usePomodoroTimer();

  return (
    <>
      {/* Header Bar at order-1 */}
      <div className="order-1 flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
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
          
          <button
            type="button"
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
            type="button"
            onClick={() => {
              if (settings.volume > 0) {
                updateSettings({ previousVolume: settings.volume, volume: 0 });
              } else {
                updateSettings({ volume: settings.previousVolume || 30 });
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
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
            title="Tela Cheia"
          >
            <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-[var(--color-text-muted)] hover:text-white transition-colors p-1"
            title="Minimizar"
          >
            <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Display View at order-2 */}
      {mode === 'alert' ? (
        <div className="order-2 flex flex-col items-center justify-center mb-6 text-center w-full">
          <div className="text-6xl font-light tracking-tight font-mono mb-4">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          {alertStep === 'breathing' ? (
            <div className="flex flex-col items-center justify-center w-full text-center">
              <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold mb-2">Respiração</p>
              <div className="relative flex items-center justify-center w-28 h-28 mx-auto my-2">
                <motion.div
                  animate={isLightMode ? false : {
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
                  animate={isLightMode ? false : {
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
                type="button"
                onClick={handleCompleteAlertSteps}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-amber-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Já Fiz os Passos!
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="order-2 flex flex-col items-center justify-center mb-4 text-center">
          <div className="text-6xl font-light tracking-tight font-mono mb-2">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-semibold">
            {isBreakMode ? (mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa') : 'Foco'}
          </p>
        </div>
      )}

      {/* Controls View at order-4 */}
      <div className="order-4 mt-auto">
        <TimerControls
          isActive={isActive}
          isAlertCountdown={isAlertCountdown}
          onReset={resetTimer}
          onToggle={toggleTimer}
          onSkip={skipPhase}
        />
      </div>
    </>
  );
});

interface FullscreenTimerDisplayAndControlsProps {
  isLightMode: boolean;
  isAlertCountdown: boolean;
  alertStep: AlertStep | null;
  handleCompleteAlertSteps: () => void;
  getBreathingInstruction: (timeLeft: number) => { text: string; action: string };
  isBreakMode: boolean;
  selectedBreakLabel: string | null;
  activeTask: any;
  isSkillsOpen: boolean;
  setIsSkillsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMobileView: React.Dispatch<React.SetStateAction<'timer' | 'panel'>>;
  setSettingsOpen: (val: boolean) => void;
  setIsFullscreen: (val: boolean) => void;
  setIsTaskPickerOpen: (val: boolean) => void;
  modes: { id: TimerMode; label: string; icon: React.ElementType }[];
}

const FullscreenTimerDisplayAndControls = React.memo(function FullscreenTimerDisplayAndControls({
  isLightMode,
  isAlertCountdown,
  alertStep,
  handleCompleteAlertSteps,
  getBreathingInstruction,
  isBreakMode,
  selectedBreakLabel,
  activeTask,
  isSkillsOpen,
  setIsSkillsOpen,
  setMobileView,
  setSettingsOpen,
  setIsFullscreen,
  setIsTaskPickerOpen,
  modes,
}: FullscreenTimerDisplayAndControlsProps) {
  const {
    isActive,
    minutes,
    seconds,
    mode,
    timeLeft,
    toggleTimer,
    resetTimer,
    setMode,
    skipPhase,
  } = usePomodoroTimer();

  return (
    <>
      {/* Absolute top right settings & minimize buttons */}
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
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors text-[var(--color-text-muted)] hover:text-white"
          title="Minimizar"
        >
          <Minimize className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Mode selectors at order-1 */}
      <div className="order-1 flex flex-wrap justify-center gap-1.5 bg-white/5 p-1.5 rounded-xl backdrop-blur-sm max-w-full">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
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
        
        <button
          type="button"
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

      {/* Countdown Time & Mode Information at order-2 */}
      <div className="order-2 flex flex-col items-center justify-center">
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

      {mode === 'alert' && (
        <div className="order-3 w-full max-w-md animate-in fade-in duration-300">
          {alertStep === 'breathing' ? (
            <div className="flex flex-col items-center">
              <p className="text-sm text-slate-300 mb-4 max-w-xs">
                Siga o ritmo do círculo. Respire fundo e relaxe.
              </p>
              <div className="relative flex items-center justify-center w-40 h-40">
                <motion.div
                  animate={isLightMode ? false : { scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-emerald-500/20"
                />
                <motion.div
                  animate={isLightMode ? false : { scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute w-28 h-28 rounded-full bg-emerald-500/25"
                />
                <motion.div
                  animate={isLightMode ? false : { scale: [1, 1.05, 1] }}
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
                type="button"
                onClick={handleCompleteAlertSteps}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-md shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
              >
                Já Fiz os Passos!
              </button>
            </div>
          )}
        </div>
      )}

      {!isBreakMode && mode !== 'alert' && (
        <button
          type="button"
          onClick={() => setIsTaskPickerOpen(true)}
          className="order-4 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-hover)]/30 px-5 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10"
        >
          Selecionar ou limpar tarefa
        </button>
      )}

      <div className="order-5">
        <TimerControls
          isActive={isActive}
          isAlertCountdown={isAlertCountdown}
          onReset={resetTimer}
          onToggle={toggleTimer}
          onSkip={skipPhase}
          variant="fullscreen"
        />
      </div>
    </>
  );
});
