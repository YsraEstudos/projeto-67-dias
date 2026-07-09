import React, { useState } from 'react';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { useActiveTask } from '../hooks/useActiveTask';
import { useShallow } from 'zustand/react/shallow';

interface DailyTasksListProps {
  variant: 'expanded' | 'compact';
  onOpenTaskPicker: () => void;
}

export const DailyTasksList = React.memo(function DailyTasksList({ variant, onOpenTaskPicker }: DailyTasksListProps) {
  const tasks = useStore(useShallow((state) => state.tasks));
  const activeTaskId = useStore((state) => state.activeTaskId);
  const setActiveTaskId = useStore((state) => state.setActiveTaskId);
  const toggleTask = useStore((state) => state.toggleTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const addTask = useStore((state) => state.addTask);

  const activeTask = useActiveTask();
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

  const dailyQuickTasks = tasks.filter((t) => t.isDailyQuickTask);

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
              <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                Trabalhando em
              </p>
              <h4 className="text-xs font-semibold text-white leading-tight truncate">
                {activeTask.title}
              </h4>
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
      <div
        className={cn(
          "space-y-2 overflow-y-auto pr-1 custom-scrollbar",
          variant === 'compact' ? "max-h-[140px]" : "max-h-[220px]"
        )}
      >
        {dailyQuickTasks.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800/60 rounded-xl bg-slate-950/10">
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Nenhuma tarefa diária adicionada.
            </p>
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
          onClick={onOpenTaskPicker}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 py-2 px-3 text-xs font-semibold text-slate-300 transition-colors"
        >
          Selecionar do Cronograma/Projetos
        </button>
      </div>
    </div>
  );
});
