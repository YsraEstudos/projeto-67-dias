import React, { useMemo } from 'react';
import { Task, useStore } from '../store/useStore';
import { countPomodorosOnDate } from '../lib/pomodoroStats';

interface StatsBarProps {
  activeTasks: Task[];
  completedCount: number;
}

export function StatsBar({ activeTasks, completedCount }: StatsBarProps) {
  const pomodoroLength = useStore((state) => state.settings.pomodoroLength);
  const dailyGoal = useStore((state) => state.settings.dailyGoal);
  const records = useStore((state) => state.records);

  const todayPomodoros = useMemo(() => countPomodorosOnDate(records), [records]);
  const safeGoal = Math.max(0, Math.floor(dailyGoal) || 0);
  const goalPercent = safeGoal > 0 ? Math.min(100, Math.round((todayPomodoros / safeGoal) * 100)) : 0;
  const isGoalReached = safeGoal > 0 && todayPomodoros >= safeGoal;

  return (
    <div className="px-4 md:px-8 py-3 md:py-4 shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-[var(--color-surface)] rounded-xl p-4 gap-y-4 gap-x-2 sm:gap-y-0 sm:divide-x divide-[var(--color-border)]">
        <div className="flex flex-col items-center justify-center py-1 sm:py-0 text-center">
          <span className="text-xl sm:text-2xl font-light text-[var(--color-primary)]">
            {activeTasks.reduce((acc, t) => acc + t.estimatedPomodoros * pomodoroLength, 0)}<span className="text-sm text-[var(--color-text-muted)] ml-1">m</span>
          </span>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tempo Estimado</span>
        </div>
        <div className="flex flex-col items-center justify-center py-1 sm:py-0 text-center">
          <span className="text-xl sm:text-2xl font-light text-[var(--color-primary)]">{activeTasks.length}</span>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tarefas a Concluir</span>
        </div>
        <div className="flex flex-col items-center justify-center py-1 sm:py-0 text-center">
          <span className="text-xl sm:text-2xl font-light text-[var(--color-primary)]">
            {activeTasks.reduce((acc, t) => acc + t.completedPomodoros * pomodoroLength, 0)}<span className="text-sm text-[var(--color-text-muted)] ml-1">m</span>
          </span>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tempo Decorrido</span>
        </div>
        <div className="flex flex-col items-center justify-center py-1 sm:py-0 text-center">
          <span className="text-xl sm:text-2xl font-light text-[var(--color-primary)]">
             {completedCount}
          </span>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tarefas Concluídas</span>
        </div>
      </div>
      {safeGoal > 0 && (
        <div className="mt-2 px-1" data-testid="daily-goal-progress">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
            <span>Meta diária</span>
            <span className={isGoalReached ? 'text-emerald-400 font-semibold' : undefined}>
              {todayPomodoros}/{safeGoal} pomodoros{isGoalReached ? ' ✓' : ''}
            </span>
          </div>
          <div
            className="mt-1 h-1.5 w-full rounded-full bg-[var(--color-surface)] overflow-hidden"
            role="progressbar"
            aria-label="Progresso da meta diária de pomodoros"
            aria-valuemin={0}
            aria-valuemax={safeGoal}
            aria-valuenow={Math.min(todayPomodoros, safeGoal)}
          >
            <div
              className={isGoalReached ? 'h-full bg-emerald-500 transition-all' : 'h-full bg-[var(--color-primary)] transition-all'}
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
