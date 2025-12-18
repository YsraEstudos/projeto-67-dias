
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
  GAMES = 'GAMES',
}

// --- MOOD TRACKER ---

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export const MOOD_CONFIG: Record<Mood, { label: string; color: string; value: number }> = {
  great: { label: 'Incrível', color: 'text-green-400', value: 5 },
  good: { label: 'Bem', color: 'text-yellow-400', value: 4 },
  neutral: { label: 'Normal', color: 'text-blue-400', value: 3 },
  bad: { label: 'Mal', color: 'text-orange-400', value: 2 },
  terrible: { label: 'Péssimo', color: 'text-red-400', value: 1 },
};

export interface ProjectConfig {
  startDate: string; // ISO Date
  userName: string;
  isGuest: boolean;
  restartCount?: number; // Quantas vezes o plano foi reiniciado sem concluir
  offensiveGoals?: OffensiveGoalsConfig;
}

// Skill com peso individual para ofensiva
export interface FocusSkill {
  skillId: string;      // ID da skill selecionada
  weight: number;       // Peso desta skill (0-100, soma de todas = 100)
}

// Configuração completa de metas de ofensiva
export interface OffensiveGoalsConfig {
  // Porcentagem mínima para ativar ofensiva (0-100)
  minimumPercentage: number;          // default: 50

  // Pesos por categoria (devem somar 100)
  categoryWeights: {
    skills: number;                   // default: 50
    reading: number;                  // default: 30
    games: number;                    // default: 20
  };

  // Skills em foco (vazio = considera todas)
  focusSkills: FocusSkill[];         // default: []

  // Meta diária de horas de jogo (para calcular %)
  dailyGameHoursGoal: number;        // default: 1
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

  // Daily Progress Tracking
  dailyGoal?: number; // Meta diária (páginas/capítulos)
  logs?: ReadingLog[];
}

export interface ReadingLog {
  id: string;
  date: string;        // YYYY-MM-DD
  pagesRead: number;
  bookId: string;
}

export interface RestActivityLink {
  id: string;
  label: string;
  url: string;
}

export interface RestActivity {
  id: string;
  title: string;
  isCompleted: boolean;
  type: 'DAILY' | 'WEEKLY' | 'ONCE';
  daysOfWeek?: number[];
  specificDate?: string;
  order: number;
  notes?: string;  // Comentários/notas da atividade
  links?: RestActivityLink[];  // Links associados à atividade
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
  value?: number; // Valor numérico registrado (minutos)
  subHabitsCompleted: string[];
}

export interface Habit {
  id: string;
  title: string;
  category: string;

  // Configuração de meta
  goalType?: 'BOOLEAN' | 'MAX_TIME' | 'MIN_TIME'; // Padrão: BOOLEAN
  frequency?: 'DAILY' | 'WEEKLY';   // Padrão: DAILY
  targetValue?: number;             // Meta em minutos (se aplicável)

  isNegative?: boolean;  // Hábito negativo (evitar) - marcar = falha (APENAS PARA BOOLEAN)
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
  type: 'VIDEO' | 'ARTICLE' | 'DOC' | 'OTHER' | 'PROMPT';
  promptId?: string; // ID do prompt vinculado (quando type === 'PROMPT')
}

export interface SkillRoadmapItem {
  id: string;
  title: string;
  isCompleted: boolean;
  type?: 'TASK' | 'SECTION';
  subTasks?: SkillRoadmapItem[];
}

export interface SkillLog {
  id: string;
  date: string;
  minutes: number;
  notes?: string;
}

// Tipo de nó no roadmap visual
export type VisualNodeType = 'main' | 'alternative' | 'optional' | 'info' | 'section';

// Nó individual do roadmap visual
export interface VisualRoadmapNode {
  id: string;
  title: string;
  type: VisualNodeType;
  x: number;  // Posição X no canvas
  y: number;  // Posição Y no canvas
  isCompleted: boolean;
  description?: string;
  children?: VisualRoadmapNode[]; // Para nós expandíveis
}

// Conexão entre nós
export interface VisualRoadmapConnection {
  id: string;
  sourceId: string;
  targetId: string;
  style: 'solid' | 'dashed';
}

// Estrutura completa do roadmap visual
export interface VisualRoadmap {
  nodes: VisualRoadmapNode[];
  connections: VisualRoadmapConnection[];
  rootId?: string; // Nó raiz para iniciar a visualização
}

// Modo de exibição do roadmap
export type RoadmapViewMode = 'tasks' | 'visual';

// --- MICRO-ACHIEVEMENTS SYSTEM ---

export interface MicroAchievement {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
}

// Content to prepare for the next day
export interface NextDayContent {
  id: string;
  title: string;
  url?: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: number;
}

// Content to prepare for the next day
export interface NextDayContent {
  id: string;
  title: string;
  url?: string;
  notes?: string;
  isCompleted: boolean;
  createdAt: number;
}

export type SkillGoalType = 'TIME' | 'POMODOROS';

export interface Skill {
  id: string;
  name: string;
  description?: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  currentMinutes: number;
  goalMinutes: number;
  resources: SkillResource[];
  roadmap: SkillRoadmapItem[];
  visualRoadmap?: VisualRoadmap;
  roadmapViewMode?: RoadmapViewMode;
  logs: SkillLog[];
  colorTheme: string;
  createdAt: number;

  // Micro-Achievements & Goal Type
  goalType?: SkillGoalType;
  pomodorosCompleted?: number;
  goalPomodoros?: number;
  microAchievements?: MicroAchievement[];

  // Next Day Content
  nextDayContents?: NextDayContent[];

  // Completion Status
  isCompleted?: boolean;
  completedAt?: number;
}

// --- PROMPTS MODULE INTERFACES ---

export interface PromptImage {
  id: string;
  url: string;
  caption?: string;
}

// Variável dinâmica em um prompt
// Formato no texto: {{nome|opção1,opção2,opção3}}
export interface PromptVariable {
  id: string;
  name: string;           // Nome da variável (ex: "especialidade")
  options: string[];      // Opções disponíveis (ex: ["web", "software", "react"])
  defaultIndex: number;   // Índice da opção padrão (0)
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  images: PromptImage[];
  variables?: PromptVariable[];  // Lista de variáveis dinâmicas extraídas do content
  copyCount: number;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PromptCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
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
  promptId?: string;  // ID do prompt vinculado
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


export interface Tag {
  id: string;      // UUID
  label: string;   // Display name
  color: string;   // Tailwind class (e.g. 'bg-red-500') or hex
  createdAt: number;
}

export type NoteColor = 'amber' | 'rose' | 'emerald' | 'blue' | 'purple' | 'cyan' | 'pink' | 'orange';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  tags: string[];
  isPinned: boolean;
  pinnedToTags: string[];  // IDs das tags onde a nota está fixada
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

// --- WEEKLY PROGRESS REVIEW SYSTEM ---

// Métricas capturadas em cada snapshot semanal
export interface WeeklyMetrics {
  habitsCompleted: number;
  habitsTotal: number;
  habitConsistency: number;   // % média da semana

  booksProgress: number;      // páginas lidas na semana
  booksCompleted: number;     // livros finalizados na semana

  skillMinutes: number;       // minutos de estudo na semana
  skillsProgressed: string[]; // IDs das skills avançadas

  tasksCompleted: number;     // tarefas concluídas
  journalEntries: number;     // entradas de diário

  // Games (apenas pasta 67 Days)
  gamesHoursPlayed: number;   // horas jogadas na semana
  gamesCompleted: number;     // jogos zerados na semana
  gamesReviewed: number;      // resenhas escritas na semana
}

// Comparação de evolução entre semanas
export interface WeeklyEvolution {
  habitsChange: number;       // % diferença
  skillsChange: number;       // minutos diferença
  readingChange: number;      // páginas diferença
  gamesChange?: number;       // horas diferença (optional because it's new)
  overallScore: number;       // 0-100 score calculado
  trend: 'UP' | 'DOWN' | 'STABLE';
}

// Snapshot semanal - captura estado de uma semana específica
export interface WeeklySnapshot {
  id: string;
  weekNumber: number;           // 1-10 (67 dias = ~10 semanas)
  startDate: string;            // ISO date
  endDate: string;              // ISO date
  capturedAt: number;           // timestamp

  metrics: WeeklyMetrics;
  evolution?: WeeklyEvolution;

  // Insights da IA
  aiInsights?: {
    summary: string;
    strengths: string[];
    improvements: string[];
    weeklyQuote: string;
  };

  // Status de confirmação
  status: 'PENDING' | 'CONFIRMED' | 'SKIPPED';
}

// Pontos de melhoria identificados
export interface ImprovementPoint {
  id: string;
  category: 'HABITS' | 'SKILLS' | 'READING' | 'TASKS' | 'JOURNAL';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  weekIdentified: number;
  isAddressed: boolean;
}

// Resumo final da jornada
export interface FinalJourneySummary {
  generatedAt: number;
  totalDays: number;

  // Estatísticas finais
  finalStats: {
    totalHabitsCompleted: number;
    averageConsistency: number;
    totalBooksRead: number;
    totalPagesRead: number;
    totalSkillHours: number;
    totalTasksCompleted: number;
    totalJournalEntries: number;
  };

  // Evolução geral
  evolutionCurve: number[];     // Score semanal 0-100
  bestWeek: number;
  challengingWeek: number;

  // Insights finais da IA
  aiReflection?: {
    overallAnalysis: string;
    topAchievements: string[];
    growthAreas: string[];
    personalMessage: string;
    philosophicalReflection: string;
  };
}

// Dados completos de revisão da jornada
export interface JourneyReviewData {
  snapshots: WeeklySnapshot[];
  improvements: ImprovementPoint[];
  finalSummary?: FinalJourneySummary;
  lastSnapshotWeek: number;
  pendingSnapshot?: WeeklySnapshot; // Snapshot aguardando confirmação
}

// --- GAMES MODULE INTERFACES ---

// Pasta central que conta para progresso/revisão
export const CENTRAL_FOLDER_ID = '67-days';
export const CENTRAL_FOLDER_NAME = '67 Days';

export const GAME_STATUSES = ['PLAYING', 'COMPLETED', 'WISHLIST', 'ABANDONED', 'PAUSED'] as const;
export type GameStatus = typeof GAME_STATUSES[number];

// Configuração centralizada de labels e cores para status de games
export const GAME_STATUS_CONFIG: Record<GameStatus, { label: string; color: string }> = {
  PLAYING: { label: 'Jogando', color: 'purple' },
  COMPLETED: { label: 'Zerado', color: 'emerald' },
  WISHLIST: { label: 'Desejado', color: 'blue' },
  ABANDONED: { label: 'Dropado', color: 'red' },
  PAUSED: { label: 'Pausado', color: 'amber' },
};

export const getGameStatusLabel = (status: GameStatus): string =>
  GAME_STATUS_CONFIG[status]?.label ?? status;


export interface GameFolder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  isProtected?: boolean;  // Pastas protegidas não podem ser excluídas
}

export interface GameMission {
  id: string;
  title: string;
  isCompleted: boolean;
  reward?: string; // XP or Text reward
}

export interface GameLog {
  id: string;
  date: string;
  hoursPlayed: number;
}

export interface Game {
  id: string;
  title: string;
  platform: string; // PC, PS5, Switch, etc.
  status: GameStatus;
  rating?: number; // 0-5 stars
  coverUrl?: string;

  folderId?: string; // Optional folder assignment

  // Time Tracking
  hoursPlayed: number;
  totalHoursEstimate?: number; // How long to beat?

  missions: GameMission[];
  history: GameLog[];

  notes?: string;

  // Sistema de resenhas
  review?: string;         // Texto da resenha
  reviewPending?: boolean; // Marcar para escrever resenha depois

  createdAt: number;
  updatedAt: number;
}

// --- STREAK SYSTEM INTERFACES ---

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
