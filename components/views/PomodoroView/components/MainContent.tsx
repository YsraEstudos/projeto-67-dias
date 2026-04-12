import React, { useState } from 'react';
import { useStore, Task } from '../store/useStore';
import { Inbox } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import { HeaderActions } from './HeaderActions';
import { StatsBar } from './StatsBar';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';
import { useFilteredTasks } from '../hooks/useFilteredTasks';

export function MainContent() {
  const { currentFilter, toggleTask, setSelectedTaskId, selectedTaskId, setActiveTaskId } = useStore();
  const [completingTasks, setCompletingTasks] = useState<string[]>([]);
  const { activeTasks, completedTasks, allCompletedCount } = useFilteredTasks();

  const handleToggleTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!task.completed) {
      // Beautiful completion animation
      setCompletingTasks(prev => [...prev, task.id]);
      setTimeout(() => {
        toggleTask(task.id);
        setCompletingTasks(prev => prev.filter(id => id !== task.id));
      }, 500); // 500ms delay to show the animation
    } else {
      toggleTask(task.id);
    }
  };

  const handlePlayTask = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveTaskId(id);
  };

  const getFilterTitle = () => {
    const titles: Record<string, string> = {
      'today': 'Hoje',
      'tomorrow': 'Amanhã',
      'this-week': 'Esta Semana',
      'planned': 'Planejado',
      'completed': 'Concluído',
      'tasks': 'Tarefas'
    };
    if (titles[currentFilter]) return titles[currentFilter];
    // Must be a project
    return useStore.getState().projects.find(p => p.id === currentFilter)?.name || 'Tarefas';
  };

  return (
    <div className={cn("flex-1 flex flex-col h-screen bg-[var(--color-bg)] overflow-hidden relative transition-all duration-300", selectedTaskId ? "mr-[400px]" : "")}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-8 shrink-0">
        <h1 className="text-xl font-semibold">{getFilterTitle()}</h1>
        <HeaderActions />
      </header>

      {/* Stats Bar */}
      <StatsBar activeTasks={activeTasks} completedCount={allCompletedCount} />

      {/* Task Input */}
      <TaskInput />

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-8 pb-32">
        {activeTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] opacity-60">
            <div className="w-32 h-32 mb-4 bg-[var(--color-surface)] rounded-full flex items-center justify-center">
              <Inbox className="w-12 h-12" />
            </div>
            <p className="text-lg font-medium text-[var(--color-text)]">Nenhuma Tarefa</p>
            <p className="text-sm mt-1">Use a caixa de entrada acima para adicionar uma nova tarefa</p>
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
              <div className="space-y-2">
                {currentFilter !== 'completed' && (
                  <h3 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4 mt-8">Concluídas</h3>
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
  );
}
