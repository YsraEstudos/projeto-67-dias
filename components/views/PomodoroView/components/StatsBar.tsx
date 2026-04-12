import React from 'react';
import { Task } from '../store/useStore';

interface StatsBarProps {
  activeTasks: Task[];
  completedCount: number;
}

export function StatsBar({ activeTasks, completedCount }: StatsBarProps) {
  return (
    <div className="px-8 py-4 shrink-0">
      <div className="flex bg-[var(--color-surface)] rounded-xl p-4 divide-x divide-[var(--color-border)]">
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-2xl font-light text-[var(--color-primary)]">
            {activeTasks.reduce((acc, t) => acc + t.estimatedPomodoros * 25, 0)}<span className="text-sm text-[var(--color-text-muted)] ml-1">m</span>
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tempo Estimado</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-2xl font-light text-[var(--color-primary)]">{activeTasks.length}</span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tarefas a Concluir</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-2xl font-light text-[var(--color-primary)]">
            {activeTasks.reduce((acc, t) => acc + t.completedPomodoros * 25, 0)}<span className="text-sm text-[var(--color-text-muted)] ml-1">m</span>
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tempo Decorrido</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-2xl font-light text-[var(--color-primary)]">
             {completedCount}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Tarefas Concluídas</span>
        </div>
      </div>
    </div>
  );
}
