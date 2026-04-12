import { create } from 'zustand';
import { writeToFirestore } from './firestoreSync';
import type {
  BreakSelection,
  PomodoroRecord,
  Project,
  Settings,
  Task,
} from '../components/views/PomodoroView/store/types';

const STORE_KEY = 'pomodoro-storage';

const DEFAULT_PROJECTS: Project[] = [{ id: 'p1', name: 'Trabalho', color: '#00a8ff' }];

const DEFAULT_SETTINGS: Settings = {
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  longBreakAfter: 4,
  autoStartPomodoro: false,
  autoStartBreak: false,
  disableBreak: false,
  alarmSound: 'bell',
  tickSound: 'none',
  volume: 50,
  desktopNotifications: false,
  theme: 'dark',
  accentColor: '#f43f5e',
  dailyGoal: 8,
  weekStartsOn: 1,
};

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const createDefaultPersistentState = () => ({
  tasks: [] as Task[],
  projects: [...DEFAULT_PROJECTS],
  records: [] as PomodoroRecord[],
  settings: { ...DEFAULT_SETTINGS },
  activeTaskId: null as string | null,
  shortBreakSelection: null as BreakSelection | null,
  longBreakSelection: null as BreakSelection | null,
});

type PomodoroPersistentState = ReturnType<typeof createDefaultPersistentState>;

export interface PomodoroStoreState {
  tasks: Task[];
  projects: Project[];
  records: PomodoroRecord[];
  settings: Settings;

  currentFilter: string;
  isReportOpen: boolean;
  isSettingsOpen: boolean;
  selectedTaskId: string | null;
  activeTaskId: string | null;
  shortBreakSelection: BreakSelection | null;
  longBreakSelection: BreakSelection | null;

  isLoading: boolean;
  _initialized: boolean;

  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addRecord: (record: Omit<PomodoroRecord, 'id'>) => void;

  updateSettings: (updates: Partial<Settings>) => void;

  setFilter: (filter: string) => void;
  setReportOpen: (isOpen: boolean) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setSelectedTaskId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
  setBreakSelection: (mode: 'shortBreak' | 'longBreak', selection: BreakSelection) => void;
  clearBreakSelection: (mode: 'shortBreak' | 'longBreak') => void;

  exportData: () => string;
  importData: (data: string) => void;
  resetData: () => void;

  _syncToFirestore: () => void;
  _hydrateFromFirestore: (data: Partial<PomodoroPersistentState> | null) => void;
  _reset: () => void;
}

const getPersistentState = (state: PomodoroStoreState): PomodoroPersistentState => ({
  tasks: state.tasks,
  projects: state.projects,
  records: state.records,
  settings: state.settings,
  activeTaskId: state.activeTaskId,
  shortBreakSelection: state.shortBreakSelection,
  longBreakSelection: state.longBreakSelection,
});

const mergeSettings = (incoming?: Partial<Settings>): Settings => {
  if (!incoming) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    ...DEFAULT_SETTINGS,
    ...incoming,
  };
};

export const usePomodoroStore = create<PomodoroStoreState>()((set, get) => {
  const defaults = createDefaultPersistentState();

  return {
    ...defaults,
    currentFilter: 'today',
    isReportOpen: false,
    isSettingsOpen: false,
    selectedTaskId: null,

    isLoading: true,
    _initialized: false,

    addTask: (task) => {
      set((state) => ({
        tasks: [...state.tasks, { ...task, id: createId(), createdAt: new Date().toISOString() }],
      }));
      get()._syncToFirestore();
    },

    updateTask: (id, updates) => {
      set((state) => {
        const isCompleting = updates.completed === true;
        return {
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
          activeTaskId: isCompleting && state.activeTaskId === id ? null : state.activeTaskId,
        };
      });
      get()._syncToFirestore();
    },

    toggleTask: (id) => {
      set((state) => {
        const task = state.tasks.find((item) => item.id === id);
        if (!task || task.isInfinite) {
          return state;
        }

        const isCompleting = !task.completed;
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const updatedTasks = state.tasks.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            completed: isCompleting,
            completedAt: isCompleting ? now.toISOString() : null,
          };
        });

        if (isCompleting && task.recurringDays && task.recurringDays.length > 0) {
          updatedTasks.push({
            ...task,
            id: createId(),
            completed: false,
            completedAt: null,
            completedPomodoros: 0,
            createdAt: now.toISOString(),
            lastCompletedDate: today,
            dueDate: null,
          });
        }

        return {
          tasks: updatedTasks,
          activeTaskId: isCompleting && state.activeTaskId === id ? null : state.activeTaskId,
        };
      });
      get()._syncToFirestore();
    },

    deleteTask: (id) => {
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
      }));
      get()._syncToFirestore();
    },

    addProject: (project) => {
      set((state) => ({
        projects: [...state.projects, { ...project, id: createId() }],
      }));
      get()._syncToFirestore();
    },

    updateProject: (id, updates) => {
      set((state) => ({
        projects: state.projects.map((project) => (project.id === id ? { ...project, ...updates } : project)),
      }));
      get()._syncToFirestore();
    },

    deleteProject: (id) => {
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
        tasks: state.tasks.map((task) =>
          task.projectId === id ? { ...task, projectId: undefined } : task
        ),
        currentFilter: state.currentFilter === id ? 'tasks' : state.currentFilter,
      }));
      get()._syncToFirestore();
    },

    addRecord: (record) => {
      set((state) => ({
        records: [...state.records, { ...record, id: createId() }],
      }));
      get()._syncToFirestore();
    },

    updateSettings: (updates) => {
      set((state) => ({
        settings: { ...state.settings, ...updates },
      }));
      get()._syncToFirestore();
    },

    setFilter: (filter) => {
      set({ currentFilter: filter, selectedTaskId: null });
    },

    setReportOpen: (isOpen) => {
      set({ isReportOpen: isOpen });
    },

    setSettingsOpen: (isOpen) => {
      set({ isSettingsOpen: isOpen });
    },

    setSelectedTaskId: (id) => {
      set({ selectedTaskId: id });
    },

    setActiveTaskId: (id) => {
      set({ activeTaskId: id });
      get()._syncToFirestore();
    },

    setBreakSelection: (mode, selection) => {
      if (mode === 'shortBreak') {
        set({ shortBreakSelection: selection });
      } else {
        set({ longBreakSelection: selection });
      }
      get()._syncToFirestore();
    },

    clearBreakSelection: (mode) => {
      if (mode === 'shortBreak') {
        set({ shortBreakSelection: null });
      } else {
        set({ longBreakSelection: null });
      }
      get()._syncToFirestore();
    },

    exportData: () => {
      const state = get();
      return JSON.stringify({
        tasks: state.tasks,
        projects: state.projects,
        records: state.records,
        settings: state.settings,
        shortBreakSelection: state.shortBreakSelection,
        longBreakSelection: state.longBreakSelection,
      });
    },

    importData: (data) => {
      try {
        const parsed = JSON.parse(data) as Partial<PomodoroPersistentState>;
        set({
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
          projects: Array.isArray(parsed.projects) && parsed.projects.length > 0
            ? parsed.projects
            : [...DEFAULT_PROJECTS],
          records: Array.isArray(parsed.records) ? parsed.records : [],
          settings: mergeSettings(parsed.settings),
          shortBreakSelection: parsed.shortBreakSelection ?? null,
          longBreakSelection: parsed.longBreakSelection ?? null,
          activeTaskId: null,
          selectedTaskId: null,
          currentFilter: 'today',
        });
        get()._syncToFirestore();
      } catch (error) {
        console.error('Failed to import pomodoro data', error);
      }
    },

    resetData: () => {
      set({
        ...createDefaultPersistentState(),
        currentFilter: 'today',
        selectedTaskId: null,
        isReportOpen: false,
        isSettingsOpen: false,
      });
      get()._syncToFirestore();
    },

    _syncToFirestore: () => {
      const state = get();
      if (!state._initialized) return;
      writeToFirestore(STORE_KEY, getPersistentState(state));
    },

    _hydrateFromFirestore: (data) => {
      if (data) {
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        const projects = Array.isArray(data.projects) && data.projects.length > 0
          ? data.projects
          : [...DEFAULT_PROJECTS];

        const activeTaskId = typeof data.activeTaskId === 'string'
          ? data.activeTaskId
          : null;

        set({
          tasks,
          projects,
          records: Array.isArray(data.records) ? data.records : [],
          settings: mergeSettings(data.settings),
          shortBreakSelection: data.shortBreakSelection ?? null,
          longBreakSelection: data.longBreakSelection ?? null,
          activeTaskId: activeTaskId && tasks.some((task) => task.id === activeTaskId)
            ? activeTaskId
            : null,
          selectedTaskId: null,
          isLoading: false,
          _initialized: true,
        });
        return;
      }

      set({
        isLoading: false,
        _initialized: true,
      });
    },

    _reset: () => {
      set({
        ...createDefaultPersistentState(),
        currentFilter: 'today',
        isReportOpen: false,
        isSettingsOpen: false,
        selectedTaskId: null,
        isLoading: true,
        _initialized: false,
      });
    },
  };
});
