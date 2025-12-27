
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

// Theme type for app appearance
export type AppTheme = 'default' | 'amoled';

export interface ProjectConfig {
  startDate: string; // ISO Date
  userName: string;
  isGuest: boolean;
  isProjectStarted?: boolean; // Se o projeto foi oficialmente iniciado (bloqueia edição de startDate)
  restartCount?: number; // Quantas vezes o plano foi reiniciado sem concluir
  offensiveGoals?: OffensiveGoalsConfig;
  theme?: AppTheme;  // Tema da aplicação
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

  // Módulos ativos para ofensiva (desativados são excluídos do cálculo)
  enabledModules: {
    skills: boolean;                  // default: true
    reading: boolean;                 // default: true
    games: boolean;                   // default: true
  };

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
  onAuxClick?: (view: ViewState) => void;
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
  addedAt: string | Date; // Permite string ISO para persistência fácil

  // Daily Progress Tracking
  dailyGoal?: number; // Meta diária (páginas/capítulos)
  logs?: ReadingLog[];

  // Exponential Distribution (sistema de fases igual às Skills)
  deadline?: string;                              // ISO date (YYYY-MM-DD)
  distributionType?: 'LINEAR' | 'EXPONENTIAL';    // LINEAR = padrão
  excludedDays?: number[];                        // 0=dom, 1=seg, ..., 6=sáb
  exponentialIntensity?: number;                  // 0.0-1.0 intensidade da curva
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

  // Deadline (data limite para completar a skill)
  deadline?: string; // ISO date (YYYY-MM-DD)

  // Completion Status
  isCompleted?: boolean;
  completedAt?: number;

  // Exponential Distribution Settings
  distributionType?: 'LINEAR' | 'EXPONENTIAL';  // LINEAR = padrão, EXPONENTIAL = crescimento progressivo
  excludedDays?: number[];  // Dias da semana excluídos (0=dom, 1=seg, ..., 6=sáb)
  exponentialIntensity?: number;  // 0.0 = linear, 1.0 = máximo (30%-170%)

  // Anti-Anxiety: Seções desbloqueadas no roadmap
  // Por padrão, apenas primeira seção é visível; demais precisam ser desbloqueadas via clique direito
  unlockedSections?: string[];  // IDs das seções (SECTION) desbloqueadas

  // Weekly Agenda: Meta diária configurável (permanente)
  dailyGoalMinutes?: number;  // Meta diária padrão em minutos
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
  order: number;       // Ordem dentro da categoria (para drag-and-drop)
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
  siteId: string;               // ID do site que contém este link
  folderId?: string | null;     // [NOVO] ID da pasta dentro do site (null = raiz do site)
  clickCount: number;
  lastClicked?: number;
  order: number;
  promptIds: string[];          // IDs dos prompts vinculados (múltiplos)
  /** @deprecated Use siteId. Mantido para migração. */
  categoryId?: string;
  /** @deprecated Use promptIds. Mantido para migração. */
  promptId?: string;
}

// --- SITE CATEGORIES ---

export interface SiteCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  isDefault?: boolean;    // Categorias padrão não podem ser deletadas
  parentId: string | null; // null = categoria raiz, string = subcategoria
  isCollapsed?: boolean;   // Estado de UI para árvore expandida/colapsada
}

// Agrupador de links relacionados (ex: Google → Drive, Docs, Gmail)
export interface Site {
  id: string;
  name: string;
  description?: string;
  categoryId: string;       // Categoria pai
  faviconUrl?: string;      // Cache do favicon principal
  order: number;
  promptIds?: string[];     // Prompts vinculados diretamente ao site
  createdAt: number;
  updatedAt: number;
}

// [NOVO] Pasta dentro de um Site para organizar links
export interface SiteFolder {
  id: string;
  name: string;
  siteId: string;           // Site pai
  color?: string;           // Cor opcional (slug de cor das constantes)
  order: number;
  isCollapsed?: boolean;    // Estado de UI (se deve esconder links)
  createdAt: number;
  updatedAt: number;
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
}

export interface NoteFilter {
  tags: string[];
  colors: NoteColor[];
  searchTerm: string;
  sortBy: 'recent' | 'oldest' | 'alphabetical' | 'color';
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

export interface WeeklySnapshot {
  id: string;
  weekNumber: number;           // 1-10 (67 dias = ~10 semanas)
  startDate: string;            // ISO date
  endDate: string;              // ISO date
  capturedAt: number;           // timestamp

  metrics: WeeklyMetrics;
  evolution?: WeeklyEvolution;

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
}

// Dados completos de revisão da jornada
export interface JourneyReviewData {
  snapshots: WeeklySnapshot[];
  improvements: ImprovementPoint[];
  finalSummary?: FinalJourneySummary;
  lastSnapshotWeek: number;
  pendingSnapshot?: WeeklySnapshot; // Snapshot aguardando confirmação

  // Sistema de Ciclos (10 Anos)
  decadeProgress?: DecadeProgress;
  pendingCycleGoal?: string;    // Objetivo sendo escrito antes de finalizar
}

// --- DECADE PROGRESS SYSTEM (10 Anos / 55 Ciclos) ---

// Snapshot de um ciclo completado (dados arquivados, NÃO zerados)
export interface CycleSnapshot {
  cycleNumber: number;          // 1-55
  startDate: string;            // ISO date de início do ciclo
  endDate: string;              // ISO date de conclusão do ciclo
  completedAt: number;          // timestamp de conclusão

  // Objetivo obrigatório definido pelo usuário
  cycleGoal: string;            // "Onde quero chegar" - texto livre (min 20 chars)
  goalAchieved?: 'YES' | 'PARTIAL' | 'NO';  // Auto-avaliação ao finalizar

  // Estatísticas finais do ciclo (snapshot, não reset)
  finalStats: {
    totalHabitsCompleted: number;
    averageConsistency: number;
    totalBooksRead: number;
    totalPagesRead: number;
    totalSkillHours: number;
    totalTasksCompleted: number;
    totalJournalEntries: number;
    overallScore: number;       // Score médio das 10 semanas
  };

  // Referência aos snapshots semanais do ciclo
  weeklySnapshots: WeeklySnapshot[];
}

// Dados de progresso da década (10 anos = 55 ciclos)
export interface DecadeProgress {
  currentCycle: number;           // 1-55 (ciclo atual)
  cycleHistory: CycleSnapshot[];  // Histórico de ciclos completados
  decadeStartDate: string;        // Data de início da jornada de 10 anos
  isDecadeComplete: boolean;      // Se completou todos os 55 ciclos
  pendingCycleGoal?: string;      // Objetivo sendo escrito (antes de finalizar)

  // Estatísticas agregadas (calculadas on-demand)
  totalStats?: {
    cyclesCompleted: number;
    totalDaysProgressed: number;
    bestCycle?: number;           // Ciclo com melhor score
    averageScore?: number;        // Score médio de todos os ciclos
  };
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

// --- WEEKLY AGENDA INTERFACES ---

// Log de tempo para atividade extra da agenda
export interface AgendaActivityLog {
  id: string;
  date: string;        // YYYY-MM-DD
  minutes: number;
}

// Atividade extra na agenda (não é skill)
export interface AgendaActivity {
  id: string;
  title: string;
  dailyGoalMinutes: number;      // Meta para esta atividade
  color: string;                  // Cor do card (ex: 'blue', 'rose')
  notes?: string;                 // Comentários do usuário
  logs: AgendaActivityLog[];      // Histórico de tempo
  createdAt: number;
}

// Configuração de metas para um dia da semana
export interface DayOfWeekPlan {
  dayOfWeek: number;              // 0-6 (dom-sáb)
  skillGoals: {                   // Metas por skill
    skillId: string;
    targetMinutes: number;
  }[];
  activityGoals: {                // Metas por atividade extra
    activityId: string;
    targetMinutes: number;
  }[];
}

// Override para dia específico (ex: feriado, imprevistos)
export interface DayOverride {
  date: string;                   // YYYY-MM-DD
  reason?: string;                // "Feriado", "Disponibilidade extra"
  skillGoals: { skillId: string; targetMinutes: number }[];
  activityGoals: { activityId: string; targetMinutes: number }[];
}

// --- CALENDAR STYLE AGENDA (Google Calendar) ---

// Bloco agendado no calendário
export interface ScheduledBlock {
  id: string;
  date: string;              // YYYY-MM-DD
  startHour: number;         // 0-23 (ex: 14)
  startMinute: number;       // 0-59 (ex: 30 = 14:30)
  durationMinutes: number;   // duração em minutos

  // Tipo de item (mutual exclusive)
  type: 'skill' | 'activity' | 'event';
  referenceId: string;       // ID da skill, activity ou event

  notes?: string;
  color?: string;            // Override de cor
}

// Evento customizado (não vinculado a skill/activity existente)
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  color: string;
  defaultDurationMinutes: number;
  createdAt: number;
}

// Dados persistidos da Agenda Semanal
export interface WeeklyAgendaData {
  weeklyPlan: DayOfWeekPlan[];      // 7 dias padrão (pode ter menos se não configurado)
  overrides: DayOverride[];          // Ajustes pontuais
  activities: AgendaActivity[];      // Atividades extras (não são skills)
  events: CalendarEvent[];           // Eventos customizados
  scheduledBlocks: ScheduledBlock[]; // Blocos agendados no calendário
}
