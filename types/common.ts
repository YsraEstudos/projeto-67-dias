import { LucideIcon } from 'lucide-react';
import { OffensiveGoalsConfig } from './skills';

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  WORK = 'WORK',
  SUNDAY = 'SUNDAY',
  LINKS = 'LINKS',
  READING = 'READING',
  SKILLS = 'SKILLS',
  HABITS = 'HABITS',
  JOURNAL = 'JOURNAL',
  PROGRESS = 'PROGRESS',
  REST = 'REST',
  TOOLS = 'TOOLS',
  SETTINGS = 'SETTINGS',
  GAMES = 'GAMES',
  CONCURSO = 'CONCURSO',
  POMODORO = 'POMODORO',
  AULAS = 'AULAS',
}

export type AppTheme = 'default' | 'amoled';

export interface ProjectConfig {
  startDate: string; // ISO Date
  userName: string;
  isGuest: boolean;
  isProjectStarted?: boolean; // Se o projeto foi oficialmente iniciado (bloqueia edição de startDate)
  restartCount?: number; // Quantas vezes o plano foi reiniciado sem concluir
  offensiveGoals?: OffensiveGoalsConfig;
  theme?: AppTheme;  // Tema da aplicação
  lastSundayResetDate?: string; // Data do último reset automático de domingo (YYYY-MM-DD)
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
  statsAlert?: boolean;
  notificationCount?: number;
  onClick: (view: ViewState) => void;
  onAuxClick?: (view: ViewState) => void;
  onWarm?: (view: ViewState) => void;
}

export interface GlobalTimerState {
  mode: 'STOPWATCH' | 'TIMER';
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';
  startTime: number | null;
  endTime: number | null;
  accumulated: number;
  totalDuration: number;
  label?: string;
}

export interface StreakData {
  // Estado atual
  currentStreak: number;          // Dias consecutivos atuais
  longestStreak: number;          // Maior sequência histórica
  lastActiveDate: string | null;  // Última data ativa (YYYY-MM-DD) ou null

  // Freeze Days
  freezeDaysUsed: number;         // Freeze usados no streak atual (max 3)
  freezeDaysAvailable: number;    // Freeze disponíveis (3 - usados)

  // Histórico
  totalActiveDays: number;        // Total de dias ativos desde início
  totalFreezeUsed: number;        // Total histórico de freeze usados
  activeDates: string[];          // Array de datas ativas (YYYY-MM-DD)

  // Metadata
  streakStartDate: string | null; // Data início do streak atual
  lastStreakLostDate: string | null; // Última vez que perdeu streak
  createdAt: number;              // Timestamp de criação
}
