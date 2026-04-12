import { StateCreator } from 'zustand';
import { Task, Project, PomodoroRecord } from '../types';
import { StoreState } from '../useStore';

export interface TaskSlice {
  tasks: Task[];
  projects: Project[];
  records: PomodoroRecord[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addRecord: (record: Omit<PomodoroRecord, 'id'>) => void;
}

export const createTaskSlice: StateCreator<StoreState, [], [], TaskSlice> = (set) => ({
  tasks: [],
  projects: [{ id: 'p1', name: 'Trabalho', color: '#00a8ff' }],
  records: [],
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
  })),
  updateTask: (id, updates) => set((state) => {
    const isCompleting = updates.completed === true;
    return {
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      activeTaskId: isCompleting && state.activeTaskId === id ? null : state.activeTaskId
    };
  }),
  toggleTask: (id) => set((state) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return state;

    // Tarefas infinitas não podem ser concluídas
    if (task.isInfinite) {
      return state;
    }

    const isCompleting = !task.completed;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let newTasks = state.tasks.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          completed: isCompleting,
          completedAt: isCompleting ? now.toISOString() : null
        };
      }
      return t;
    });

    // Se estiver concluindo uma tarefa recorrente, cria um clone para o futuro
    if (isCompleting && task.recurringDays && task.recurringDays.length > 0) {
      const clone: Task = {
        ...task,
        id: crypto.randomUUID(),
        completed: false,
        completedAt: null,
        completedPomodoros: 0,
        createdAt: now.toISOString(),
        lastCompletedDate: todayStr,
        dueDate: null // Clear specific due date as it relies on recurringDays
      };
      newTasks.push(clone);
    }

    return { 
      tasks: newTasks,
      activeTaskId: isCompleting && state.activeTaskId === id ? null : state.activeTaskId
    };
  }),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id),
    selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    activeTaskId: state.activeTaskId === id ? null : state.activeTaskId
  })),
  addProject: (project) => set((state) => ({
    projects: [...state.projects, { ...project, id: crypto.randomUUID() }]
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    // Move tasks from deleted project to inbox
    tasks: state.tasks.map(t => t.projectId === id ? { ...t, projectId: undefined } : t),
    currentFilter: state.currentFilter === id ? 'tasks' : state.currentFilter
  })),
  addRecord: (record) => set((state) => ({
    records: [...state.records, { ...record, id: crypto.randomUUID() }]
  })),
});
