export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  lastCompletedDate?: string | null;
};

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  estimatedPomodoros: number;
  completedPomodoros: number;
  projectId?: string;
  createdAt: string;
  priority?: number; // 0: none, 1: low, 2: medium, 3: high
  tags?: string[];
  dueDate?: string | null;
  reminder?: string | null;
  repeat?: string | null;
  recurringDays?: number[]; // 0-6 for Sunday-Saturday
  subtasks?: Subtask[];
  notes?: string;
  isInfinite?: boolean;
  completedAt?: string | null;
  lastCompletedDate?: string | null;
};

export type Project = {
  id: string;
  name: string;
  color: string;
};

export type PomodoroRecord = {
  id: string;
  taskId?: string;
  duration: number; // in minutes
  startTime: string;
  endTime: string;
};

export type PomodoroTimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export type PomodoroTimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED';

export type PomodoroTimerState = {
  mode: PomodoroTimerMode;
  status: PomodoroTimerStatus;
  timeLeft: number;
  endTime: number | null;
  sessionCount: number;
};

export type BreakSelectionSource = 'REST_ACTIVITY' | 'QUICK_OPTION';

export type BreakSelection = {
  key: string;
  label: string;
  source: BreakSelectionSource;
};

export type BreakExerciseStat = {
  reps: number;
  updatedAt: string;
};

export type Settings = {
  pomodoroLength: number;
  shortBreakLength: number;
  longBreakLength: number;
  longBreakAfter: number;
  autoStartPomodoro: boolean;
  autoStartBreak: boolean;
  disableBreak: boolean;
  alarmSound: string;
  tickSound: string;
  volume: number;
  previousVolume?: number;
  desktopNotifications: boolean;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  dailyGoal: number;
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
};
