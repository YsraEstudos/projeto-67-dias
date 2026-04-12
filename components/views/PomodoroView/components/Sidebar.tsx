import React, { useState } from 'react';
import { Search, Sun, Calendar, CalendarDays, CalendarCheck, CheckCircle2, Inbox, Plus, Folder, Home, Tag, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useFilteredTasks } from '../hooks/useFilteredTasks';
import { Popover } from './ui/Popover';

const navItems = [
  { id: 'today', label: 'Hoje', icon: Sun, color: 'text-green-500' },
  { id: 'tomorrow', label: 'Amanhã', icon: Calendar, color: 'text-orange-500' },
  { id: 'this-week', label: 'Esta Semana', icon: CalendarDays, color: 'text-purple-500' },
  { id: 'planned', label: 'Planejado', icon: CalendarCheck, color: 'text-blue-500' },
  { id: 'completed', label: 'Concluído', icon: CheckCircle2, color: 'text-gray-400' },
  { id: 'tasks', label: 'Tarefas', icon: Inbox, color: 'text-blue-400' },
];

export function Sidebar() {
  const { currentFilter, setFilter, projects, tasks, addProject, updateProject, deleteProject } = useStore();
  const { counts } = useFilteredTasks();
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');

  // Extract unique tags
  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || []))).sort();

  const handleAddProject = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newProjectName.trim()) {
      const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6348', '#7bed9f', '#70a1ff'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      addProject({
        name: newProjectName.trim(),
        color: randomColor
      });
      setNewProjectName('');
      setIsAddingProject(false);
    } else if (e.key === 'Escape') {
      setIsAddingProject(false);
      setNewProjectName('');
    }
  };

  const handleEditProject = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      if (editProjectName.trim()) {
        updateProject(id, { name: editProjectName.trim() });
      }
      setEditingProjectId(null);
    } else if (e.key === 'Escape') {
      setEditingProjectId(null);
    }
  };

  return (
    <div className="w-64 h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col text-sm">
      {/* User Profile Area */}
      <div className="h-14 flex items-center px-4 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors">
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium mr-3">
          U
        </div>
        <span className="font-medium truncate flex-1">Usuário</span>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input 
            type="text" 
            placeholder="Buscar" 
            className="w-full bg-[var(--color-surface)] text-[var(--color-text)] rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] placeholder:text-[var(--color-text-muted)] transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = currentFilter === item.id;
            const Icon = item.icon;
            // Calculate counts
            const count = counts[item.id as keyof typeof counts] || 0;

            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2 rounded-md transition-colors group relative",
                  isActive ? "bg-[var(--color-surface-hover)]" : "hover:bg-[var(--color-surface)]"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1 bottom-1 w-1 bg-[var(--color-primary)] rounded-r-full"
                  />
                )}
                <Icon className={cn("w-4 h-4 mr-3", item.color)} />
                <span className="flex-1 text-left">{item.label}</span>
                <span className="text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
                  {count > 0 ? count : ''}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 px-5 mb-2 flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          <span>Projetos</span>
          <Plus 
            className="w-4 h-4 cursor-pointer hover:text-[var(--color-text)] transition-colors" 
            onClick={() => setIsAddingProject(true)}
          />
        </div>
        
        <nav className="space-y-0.5 px-2">
          {projects.map((project) => {
            const isActive = currentFilter === project.id;
            const count = tasks.filter(t => t.projectId === project.id && !t.completed).length;
            const isEditing = editingProjectId === project.id;
            
            return (
              <div key={project.id} className="relative group">
                {isEditing ? (
                  <div className="px-2 py-1">
                    <input
                      type="text"
                      value={editProjectName}
                      onChange={(e) => setEditProjectName(e.target.value)}
                      onKeyDown={(e) => handleEditProject(e, project.id)}
                      onBlur={() => {
                        if (editProjectName.trim()) updateProject(project.id, { name: editProjectName.trim() });
                        setEditingProjectId(null);
                      }}
                      className="w-full bg-[var(--color-surface)] text-[var(--color-text)] text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] border border-[var(--color-border)]"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setFilter(project.id)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 rounded-md transition-colors relative cursor-pointer",
                      isActive ? "bg-[var(--color-surface-hover)]" : "hover:bg-[var(--color-surface)]"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1 bottom-1 w-1 bg-[var(--color-primary)] rounded-r-full"
                      />
                    )}
                    <div className="w-2 h-2 rounded-full mr-4 ml-1" style={{ backgroundColor: project.color }} />
                    <span className="flex-1 text-left truncate pr-2">{project.name}</span>
                    <span className="text-xs text-[var(--color-text-muted)] group-hover:hidden transition-colors">
                      {count > 0 ? count : ''}
                    </span>
                    
                    {/* Hover Actions */}
                    <div className="hidden group-hover:flex items-center space-x-1 absolute right-2 bg-[var(--color-surface)] pl-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditProjectName(project.name);
                          setEditingProjectId(project.id);
                        }}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        title="Renomear"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Tem certeza que deseja deletar o projeto "${project.name}"? As tarefas serão movidas para a Caixa de Entrada.`)) {
                            deleteProject(project.id);
                          }
                        }}
                        className="p-1 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <AnimatePresence>
            {isAddingProject && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className="px-2 py-1"
              >
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={handleAddProject}
                  onBlur={() => {
                    if (!newProjectName.trim()) setIsAddingProject(false);
                  }}
                  placeholder="Nome do projeto..."
                  className="w-full bg-[var(--color-surface)] text-[var(--color-text)] text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] border border-[var(--color-border)]"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Tags Section */}
        {allTags.length > 0 && (
          <>
            <div className="mt-6 px-5 mb-2 flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              <span>Tags</span>
            </div>
            <nav className="space-y-0.5 px-2">
              {allTags.map((tag) => {
                const tagId = `tag:${tag}`;
                const isActive = currentFilter === tagId;
                const count = tasks.filter(t => !t.completed && t.tags?.includes(tag)).length;
                
                return (
                  <button
                    key={tag}
                    onClick={() => setFilter(tagId)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 rounded-md transition-colors group relative",
                      isActive ? "bg-[var(--color-surface-hover)] text-[var(--color-primary)]" : "hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1 bottom-1 w-1 bg-[var(--color-primary)] rounded-r-full"
                      />
                    )}
                    <Tag className="w-3.5 h-3.5 mr-3 ml-0.5" />
                    <span className="flex-1 text-left truncate">{tag}</span>
                    <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                      {count > 0 ? count : ''}
                    </span>
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[var(--color-border)] flex items-center justify-between text-[var(--color-text-muted)]">
        <button 
          onClick={() => setIsAddingProject(true)}
          className="flex items-center hover:text-[var(--color-primary)] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Projeto
        </button>
        <div className="flex space-x-2">
          <button className="p-1.5 hover:bg-[var(--color-surface)] rounded-md transition-colors">
            <Home className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-[var(--color-surface)] rounded-md transition-colors">
            <Folder className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
