
import { LucideIcon } from 'lucide-react';

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  WORK = 'WORK',
  SUNDAY = 'SUNDAY', // Was STUDY
  LINKS = 'LINKS',
  READING = 'READING',
  SKILLS = 'SKILLS',
  HABITS = 'HABITS',
  JOURNAL = 'JOURNAL',
  PROGRESS = 'PROGRESS',
  REST = 'REST',
  TOOLS = 'TOOLS',
  SETTINGS = 'SETTINGS',
}

export interface ProjectConfig {
  startDate: string; // ISO Date
  userName: string;
  isGuest: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGuest: boolean;
}

export interface DashboardCardProps {
  id: ViewState;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  stats?: string;
  notificationCount?: number;
  onClick: (view: ViewState) => void;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  genre: string;

  unit: 'PAGES' | 'CHAPTERS';
  total: number;
  current: number;

  status: 'READING' | 'TO_READ' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  rating: number;
  folderId: string | null;

  notes: string;
  addedAt: Date;
}

export interface RestActivity {
  id: string;
  title: string;
  isCompleted: boolean;
  type: 'DAILY' | 'WEEKLY' | 'ONCE';
  daysOfWeek?: number[];
  specificDate?: string;
  order: number;
}

export interface OrganizeTask {
  id: string;
  title: string;
  isCompleted: boolean;
  isArchived: boolean;
  category: string;
  dueDate?: string;
  reminderDate?: string;
  createdAt: number;
}

// --- SUNDAY RESET (AJEITAR RÁPIDO) ---

export interface SundaySubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface SundayTask {
  id: string;
  title: string;
  subTasks: SundaySubTask[];
  isArchived: boolean; // Moves to bottom list
  createdAt: number;
}

// --- HABITS INTERFACES ---

export interface SubHabit {
  id: string;
  title: string;
}

export interface HabitLog {
  completed: boolean;
  subHabitsCompleted: string[];
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  subHabits: SubHabit[];
  history: Record<string, HabitLog>;
  createdAt: number;
  archived: boolean;
}

// --- SKILL TREE INTERFACES ---

export interface SkillResource {
  id: string;
  title: string;
  url: string;
  type: 'VIDEO' | 'ARTICLE' | 'DOC' | 'OTHER';
}

export interface SkillRoadmapItem {
  id: string;
  title: string;
  isCompleted: boolean;
  type?: 'TASK' | 'SECTION';
}

export interface SkillLog {
  id: string;
  date: string;
  minutes: number;
  notes?: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  currentMinutes: number;
  goalMinutes: number;
  resources: SkillResource[];
  roadmap: SkillRoadmapItem[];
  logs: SkillLog[];
  colorTheme: string;
  createdAt: number;
}

// --- LINK HUB INTERFACES ---

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: 'PERSONAL' | 'GENERAL';
  clickCount: number;
  lastClicked?: number;
  order: number;
}

// --- GLOBAL TIMER INTERFACE ---
export interface GlobalTimerState {
  mode: 'STOPWATCH' | 'TIMER';
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';
  startTime: number | null;
  endTime: number | null;
  accumulated: number;
  totalDuration: number;
  label?: string;
}

// --- NOTES MODULE INTERFACES ---

export type NoteColor = 'amber' | 'rose' | 'emerald' | 'blue' | 'purple' | 'cyan' | 'pink' | 'orange';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  aiProcessed?: boolean; // If improved by AI
  aiSummary?: string;    // AI-generated summary
}

export interface NoteFilter {
  tags: string[];
  colors: NoteColor[];
  searchTerm: string;
  sortBy: 'recent' | 'oldest' | 'alphabetical' | 'color';
}

export interface AIAssistantAction {
  type: 'summarize' | 'expand' | 'improve' | 'suggest-tags';
  loading: boolean;
  result?: string;
}
