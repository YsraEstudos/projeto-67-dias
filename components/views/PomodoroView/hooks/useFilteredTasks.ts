import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useFilteredTasks() {
  const tasks = useStore(state => state.tasks);
  const currentFilter = useStore(state => state.currentFilter);
  const projects = useStore(state => state.projects);
  
  // Force re-render every minute to keep dates fresh (e.g. crossing midnight)
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isProjectFilter = projects.some(p => p.id === currentFilter);
  const isTagFilter = currentFilter.startsWith('tag:');
  const tagValue = isTagFilter ? currentFilter.replace('tag:', '') : null;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const todayDay = today.getDay();
  const tomorrowDay = tomorrow.getDay();
  const todayStr = today.toISOString().split('T')[0];

  const activeTasks = tasks.filter(task => {
    if (task.completed) return false;
    if (currentFilter === 'completed') return false;

    if (isTagFilter) {
      return task.tags?.includes(tagValue!);
    }

    // Tarefas "Eternas" (Infinitas) só aparecem no Planejado ou dentro do próprio projeto
    if (task.isInfinite) {
      if (currentFilter === 'planned') return true;
      if (isProjectFilter && task.projectId === currentFilter) return true;
      return false; // Esconde de Hoje, Amanhã, Esta Semana e Tarefas
    }

    const isInbox = !task.projectId; // Tarefas rápidas (sem projeto)

    if (currentFilter === 'tasks') return isInbox;

    const taskDate = task.dueDate ? new Date(task.dueDate) : null;
    if (taskDate) taskDate.setHours(0, 0, 0, 0);

    const isDueToday = (taskDate && taskDate.getTime() === today.getTime()) || (task.recurringDays?.includes(todayDay));
    const isDueTomorrow = (taskDate && taskDate.getTime() === tomorrow.getTime()) || (task.recurringDays?.includes(tomorrowDay));
    const isDueThisWeek = taskDate && taskDate >= today && taskDate <= nextWeek;
    const isOverdue = taskDate && taskDate < today;
    
    const completedToday = task.lastCompletedDate === todayStr;

    // Filtros de tempo (Hoje, Amanhã, Esta Semana) focados APENAS em tarefas rápidas (Inbox)
    if (currentFilter === 'today') {
      if (completedToday) return false;
      return isInbox && ((!task.dueDate && !task.recurringDays?.length) || isDueToday || isOverdue);
    }
    if (currentFilter === 'tomorrow') {
      return isInbox && isDueTomorrow;
    }
    if (currentFilter === 'this-week') {
      if (completedToday && !isDueTomorrow && !isDueThisWeek) return false;
      return isInbox && (isDueThisWeek || isDueToday || isDueTomorrow || isOverdue);
    }
    
    if (currentFilter === 'planned') {
      return (taskDate && taskDate > today) || (task.recurringDays && task.recurringDays.length > 0);
    }

    if (isProjectFilter) return task.projectId === currentFilter;

    return true;
  }).sort((a, b) => {
    // Sort by priority (descending)
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const completedTasks = tasks.filter(task => {
    if (!task.completed) return false;
    if (currentFilter === 'completed') return true;
    if (isTagFilter) return task.tags?.includes(tagValue!);
    if (currentFilter === 'tasks') return false;
    if (currentFilter === 'today') return false;
    if (currentFilter === 'tomorrow') return false;
    if (currentFilter === 'this-week') return false;
    if (currentFilter === 'planned') return false;
    if (isProjectFilter) return task.projectId === currentFilter;
    return false;
  });

  const allCompletedCount = tasks.filter(t => t.completed).length;

  const counts = {
    today: 0,
    tomorrow: 0,
    'this-week': 0,
    planned: 0,
    tasks: 0,
    completed: allCompletedCount
  };

  tasks.forEach(task => {
    if (task.completed) return;

    if (task.isInfinite) {
      counts.planned++;
      return;
    }

    const isInbox = !task.projectId;
    if (isInbox) counts.tasks++;

    const taskDate = task.dueDate ? new Date(task.dueDate) : null;
    if (taskDate) taskDate.setHours(0, 0, 0, 0);

    const isDueToday = (taskDate && taskDate.getTime() === today.getTime()) || (task.recurringDays?.includes(todayDay));
    const isDueTomorrow = (taskDate && taskDate.getTime() === tomorrow.getTime()) || (task.recurringDays?.includes(tomorrowDay));
    const isDueThisWeek = taskDate && taskDate >= today && taskDate <= nextWeek;
    const isOverdue = taskDate && taskDate < today;
    const completedToday = task.lastCompletedDate === todayStr;

    if (isInbox) {
      if (!completedToday && ((!task.dueDate && !task.recurringDays?.length) || isDueToday || isOverdue)) counts.today++;
      if (isDueTomorrow) counts.tomorrow++;
      if ((!completedToday || isDueTomorrow || isDueThisWeek) && (isDueThisWeek || isDueToday || isDueTomorrow || isOverdue)) counts['this-week']++;
    }

    if ((taskDate && taskDate > today) || (task.recurringDays && task.recurringDays.length > 0)) {
      counts.planned++;
    }
  });

  return { activeTasks, completedTasks, allCompletedCount, counts };
}
