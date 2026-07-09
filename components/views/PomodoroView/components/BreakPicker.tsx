import React, { useEffect, useMemo, useState } from 'react';
import { Dumbbell, Minus, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { useRestStore } from '../../../../stores';
import { RestActivity } from '../../../../types';
import { getRestActivitySeriesStats } from '../../../../utils/restActivityUtils';
import { useShallow } from 'zustand/react/shallow';
import {
  getRestActivityIdFromSelection,
  QUICK_BREAK_OPTIONS,
  createQuickBreakSelection,
  createRestBreakSelection,
  resolveBreakSelectionLabel,
  splitRestActivitiesByDate,
} from '../lib/breakOptions';

type BreakPickerTab = 'today' | 'otherDays' | 'quick';

interface BreakPickerProps {
  variant: 'expanded' | 'fullscreen';
}

export const BreakPicker = React.memo(function BreakPicker({ variant }: BreakPickerProps) {
  // Store access
  const timerState = useStore(useShallow((state) => state.timerState));
  const shortBreakSelection = useStore(useShallow((state) => state.shortBreakSelection));
  const longBreakSelection = useStore(useShallow((state) => state.longBreakSelection));
  const breakExerciseStats = useStore(useShallow((state) => state.breakExerciseStats));
  const setBreakSelection = useStore((state) => state.setBreakSelection);
  const clearBreakSelection = useStore((state) => state.clearBreakSelection);
  const setBreakExerciseReps = useStore((state) => state.setBreakExerciseReps);

  // Rest Store access
  const restActivities = useRestStore((state) => state.activities);
  const toggleRestActivityComplete = useRestStore((state) => state.toggleActivityComplete);

  // Local states
  const [isBreakPickerOpen, setIsBreakPickerOpen] = useState(false);
  const [breakPickerTab, setBreakPickerTab] = useState<BreakPickerTab>('today');
  const [exerciseRepsDraft, setExerciseRepsDraft] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);

  // Computed values
  const isBreakMode = timerState.mode === 'shortBreak' || timerState.mode === 'longBreak';
  const currentBreakMode = isBreakMode ? timerState.mode : null;

  const activeBreakSelection = useMemo(() => {
    if (timerState.mode === 'shortBreak') return shortBreakSelection;
    if (timerState.mode === 'longBreak') return longBreakSelection;
    return null;
  }, [timerState.mode, shortBreakSelection, longBreakSelection]);

  const selectedBreakLabel = useMemo(
    () => resolveBreakSelectionLabel(activeBreakSelection, restActivities),
    [activeBreakSelection, restActivities],
  );

  const selectedRestActivityId = useMemo(
    () => getRestActivityIdFromSelection(activeBreakSelection),
    [activeBreakSelection],
  );

  const selectedRestActivity = useMemo(
    () => (selectedRestActivityId
      ? restActivities.find((activity) => activity.id === selectedRestActivityId) || null
      : null),
    [restActivities, selectedRestActivityId],
  );

  const seriesStats = useMemo(
    () => (selectedRestActivity ? getRestActivitySeriesStats(selectedRestActivity) : null),
    [selectedRestActivity]
  );

  const { today: todayRestActivities, otherDays: otherDayRestActivities } = useMemo(
    () => splitRestActivitiesByDate(restActivities, new Date()),
    [restActivities],
  );

  const quickOptionsForCurrentMode = useMemo(
    () => QUICK_BREAK_OPTIONS.filter((option) => option.recommendedFor === 'both' || option.recommendedFor === timerState.mode),
    [timerState.mode],
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
    () => (activeBreakSelection?.source === 'QUICK_OPTION'
      ? quickOptionsForCurrentMode.find((option) => option.id === activeBreakSelection.key) ?? null
      : null),
    [activeBreakSelection, quickOptionsForCurrentMode],
  );

  const selectedQuickExerciseOption = selectedQuickOption?.kind === 'exercise' ? selectedQuickOption : null;
  const selectedQuickExerciseStats = selectedQuickExerciseOption
    ? breakExerciseStats[selectedQuickExerciseOption.id] ?? null
    : null;

  // Sync / Reset local states on mode change
  useEffect(() => {
    if (!isBreakMode) {
      setIsBreakPickerOpen(false);
      setBreakPickerTab('today');
    }
  }, [isBreakMode]);

  useEffect(() => {
    if (!selectedQuickExerciseOption) {
      setExerciseRepsDraft(0);
      return;
    }

    setExerciseRepsDraft(
      breakExerciseStats[selectedQuickExerciseOption.id]?.reps ?? selectedQuickExerciseOption.defaultReps ?? 0,
    );
  }, [breakExerciseStats, selectedQuickExerciseOption]);

  // Handlers
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
                                      className="flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
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
                                      className="flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
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
});

export default BreakPicker;
