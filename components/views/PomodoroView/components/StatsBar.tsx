import React from 'react';
import { Task } from '../store/useStore';

interface StatsBarProps {
  activeTasks: Task[];
  completedCount: number;
}

export function StatsBar({ activeTasks, completedCount }: StatsBarProps) {
  return (
    <div className="px-4 md:px-8 py-3 md:py-4 shrink-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-[var(--color-surface)] rounded-xl p-4 gap-y-4 gap-x-2 sm:gap-y-0 sm:divide-x divide-[var(--color-border)]">
        <div className="flex flex-col items-center justify-center py-1 sm:py-0 text-center">
          <span className="text-xl sm:text-2xl font-light text-[var(--color-primary)]">
            {activeTasks.reduce((acc, t) => acc + t.estimatedPomodoros * 25, 0)}<span className="text-sm text-[var(--color-text-muted)] ml-1">m</span>
          </span>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tempo Estimado</span>
        </div>
        <div className="flex flex-col items-center justify-center py-1 sm:py-0 text-center">
          <span className="text-xl sm:text-2xl font-light text-[var(--color-primary)]">{activeTasks.length}</span>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tarefas a Concluir</span>
        </div>
        <div className="flex flex-col items-center justify-center py-1 sm:py-0 text-center">
          <span className="text-xl sm:text-2xl font-light text-[var(--color-primary)]">
            {activeTasks.reduce((acc, t) => acc + t.completedPomodoros * 25, 0)}<span className="text-sm text-[var(--color-text-muted)] ml-1">m</span>
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
    </div>
  );
}
