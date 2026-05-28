export interface FocusSkill {
  skillId: string;      // ID da skill selecionada
  weight: number;       // Peso desta skill (0-100, soma de todas = 100)
}

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
  completedAt?: number;
  type?: 'TASK' | 'SECTION';
  subTasks?: SkillRoadmapItem[];
}

export interface RoadmapBackup {
  id: string;
  createdAt: number;           // timestamp do import
  label?: string;              // Nome opcional (ex: "Roadmap JavaScript v2")
  previousRoadmap: SkillRoadmapItem[];  // Snapshot ANTES do import
}

export interface SkillLog {
  id: string;
  date: string;
  minutes: number;
  notes?: string;
}

export type VisualNodeType = 'main' | 'alternative' | 'optional' | 'info' | 'section';

export interface VisualRoadmapNode {
  id: string;
  title: string;
  type: VisualNodeType;
  x: number;  // Posição X no canvas
  y: number;  // Posição Y no canvas
  isCompleted: boolean;
  completedAt?: number;
  description?: string;
  children?: VisualRoadmapNode[]; // Para nós expandíveis
}

export interface VisualRoadmapConnection {
  id: string;
  sourceId: string;
  targetId: string;
  style: 'solid' | 'dashed';
}

export interface VisualRoadmap {
  nodes: VisualRoadmapNode[];
  connections: VisualRoadmapConnection[];
  rootId?: string; // Nó raiz para iniciar a visualização
}

export type RoadmapViewMode = 'tasks' | 'visual';

export interface MicroAchievement {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number;
  createdAt: number;
}

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
  unlockedSections?: string[];  // IDs das seções (SECTION) desbloqueadas

  // Weekly Agenda: Meta diária configurável (permanente)
  dailyGoalMinutes?: number;  // Meta diária padrão em minutos

  // Roadmap Backup History: Histórico de imports (máx 10)
  roadmapHistory?: RoadmapBackup[];
}
