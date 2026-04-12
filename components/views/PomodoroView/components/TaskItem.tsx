import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Play, Flag, Clock, Calendar, Tag, Repeat, FolderInput, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, useStore } from '../store/useStore';

interface TaskItemProps {
  key?: string | number;
  task: Task;
  isSelected: boolean;
  isCompleting: boolean;
  onToggle: (e: React.MouseEvent, task: Task) => void;
  onSelect: (id: string) => void;
  onPlay?: (e: React.MouseEvent, id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  isCompletedView?: boolean;
}

export function TaskItem({ 
  task, 
  isSelected, 
  isCompleting, 
  onToggle, 
  onSelect, 
  onPlay, 
  draggable, 
  onDragStart,
  isCompletedView 
}: TaskItemProps) {
  const { updateTask, projects } = useStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const totalPomodorosToRender = Math.max(task.estimatedPomodoros, task.completedPomodoros);

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateTask(task.id, { title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  return (
    <motion.div
      layout
      draggable={draggable}
      onDragStart={onDragStart}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
      onClick={() => {
        if (!isEditingTitle) onSelect(task.id);
      }}
      className={cn(
        "task-item group flex flex-col p-4 rounded-xl transition-all duration-300 cursor-pointer border",
        isSelected ? "border-[var(--color-primary)] shadow-md" : "border-transparent hover:border-[var(--color-border)] shadow-sm",
        isCompleting ? "bg-green-500/10 border-green-500/30 scale-[0.98] opacity-80" : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]",
        isCompletedView && "opacity-60 hover:opacity-100"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center flex-1">
          <button 
            onClick={(e) => {
              if (task.isInfinite) {
                e.stopPropagation();
                return;
              }
              onToggle(e, task);
            }}
            className={cn(
              "mr-3 transition-all duration-300 shrink-0",
              task.isInfinite ? "text-[var(--color-text-muted)] cursor-not-allowed opacity-50" : 
              isCompleting || task.completed ? "text-green-500 scale-110" : "text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            )}
            disabled={task.isInfinite}
            title={task.isInfinite ? "Tarefas eternas não podem ser concluídas" : "Concluir tarefa"}
          >
            {task.isInfinite ? <InfinityIcon className="w-5 h-5" /> : (isCompleting || task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />)}
          </button>
          
          {!isCompletedView && onPlay && (
            <button 
              onClick={(e) => onPlay(e, task.id)}
              className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center mr-3 shrink-0 hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              <Play className="w-3 h-3 ml-0.5" />
            </button>
          )}

          <div className="flex flex-col flex-1">
            <div className="flex items-center space-x-2">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleTitleSubmit();
                    if (e.key === 'Escape') {
                      setEditedTitle(task.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="bg-transparent border-b border-[var(--color-primary)] outline-none text-[15px] font-medium text-[var(--color-text)] w-full max-w-[300px]"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span 
                  onDoubleClick={(e) => {
                    if (!isCompletedView) {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }
                  }}
                  className={cn("text-[15px] font-medium transition-all duration-300", (isCompleting || task.completed) && "line-through text-[var(--color-text-muted)]")}
                  title={!isCompletedView ? "Duplo clique para editar" : undefined}
                >
                  {task.title}
                </span>
              )}
              {!isCompletedView && task.priority ? (
                <Flag className={cn("w-3 h-3 fill-current", 
                  task.priority === 3 ? "text-red-500" : 
                  task.priority === 2 ? "text-yellow-500" : 
                  "text-blue-500"
                )} />
              ) : null}
            </div>
            
            {!isCompletedView && (
              <div className="flex items-center mt-1 gap-1 flex-wrap">
                {totalPomodorosToRender <= 10 ? (
                  Array.from({ length: totalPomodorosToRender }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-3 h-3 rounded-full flex items-center justify-center transition-colors",
                        i < task.completedPomodoros ? "text-[var(--color-primary)]" : "text-[var(--color-primary)]/30"
                      )}
                    >
                      <Clock className="w-3 h-3 fill-current" />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center text-xs font-medium text-[var(--color-text-muted)]">
                    <span className="text-[var(--color-primary)] flex items-center">
                      <Clock className="w-3 h-3 fill-current mr-1" />
                      {task.completedPomodoros}
                    </span>
                    <span className="mx-1">/</span>
                    <span>{task.estimatedPomodoros}</span>
                  </div>
                )}
                
                {/* Tags & Due Date */}
                {(task.tags?.length || task.dueDate || task.recurringDays?.length) && (
                  <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-[var(--color-border)]">
                    {task.dueDate && (
                      <span className="text-[10px] uppercase tracking-wider font-medium text-[var(--color-text-muted)] flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                    {task.recurringDays && task.recurringDays.length > 0 && (
                      <span className="text-[10px] uppercase tracking-wider font-medium text-[var(--color-text-muted)] flex items-center">
                        <Repeat className="w-3 h-3 mr-1" />
                        {task.recurringDays.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ')}
                      </span>
                    )}
                    {task.tags?.map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider font-medium text-[var(--color-primary)] flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {!isCompletedView && task.isInfinite && (
          <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center text-[var(--color-primary)] text-xs font-medium bg-[var(--color-primary)]/10 px-2 py-1 rounded-md">
              <Repeat className="w-3 h-3 mr-1" />
              Eterna
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isSelected && !isCompletedView && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-6">
              {/* Edit Estimated Pomodoros */}
              <div className="flex items-center space-x-3">
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Estimados:</span>
                <div className="flex items-center bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border)]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateTask(task.id, { estimatedPomodoros: Math.max(1, task.estimatedPomodoros - 1) }); }} 
                    className="px-3 py-1.5 hover:text-[var(--color-primary)] transition-colors"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{task.estimatedPomodoros}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateTask(task.id, { estimatedPomodoros: task.estimatedPomodoros + 1 }); }} 
                    className="px-3 py-1.5 hover:text-[var(--color-primary)] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Edit Completed Pomodoros */}
              <div className="flex items-center space-x-3">
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Concluídos:</span>
                <div className="flex items-center bg-[var(--color-surface-hover)] rounded-lg border border-[var(--color-border)]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateTask(task.id, { completedPomodoros: Math.max(0, task.completedPomodoros - 1) }); }} 
                    className="px-3 py-1.5 hover:text-[var(--color-primary)] transition-colors"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium w-8 text-center">{task.completedPomodoros}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateTask(task.id, { completedPomodoros: task.completedPomodoros + 1 }); }} 
                    className="px-3 py-1.5 hover:text-[var(--color-primary)] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Transfer Project */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium flex items-center">
                <FolderInput className="w-3 h-3 mr-1" />
                Mover para:
              </span>
              <select
                value={task.projectId || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  updateTask(task.id, { projectId: e.target.value || undefined });
                }}
                onClick={e => e.stopPropagation()}
                className="bg-[var(--color-surface-hover)] text-[var(--color-text)] text-sm rounded-lg px-3 py-1.5 border border-[var(--color-border)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
              >
                <option value="">📥 Caixa de Entrada (Tarefas)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>📁 {p.name}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
