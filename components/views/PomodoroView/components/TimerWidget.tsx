import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, Square, Maximize2, Minimize2, Maximize, Minimize, SkipForward, Brain, Coffee, Settings, Volume2, VolumeX, CheckCircle2, Circle } from 'lucide-react';
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
  
  const {
    activeTaskId,
    tasks,
    setActiveTaskId,
    setSettingsOpen,
    settings,
    updateSettings,
    shortBreakSelection,
    longBreakSelection,
    setBreakSelection,
    clearBreakSelection,
    updateTask,
  } = useStore();

  const restActivities = useRestStore((state) => state.activities);
  const toggleRestActivityComplete = useRestStore((state) => state.toggleActivityComplete);
  const activeTask = tasks.find(t => t.id === activeTaskId);

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

  useEffect(() => {
    if (!isBreakMode) {
      setIsBreakPickerOpen(false);
      setBreakPickerTab('today');
    }
  }, [isBreakMode]);

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
    setIsBreakPickerOpen(false);
  };

  const handleClearBreakSelection = () => {
    if (!currentBreakMode) return;
    clearBreakSelection(currentBreakMode);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!activeTask) return;
    updateTask(activeTask.id, {
      subtasks: activeTask.subtasks?.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    });
  };

  const [justCompleted, setJustCompleted] = useState(false);

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
              const isChecked = subtask.completed;
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
                  <span className={cn(
                    "flex-1 transition-all duration-300 z-10", 
                    isChecked ? "text-green-500/70 line-through decoration-green-500/40" : "text-[var(--color-text)] font-medium",
                    variant === 'fullscreen' ? "text-base" : "text-sm",
                    isChecked && !subtask.completed ? "translate-x-1" : ""
                  )}>
                    {subtask.title}
                  </span>
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
                    <>
                      {quickOptionsForCurrentMode.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectQuickBreak(option.id)}
                          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)]/40 px-3 py-2 text-left text-sm transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10"
                        >
                          <span className="block">{option.label}</span>
                          <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">{option.description}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
                onClick={() => setSettingsOpen(true)} 
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
                  onClick={() => setSettingsOpen(true)}
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
    </>
  );
}
