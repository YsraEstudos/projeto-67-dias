import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, X, Flag, Calendar, Tag, FolderInput } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Popover } from './ui/Popover';

export function TaskInput() {
  const { currentFilter, addTask, projects } = useStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [showNumberInput, setShowNumberInput] = useState(false);
  
  const [newTaskPriority, setNewTaskPriority] = useState<number>(0);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string | null>(null);
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskRecurringDays, setNewTaskRecurringDays] = useState<number[]>([]);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [showTagsMenu, setShowTagsMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const isProjectFilter = projects.some(p => p.id === currentFilter);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(isProjectFilter ? currentFilter : '');

  useEffect(() => {
    setSelectedProjectId(projects.some(p => p.id === currentFilter) ? currentFilter : '');
  }, [currentFilter, projects]);

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        completed: false,
        estimatedPomodoros,
        completedPomodoros: 0,
        projectId: selectedProjectId || undefined,
        priority: newTaskPriority > 0 ? newTaskPriority : undefined,
        dueDate: newTaskDueDate,
        tags: newTaskTags.length > 0 ? newTaskTags : undefined,
        recurringDays: newTaskRecurringDays.length > 0 ? newTaskRecurringDays : undefined,
      });
      setNewTaskTitle('');
      setEstimatedPomodoros(1);
      setShowNumberInput(false);
      setNewTaskPriority(0);
      setNewTaskDueDate(null);
      setNewTaskTags([]);
      setNewTaskRecurringDays([]);
      setShowScheduleMenu(false);
      setShowTagsMenu(false);
      setShowProjectMenu(false);
    }
  };

  return (
    <div className="px-8 shrink-0 mb-6">
      <div className="bg-[var(--color-surface)] rounded-xl flex items-center px-4 py-3 border border-transparent focus-within:border-[var(--color-border)] transition-colors shadow-sm">
        <div className="w-5 h-5 rounded-sm border-2 border-[var(--color-text-muted)] mr-3 opacity-50" />
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleAddTask}
          placeholder="Adicionar uma tarefa em &quot;Tarefas&quot;, pressione [Enter] para salvar"
          className="flex-1 bg-transparent border-none focus:outline-none text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
        <div className="flex items-center space-x-1 ml-4 h-8">
          <AnimatePresence mode="wait">
            {!showNumberInput ? (
              <motion.div 
                key="icons"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center space-x-1 overflow-hidden"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (num === 5) {
                        setShowNumberInput(true);
                        setEstimatedPomodoros(5);
                      } else {
                        setEstimatedPomodoros(num);
                      }
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                      estimatedPomodoros >= num ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                className="flex items-center bg-[var(--color-surface-hover)] rounded-full px-2 py-1 h-full"
              >
                <Clock className="w-4 h-4 text-[var(--color-primary)] mr-1" />
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={estimatedPomodoros}
                  onChange={(e) => setEstimatedPomodoros(Math.max(1, parseInt(e.target.value) || 1))}
                  onBlur={() => {
                    if (estimatedPomodoros <= 5) setShowNumberInput(false);
                  }}
                  className="w-8 bg-transparent border-none focus:outline-none text-[var(--color-text)] text-sm text-center font-medium"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setShowNumberInput(false);
                    if (estimatedPomodoros > 5) setEstimatedPomodoros(5);
                  }}
                  className="ml-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded-full hover:bg-[var(--color-border)] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center space-x-2 ml-4 h-8 border-l border-[var(--color-border)] pl-4 relative">
          {/* Project Selector */}
          <Popover
            isOpen={showProjectMenu}
            onClose={() => setShowProjectMenu(false)}
            trigger={
              <button 
                onClick={() => { setShowProjectMenu(!showProjectMenu); setShowScheduleMenu(false); setShowTagsMenu(false); }}
                className={cn("p-1.5 rounded-md transition-colors", selectedProjectId ? "bg-[var(--color-surface-hover)] text-[var(--color-primary)]" : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]")}
                title="Projeto"
              >
                <FolderInput className="w-4 h-4" />
              </button>
            }
          >
            <div className="p-2 w-48 flex flex-col space-y-1">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 px-2">Projeto</span>
              <button
                type="button"
                onClick={() => { setSelectedProjectId(''); setShowProjectMenu(false); }}
                className={cn(
                  "text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                  selectedProjectId === '' ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                )}
              >
                📥 Caixa de Entrada
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedProjectId(p.id); setShowProjectMenu(false); }}
                  className={cn(
                    "text-left px-2 py-1.5 text-sm rounded-md transition-colors flex items-center",
                    selectedProjectId === p.id ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                  )}
                >
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </Popover>

          {/* Priority */}
          <button 
            onClick={() => setNewTaskPriority((prev) => (prev + 1) % 4)}
            className={cn("p-1.5 rounded-md transition-colors", newTaskPriority > 0 ? "bg-[var(--color-surface-hover)]" : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]")}
            title="Definir Prioridade"
          >
            <Flag className={cn("w-4 h-4", 
              newTaskPriority === 3 ? "text-red-500 fill-current" : 
              newTaskPriority === 2 ? "text-yellow-500 fill-current" : 
              newTaskPriority === 1 ? "text-blue-500 fill-current" : 
              ""
            )} />
          </button>

          {/* Schedule */}
          <Popover
            isOpen={showScheduleMenu}
            onClose={() => setShowScheduleMenu(false)}
            className="w-64 p-3"
            trigger={
              <button 
                onClick={() => { setShowScheduleMenu(!showScheduleMenu); setShowTagsMenu(false); setShowProjectMenu(false); }}
                className={cn("p-1.5 rounded-md transition-colors", (newTaskDueDate || newTaskRecurringDays.length > 0) ? "bg-[var(--color-surface-hover)] text-[var(--color-primary)]" : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]")}
                title="Agendar Tarefa"
              >
                <Calendar className="w-4 h-4" />
              </button>
            }
          >
            <div className="text-xs font-medium text-[var(--color-text-muted)] mb-2 px-1 uppercase tracking-wider">Data Específica</div>
            <button onClick={() => { setNewTaskDueDate(new Date().toISOString()); setNewTaskRecurringDays([]); setShowScheduleMenu(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--color-surface-hover)] transition-colors">Hoje</button>
            <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); setNewTaskDueDate(d.toISOString()); setNewTaskRecurringDays([]); setShowScheduleMenu(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--color-surface-hover)] transition-colors">Amanhã</button>
            <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 7); setNewTaskDueDate(d.toISOString()); setNewTaskRecurringDays([]); setShowScheduleMenu(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--color-surface-hover)] transition-colors">Próxima Semana</button>
            
            <div className="px-3 py-2 mt-1">
              <input 
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-[var(--color-surface)] text-[var(--color-text)] text-sm rounded-md px-2 py-1.5 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value);
                    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                    setNewTaskDueDate(date.toISOString());
                    setNewTaskRecurringDays([]);
                    setShowScheduleMenu(false);
                  }
                }}
              />
            </div>

            <div className="h-px bg-[var(--color-border)] my-3" />
            
            <div className="text-xs font-medium text-[var(--color-text-muted)] mb-2 px-1 uppercase tracking-wider">Dias da Semana</div>
            <div className="flex justify-between px-1 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setNewTaskDueDate(null);
                    setNewTaskRecurringDays(prev => 
                      prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                    );
                  }}
                  className={cn(
                    "w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors",
                    newTaskRecurringDays.includes(i) ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="h-px bg-[var(--color-border)] my-3" />
            <button onClick={() => { setNewTaskDueDate(null); setNewTaskRecurringDays([]); setShowScheduleMenu(false); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-[var(--color-surface-hover)] text-red-500 transition-colors">Limpar Agendamento</button>
          </Popover>

          {/* Tags */}
          <Popover
            isOpen={showTagsMenu}
            onClose={() => setShowTagsMenu(false)}
            className="w-64 p-3"
            trigger={
              <button 
                onClick={() => { setShowTagsMenu(!showTagsMenu); setShowScheduleMenu(false); setShowProjectMenu(false); }}
                className={cn("p-1.5 rounded-md transition-colors", newTaskTags.length > 0 ? "bg-[var(--color-surface-hover)] text-[var(--color-primary)]" : "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]")}
                title="Adicionar Tags"
              >
                <Tag className="w-4 h-4" />
              </button>
            }
          >
            <div className="text-xs font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Tags</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {newTaskTags.map(tag => (
                <span key={tag} className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-1 rounded-md text-xs flex items-center">
                  {tag}
                  <X className="w-3 h-3 ml-1 cursor-pointer hover:text-white" onClick={() => setNewTaskTags(prev => prev.filter(t => t !== tag))} />
                </span>
              ))}
            </div>
            <input 
              type="text" 
              placeholder="Adicionar tag e [Enter]" 
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-primary)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const val = e.currentTarget.value.trim();
                  if (!newTaskTags.includes(val)) setNewTaskTags([...newTaskTags, val]);
                  e.currentTarget.value = '';
                }
              }}
            />
          </Popover>
        </div>
      </div>
    </div>
  );
}
