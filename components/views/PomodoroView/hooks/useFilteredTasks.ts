import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Task } from '../store/types';

/**
 * Shared date-matching info needed by both filter and count logic.
 * Extracted to eliminate duplicate date calculations.
 */
interface TaskDateInfo {
  taskDate: Date | null;
  isDueToday: boolean;
  isDueTomorrow: boolean;
  isDueThisWeek: boolean;
  isOverdue: boolean;
  completedToday: boolean;
}

function getTaskDateInfo(
  task: Task,
  today: Date,
  tomorrow: Date,
  nextWeek: Date,
  todayDay: number,
  tomorrowDay: number,
  todayStr: string,
): TaskDateInfo {
  const taskDate = task.dueDate ? new Date(task.dueDate) : null;
  if (taskDate) taskDate.setHours(0, 0, 0, 0);

  return {
    taskDate,
    isDueToday: (taskDate && taskDate.getTime() === today.getTime()) || (task.recurringDays?.includes(todayDay)) || false,
    isDueTomorrow: (taskDate && taskDate.getTime() === tomorrow.getTime()) || (task.recurringDays?.includes(tomorrowDay)) || false,
    isDueThisWeek: (taskDate && taskDate >= today && taskDate <= nextWeek) || false,
    isOverdue: (taskDate && taskDate < today) || false,
    completedToday: task.lastCompletedDate === todayStr,
  };
}

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

  const today = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const nextWeek = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);

  const todayDay = today.getDay();
  const tomorrowDay = tomorrow.getDay();
  const todayStr = today.toISOString().split('T')[0];

  const result = useMemo(() => {
    // ---- Filter active tasks ----
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
        return false;
      }

      const isInbox = !task.projectId;
      if (currentFilter === 'tasks') return isInbox;

      const info = getTaskDateInfo(task, today, tomorrow, nextWeek, todayDay, tomorrowDay, todayStr);

      if (currentFilter === 'today') {
        if (info.completedToday) return false;
        return isInbox && ((!task.dueDate && !task.recurringDays?.length) || info.isDueToday || info.isOverdue);
      }
      if (currentFilter === 'tomorrow') {
        return isInbox && info.isDueTomorrow;
      }
      if (currentFilter === 'this-week') {
        if (info.completedToday && !info.isDueTomorrow && !info.isDueThisWeek) return false;
        return isInbox && (info.isDueThisWeek || info.isDueToday || info.isDueTomorrow || info.isOverdue);
      }

      if (currentFilter === 'planned') {
        return (info.taskDate && info.taskDate > today) || (task.recurringDays && task.recurringDays.length > 0);
      }

      if (isProjectFilter) return task.projectId === currentFilter;

      return true;
    }).sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // ---- Filter completed tasks ----
    const completedTasks = tasks.filter(task => {
      if (!task.completed) return false;
      if (currentFilter === 'completed') return true;
      if (isTagFilter) return task.tags?.includes(tagValue!);
      if (['tasks', 'today', 'tomorrow', 'this-week', 'planned'].includes(currentFilter)) return false;
      if (isProjectFilter) return task.projectId === currentFilter;
      return false;
    });

    const allCompletedCount = tasks.filter(t => t.completed).length;

    // ---- Calculate counts ----
    const counts: Record<string, number> = {
      today: 0,
      tomorrow: 0,
      'this-week': 0,
      planned: 0,
      tasks: 0,
      completed: allCompletedCount,
    };

    tasks.forEach(task => {
      if (task.completed) return;

      if (task.isInfinite) {
        counts.planned++;
        return;
      }

      const isInbox = !task.projectId;
      if (isInbox) counts.tasks++;

      const info = getTaskDateInfo(task, today, tomorrow, nextWeek, todayDay, tomorrowDay, todayStr);

      if (isInbox) {
        if (!info.completedToday && ((!task.dueDate && !task.recurringDays?.length) || info.isDueToday || info.isOverdue)) {
          counts.today++;
        }
        if (info.isDueTomorrow) counts.tomorrow++;
        if ((!info.completedToday || info.isDueTomorrow || info.isDueThisWeek) &&
            (info.isDueThisWeek || info.isDueToday || info.isDueTomorrow || info.isOverdue)) {
          counts['this-week']++;
        }
      }

      if ((info.taskDate && info.taskDate > today) || (task.recurringDays && task.recurringDays.length > 0)) {
        counts.planned++;
      }
    });

    return { activeTasks, completedTasks, allCompletedCount, counts };
  }, [
    tasks,
    currentFilter,
    isProjectFilter,
    isTagFilter,
    tagValue,
    today,
    tomorrow,
    nextWeek,
    todayDay,
    tomorrowDay,
    todayStr,
  ]);

  return result;
}
