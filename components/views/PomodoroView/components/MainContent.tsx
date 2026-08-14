import React, { useState, useMemo, useCallback } from 'react';
import { useStore, Task } from '../store/useStore';
import {
  Inbox,
  Menu,
  Timer as TimerIcon,
  ListTodo,
  Brain,
  Coffee,
  AlertTriangle,
  GraduationCap,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  ChevronRight,
  ArrowRight,
  Flame,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HeaderActions } from './HeaderActions';
import { StatsBar } from './StatsBar';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';
import { TimerControls } from './TimerControls';
import { BreakPicker } from './BreakPicker';
import { SkillFocusSelector } from './SkillFocusSelector';
import { useFilteredTasks } from '../hooks/useFilteredTasks';
import { usePomodoroTimer, TimerMode } from '../hooks/usePomodoroTimer';
import { useActiveTask } from '../hooks/useActiveTask';
import { useRestStore } from '../../../../stores';
import { resolveBreakSelectionLabel } from '../lib/breakOptions';
import { getLocalISODate } from '../lib/pomodoroStats';
import { useShallow } from 'zustand/react/shallow';

interface MainContentProps {
  onToggleSidebar?: () => void;
}

export function MainContent({ onToggleSidebar }: MainContentProps) {
  const {
    currentFilter,
    toggleTask,
    setSelectedTaskId,
    selectedTaskId,
    setActiveTaskId,
    updateTask,
    settings,
    updateSettings,
    setSettingsOpen,
    shortBreakSelection,
    longBreakSelection,
    projects,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'timer' | 'tasks'>('timer');
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [completingTasks, setCompletingTasks] = useState<string[]>([]);
  const { activeTasks, completedTasks, allCompletedCount } = useFilteredTasks();

  const activeTask = useActiveTask();
  const restActivities = useRestStore((state) => state.activities);
  const todayStr = useMemo(() => getLocalISODate(), []);

  const timerState = useStore(useShallow((state) => state.timerState));
  const setTimerState = useStore((state) => state.setTimerState);

  const {
    isActive,
    minutes,
    seconds,
    mode,
    timeLeft,
    progress,
    toggleTimer,
    resetTimer,
    setMode,
    skipPhase,
  } = usePomodoroTimer();

  const isLightMode = settings.performanceMode === 'light';
  const alertStep = timerState.alertStep;
  const isAlertCountdown = mode === 'alert' && alertStep === 'countdown';
  const isBreakMode = mode === 'shortBreak' || mode === 'longBreak';

  const modes = useMemo<{ id: TimerMode; label: string; icon: React.ElementType }[]>(() => [
    { id: 'pomodoro', label: 'Foco', icon: Brain },
    { id: 'shortBreak', label: 'Pausa Curta', icon: Coffee },
    { id: 'longBreak', label: 'Pausa Longa', icon: Coffee },
    { id: 'alert', label: 'Alerta', icon: AlertTriangle },
  ], []);

  const activeBreakSelection = mode === 'shortBreak'
    ? shortBreakSelection
    : mode === 'longBreak'
      ? longBreakSelection
      : null;

  const selectedBreakLabel = useMemo(
    () => resolveBreakSelectionLabel(activeBreakSelection, restActivities),
    [activeBreakSelection, restActivities]
  );

  const handleToggleTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!task.completed) {
      setCompletingTasks(prev => [...prev, task.id]);
      setTimeout(() => {
        toggleTask(task.id);
        setCompletingTasks(prev => prev.filter(id => id !== task.id));
      }, 500);
    } else {
      toggleTask(task.id);
    }
  };

  const handlePlayTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveTaskId(id);
    // Switch to Timer tab on mobile so user immediately sees the timer focused on this task
    setActiveTab('timer');
  };

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

  const getBreathingInstruction = (timeLeftValue: number) => {
    const cycle = (300 - timeLeftValue) % 10;
    if (cycle < 4) return { text: 'Inspire', action: 'inhale' };
    if (cycle < 6) return { text: 'Segure', action: 'hold' };
    return { text: 'Expire', action: 'exhale' };
  };

  const filterTitle = useMemo(() => {
    const titles: Record<string, string> = {
      'today': 'Hoje',
      'tomorrow': 'Amanhã',
      'this-week': 'Esta Semana',
      'planned': 'Planejado',
      'completed': 'Concluído',
      'tasks': 'Tarefas'
    };
    if (titles[currentFilter]) return titles[currentFilter];
    return projects.find(p => p.id === currentFilter)?.name ?? 'Tarefas';
  }, [currentFilter, projects]);

  return (
    <div className={cn(
      "flex-1 flex flex-col h-full bg-[var(--color-bg)] overflow-hidden relative transition-all duration-300",
      selectedTaskId ? "lg:mr-[400px]" : ""
    )}>
      {/* Top Header */}
      <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 md:px-8 border-b border-[var(--color-border)]/50 shrink-0 bg-[var(--color-surface)]/40 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 hover:bg-[var(--color-surface)] rounded-xl transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]/50"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-base sm:text-lg md:text-xl font-bold truncate max-w-[120px] sm:max-w-none text-white">
            {filterTitle}
          </h1>
        </div>

        {/* View Switcher: Timer vs Tarefas */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            type="button"
            aria-label="Alternar para Timer"
            onClick={() => setActiveTab('timer')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200",
              activeTab === 'timer'
                ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
                : "text-[var(--color-text-muted)] hover:text-white"
            )}
          >
            <TimerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Timer</span>
          </button>
          <button
            type="button"
            aria-label="Alternar para Tarefas"
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200",
              activeTab === 'tasks'
                ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
                : "text-[var(--color-text-muted)] hover:text-white"
            )}
          >
            <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Tarefas</span>
            {activeTasks.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {activeTasks.length}
              </span>
            )}
          </button>
        </div>

        <HeaderActions />
      </header>

      {/* Main Area based on Active Tab */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {activeTab === 'timer' ? (
          /* ================================================================ */
          /*                       POMODORO TIMER VIEW                         */
          /* ================================================================ */
          <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
            
            {/* Mode Selectors */}
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 bg-[var(--color-surface)]/60 p-1.5 rounded-2xl border border-[var(--color-border)]/60 backdrop-blur-sm max-w-full">
              {modes.map((m) => {
                const Icon = m.icon;
                const isCurrentMode = mode === m.id && !isSkillsOpen;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isAlertCountdown}
                    onClick={() => {
                      setIsSkillsOpen(false);
                      setMode(m.id);
                    }}
                    className={cn(
                      "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center whitespace-nowrap",
                      isCurrentMode
                        ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20 font-semibold"
                        : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5",
                      isAlertCountdown && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                    {m.label}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={isAlertCountdown}
                onClick={() => setIsSkillsOpen((prev) => !prev)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center whitespace-nowrap border border-transparent",
                  isSkillsOpen
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg font-semibold"
                    : "text-[var(--color-text-muted)] hover:text-white hover:bg-white/5",
                  isAlertCountdown && "opacity-40 cursor-not-allowed"
                )}
                title="Habilidades de Estudo"
              >
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                Habilidades
              </button>
            </div>

            {/* If Skills Mode is Opened */}
            {isSkillsOpen ? (
              <div className="w-full bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl text-left">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Habilidades de Estudo & Foco
                  </h3>
                  <button
                    onClick={() => setIsSkillsOpen(false)}
                    className="text-xs text-[var(--color-text-muted)] hover:text-white px-2 py-1 rounded-md hover:bg-white/5"
                  >
                    Fechar
                  </button>
                </div>
                <SkillFocusSelector variant="expanded" setIsSkillsOpen={setIsSkillsOpen} />
              </div>
            ) : (
              <>
                {/* Hero Clock & Visual Progress Card */}
                <div className="w-full bg-gradient-to-b from-[var(--color-surface)]/70 to-[var(--color-surface)]/30 border border-[var(--color-border)]/60 rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                  {/* Subtle Background Glow */}
                  <div
                    className="absolute w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none -z-10"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />

                  {/* Circular Progress + Digital Clock */}
                  <div className="relative w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center my-2">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="text-[var(--color-border)]/30"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        className="text-[var(--color-primary)] transition-all duration-1000 ease-linear"
                        strokeWidth="5"
                        strokeDasharray={282.7}
                        strokeDashoffset={282.7 - (282.7 * progress) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                      />
                    </svg>

                    <div className="flex flex-col items-center justify-center text-center z-10">
                      <div className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight font-mono leading-none text-white drop-shadow-[0_0_25px_var(--color-primary)]">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                      </div>
                      <span className="mt-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                        {mode === 'alert'
                          ? (alertStep === 'breathing' ? 'Respiração' : 'Alerta Ativo')
                          : isBreakMode
                            ? (mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa')
                            : 'Foco'}
                      </span>
                    </div>
                  </div>

                  {/* Active Context Banner */}
                  <div className="w-full max-w-md mt-4 text-center">
                    {mode === 'alert' ? (
                      alertStep === 'breathing' ? (
                        <div className="flex flex-col items-center space-y-2">
                          <p className="text-sm font-semibold text-emerald-400">
                            Siga o ritmo: <span className="font-bold text-white uppercase ml-1">{getBreathingInstruction(timeLeft).text}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <p className="text-sm font-semibold text-amber-400">
                            Levante-se, faça polichinelos e afaste o telefone!
                          </p>
                          <button
                            type="button"
                            onClick={handleCompleteAlertSteps}
                            className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                          >
                            Já Fiz os Passos!
                          </button>
                        </div>
                      )
                    ) : isBreakMode ? (
                      <div className="space-y-2 bg-[var(--color-surface-hover)]/40 p-3.5 rounded-2xl border border-[var(--color-border)]/50">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Pausa em andamento</p>
                        <p className="text-sm sm:text-base font-semibold text-white truncate">
                          {selectedBreakLabel || 'Escolha um descanso para esta pausa'}
                        </p>
                        <BreakPicker variant="expanded" />
                      </div>
                    ) : activeTask ? (
                      <div className="space-y-2 bg-[var(--color-surface-hover)]/40 p-3.5 rounded-2xl border border-[var(--color-border)]/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Trabalhando em</span>
                          <span className="text-[var(--color-primary)] font-mono font-bold">
                            {activeTask.completedPomodoros}/{activeTask.estimatedPomodoros} 🍅
                          </span>
                        </div>
                        <p className="text-base font-bold text-white truncate text-left">{activeTask.title}</p>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveTab('tasks')}
                            className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
                          >
                            <span>Trocar tarefa</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTaskId(null)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Desmarcar foco
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 bg-[var(--color-surface-hover)]/30 p-3 rounded-2xl border border-dashed border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-text-muted)]">Nenhuma tarefa selecionada (Foco Livre)</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('tasks')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-white border border-[var(--color-border)] transition-all hover:scale-105 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span>Escolher da Lista de Tarefas</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Primary Touch-Friendly Timer Controls */}
                  <div className="mt-6 mb-2">
                    <TimerControls
                      isActive={isActive}
                      isAlertCountdown={isAlertCountdown}
                      onReset={resetTimer}
                      onToggle={toggleTimer}
                      onSkip={skipPhase}
                      variant="expanded"
                    />
                  </div>

                  {/* Quick Utility Actions */}
                  <div className="flex items-center gap-3 mt-4 text-[var(--color-text-muted)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (settings.volume > 0) {
                          updateSettings({ previousVolume: settings.volume, volume: 0 });
                        } else {
                          updateSettings({ volume: settings.previousVolume || 30 });
                        }
                      }}
                      className="p-2.5 rounded-full hover:bg-[var(--color-surface-hover)] hover:text-white transition-colors border border-transparent hover:border-[var(--color-border)]"
                      title={settings.volume > 0 ? "Mudo" : "Ativar som"}
                    >
                      {settings.volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      className="p-2.5 rounded-full hover:bg-[var(--color-surface-hover)] hover:text-white transition-colors border border-transparent hover:border-[var(--color-border)]"
                      title="Configurações do Pomodoro"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Checklist for Active Task */}
                {activeTask && activeTask.subtasks && activeTask.subtasks.length > 0 && (
                  <div className="w-full bg-[var(--color-surface)]/60 border border-[var(--color-border)]/60 rounded-2xl p-4 sm:p-5 backdrop-blur-sm text-left shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
                        Subtarefas da Sessão
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full border border-[var(--color-primary)]/20">
                        {activeTask.subtasks.filter(s => s.completed && s.lastCompletedDate === todayStr).length}/{activeTask.subtasks.length}
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                      {activeTask.subtasks.map((subtask) => {
                        const isChecked = subtask.completed && subtask.lastCompletedDate === todayStr;
                        return (
                          <div
                            key={subtask.id}
                            onClick={() => handleToggleSubtask(subtask.id)}
                            className={cn(
                              "flex items-center p-2.5 rounded-xl border transition-all cursor-pointer",
                              isChecked
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 text-slate-200"
                            )}
                          >
                            <button className={cn("mr-3 shrink-0", isChecked ? "text-green-400" : "text-slate-400")}>
                              {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            </button>
                            <span className={cn("text-xs font-medium truncate flex-1", isChecked && "line-through opacity-70")}>
                              {subtask.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ================================================================ */
          /*                       TASKS LIST VIEW                             */
          /* ================================================================ */
          <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full animate-in fade-in duration-300">
            {/* Stats Bar */}
            <StatsBar activeTasks={activeTasks} completedCount={allCompletedCount} />

            {/* Task Input */}
            <TaskInput />

            {/* Task List */}
            <div className="space-y-6 pb-24">
              {activeTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-[var(--color-text-muted)] text-center">
                  <div className="w-24 h-24 mb-4 bg-[var(--color-surface)] rounded-full flex items-center justify-center border border-[var(--color-border)] shadow-inner">
                    <Inbox className="w-10 h-10 text-[var(--color-text-muted)] opacity-60" />
                  </div>
                  <p className="text-base font-semibold text-white">Nenhuma Tarefa</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
                    Adicione uma tarefa no campo acima ou toque em Iniciar no Timer para foco livre.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeTasks.length > 0 && (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {activeTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            isSelected={selectedTaskId === task.id}
                            isCompleting={completingTasks.includes(task.id)}
                            onToggle={handleToggleTask}
                            onSelect={setSelectedTaskId}
                            onPlay={handlePlayTask}
                            draggable
                            onDragStart={(e: any) => {
                              e.dataTransfer.setData('text/plain', task.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {completedTasks.length > 0 && (
                    <div className="space-y-2 pt-4">
                      {currentFilter !== 'completed' && (
                        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                          Concluídas ({completedTasks.length})
                        </h3>
                      )}
                      <AnimatePresence>
                        {completedTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            isSelected={selectedTaskId === task.id}
                            isCompleting={false}
                            onToggle={handleToggleTask}
                            onSelect={setSelectedTaskId}
                            isCompletedView
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
