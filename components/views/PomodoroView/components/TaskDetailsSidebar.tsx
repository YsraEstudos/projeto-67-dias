import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Flag, Clock, Calendar as CalendarIcon, List, Bell, Repeat, 
  Plus, Trash2, ChevronRight, Play, Circle, CheckCircle2, Tag
} from 'lucide-react';
import { useStore, Task, Subtask } from '../store/useStore';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { countHistoricalPomodoros } from '../lib/pomodoroStats';

export function TaskDetailsSidebar() {
  const { tasks, records, selectedTaskId, setSelectedTaskId, updateTask, deleteTask, projects } = useStore();
  const task = tasks.find(t => t.id === selectedTaskId);
  const todayStr = new Date().toISOString().split('T')[0];

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTagTitle, setNewTagTitle] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const historicalPomodoros = useMemo(
    () => (task ? countHistoricalPomodoros(records, task.id) : 0),
    [records, task]
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      // composedPath() handles the case where the element was removed from the DOM during the click event
      const path = event.composedPath();
      if (sidebarRef.current && path.includes(sidebarRef.current)) {
        return;
      }
      
      const target = event.target as HTMLElement;
      // Don't close if clicking on a task item (it will switch tasks instead)
      if (target && target.closest && target.closest('.task-item')) {
        return;
      }
      setSelectedTaskId(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [setSelectedTaskId]);

  if (!task) return null;

  const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        title: newSubtaskTitle.trim(),
        completed: false,
        lastCompletedDate: null,
      };
      updateTask(task.id, {
        subtasks: [...(task.subtasks || []), newSubtask]
      });
      setNewSubtaskTitle('');
    }
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const nextDate = todayStr;
    updateTask(task.id, {
      subtasks: task.subtasks?.map(st => {
        if (st.id !== subtaskId) return st;

        const isCompletedToday = st.completed && st.lastCompletedDate === todayStr;
        return {
          ...st,
          completed: !isCompletedToday,
          lastCompletedDate: !isCompletedToday ? nextDate : null,
        };
      })
    });
  };

  const handleUpdateSubtaskDescription = (subtaskId: string, description: string) => {
    updateTask(task.id, {
      subtasks: task.subtasks?.map(st => (
        st.id === subtaskId ? { ...st, description } : st
      ))
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagTitle.trim()) {
      updateTask(task.id, {
        tags: [...(task.tags || []), newTagTitle.trim()]
      });
      setNewTagTitle('');
      setIsAddingTag(false);
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTagTitle('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateTask(task.id, {
      tags: task.tags?.filter(t => t !== tagToRemove)
    });
  };

  const togglePriority = () => {
    const current = task.priority || 0;
    updateTask(task.id, { priority: (current + 1) % 4 });
  };

  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 1: return 'text-blue-500';
      case 2: return 'text-yellow-500';
      case 3: return 'text-red-500';
      default: return 'text-[var(--color-text-muted)]';
    }
  };

  const project = projects.find(p => p.id === task.projectId);

  return (
    <motion.div
      ref={sidebarRef}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-[400px] h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col absolute right-0 top-0 z-40 shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center flex-1 mr-4">
            <button 
              onClick={() => updateTask(task.id, { completed: !task.completed })}
              className="mr-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mt-1"
            >
              {task.completed ? <CheckCircle2 className="w-6 h-6 text-[var(--color-primary)]" /> : <Circle className="w-6 h-6" />}
            </button>
            <div className="flex items-center flex-1">
              <button className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center mr-3 shrink-0">
                <Play className="w-3 h-3 ml-0.5" />
              </button>
              <input 
                type="text"
                value={task.title}
                onChange={(e) => updateTask(task.id, { title: e.target.value })}
                className={cn(
                  "bg-transparent border-none focus:outline-none text-lg font-medium w-full",
                  task.completed && "line-through text-[var(--color-text-muted)]"
                )}
              />
            </div>
          </div>
          <button 
            onClick={togglePriority}
            className={cn("p-1.5 rounded-md hover:bg-[var(--color-surface)] transition-colors", getPriorityColor(task.priority))}
          >
            <Flag className={cn("w-5 h-5", task.priority ? "fill-current" : "")} />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 items-center">
          {task.tags?.map(tag => (
            <span key={tag} className="group px-2.5 py-1 rounded-full border border-[var(--color-border)] text-xs flex items-center text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] transition-colors">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3 hover:text-[var(--color-primary)]" />
              </button>
            </span>
          ))}
          
          {isAddingTag ? (
            <input
              type="text"
              value={newTagTitle}
              onChange={(e) => setNewTagTitle(e.target.value)}
              onKeyDown={handleAddTag}
              onBlur={() => {
                if (!newTagTitle.trim()) setIsAddingTag(false);
              }}
              placeholder="Tag name..."
              className="px-2.5 py-1 rounded-full border border-[var(--color-primary)] bg-transparent text-xs focus:outline-none w-24"
              autoFocus
            />
          ) : (
            <button 
              onClick={() => setIsAddingTag(true)}
              className="px-2.5 py-1 rounded-full border border-dashed border-[var(--color-border)] text-xs flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Tags
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Properties Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm group cursor-pointer">
            <div className="flex items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
              <Clock className="w-4 h-4 mr-3" />
              <span>Pomodoro</span>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span className="flex items-center px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Hoje {task.completedPomodoros}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] font-medium">
                  Histórico total {historicalPomodoros}
                </span>
              </div>
              <span className="text-[var(--color-text-muted)] text-xs">
                Meta {task.estimatedPomodoros} = {task.estimatedPomodoros * 25}m
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm group cursor-pointer relative">
            <div className="flex items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
              <CalendarIcon className="w-4 h-4 mr-3" />
              <span>Due Date</span>
            </div>
            <div className="relative flex items-center">
              <span className="text-[var(--color-text)]">{task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'Someday'}</span>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    // Add timezone offset to prevent date shifting
                    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                    updateTask(task.id, { dueDate: date.toISOString() });
                  } else {
                    updateTask(task.id, { dueDate: null });
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm group cursor-pointer">
            <div className="flex items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
              <List className="w-4 h-4 mr-3" />
              <span>Project</span>
            </div>
            <span className="text-[var(--color-text)]">{project ? project.name : 'None'}</span>
          </div>

          <div 
            className="flex items-center justify-between text-sm group cursor-pointer"
            onClick={() => updateTask(task.id, { isInfinite: !task.isInfinite })}
          >
            <div className="flex items-center text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
              <Repeat className="w-4 h-4 mr-3" />
              <span>Tarefa Eterna</span>
            </div>
            <div className={cn("w-8 h-4 rounded-full transition-colors relative", task.isInfinite ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]")}>
              <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform", task.isInfinite ? "left-4" : "left-0.5")} />
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--color-border)] w-full" />

        {/* Subtasks */}
        <div className="space-y-3">
          {task.subtasks?.map(subtask => {
            const isChecked = subtask.completed && subtask.lastCompletedDate === todayStr;

            return (
              <div key={subtask.id} className="flex items-start group">
                <button
                  onClick={() => handleToggleSubtask(subtask.id)}
                  className="mr-3 mt-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {isChecked ? <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" /> : <Circle className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={cn("block text-sm", isChecked && "line-through text-[var(--color-text-muted)]")}>
                    {subtask.title}
                  </span>
                  <textarea
                    value={subtask.description || ''}
                    onChange={(e) => handleUpdateSubtaskDescription(subtask.id, e.target.value)}
                    placeholder="Adicionar descrição..."
                    rows={2}
                    className="mt-1 w-full bg-transparent border-none focus:outline-none text-xs leading-relaxed resize-none placeholder:text-[var(--color-text-muted)] text-[var(--color-text-muted)]"
                  />
                </div>
                <button
                  onClick={() => updateTask(task.id, { subtasks: task.subtasks?.filter(st => st.id !== subtask.id) })}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          
          <div className="flex items-center text-sm text-[var(--color-text-muted)]">
            <Plus className="w-4 h-4 mr-3" />
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleAddSubtask}
              placeholder="Add a subtask..."
              className="bg-transparent border-none focus:outline-none flex-1 placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </div>

        <div className="h-px bg-[var(--color-border)] w-full" />

        {/* Notes */}
        <div>
          <textarea
            value={task.notes || ''}
            onChange={(e) => updateTask(task.id, { notes: e.target.value })}
            placeholder="Add a note..."
            className="w-full bg-transparent border-none focus:outline-none text-sm resize-none min-h-[100px] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)] shrink-0 bg-[var(--color-surface)]">
        <button 
          onClick={() => setSelectedTaskId(null)}
          className="p-1.5 hover:bg-[var(--color-surface)] rounded-md transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <span>Created on {format(new Date(task.createdAt), 'MMM d')}</span>
        <button 
          onClick={() => {
            deleteTask(task.id);
          }}
          className="p-1.5 hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
