export type DuoQuestionType = 'choice' | 'output' | 'fill' | 'blocks' | 'code_fix' | 'boolean';

export interface DuoNode {
  id: string;
  title: string;
  conceptId: string;
  unitId: number;
  icon?: string;
  xpReward?: number;
  gemsReward?: number;
}

export interface DuoUnit {
  id: number;
  title: string;
  subtitle: string;
  desc: string;
  colorTheme: {
    primary: string;
    border: string;
    bg: string;
    badge: string;
  };
  nodes: DuoNode[];
}

export interface DuoQuestion {
  id: string;
  conceptId: string;
  unitId?: number;
  type: DuoQuestionType;
  title: string;
  codeSnippet?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  promptBlocks?: string[];
  correctOrder?: string[];
  explanation: string;
  hint?: string;
}

export interface DuoCodeExample {
  title: string;
  code: string;
  explanation: string;
}

export interface DuoComparisonItem {
  feature: string;
  values: Record<string, string>;
}

export interface DuoTheory {
  id: string;
  conceptId: string;
  title: string;
  category: 'Fundamentos' | 'Controle de Fluxo' | 'Funções' | 'Coleções & Arrays' | 'POO & Protótipos' | 'Assíncrono' | 'DOM & Web' | 'Avançado';
  summary: string;
  whatIsIt: string;
  whyItMatters: string;
  comparison?: {
    headers: string[];
    rows: DuoComparisonItem[];
  };
  codeExamples: DuoCodeExample[];
  pitfalls: string[];
  tags: string[];
  relatedConcepts: string[];
  unitId?: number;
}

export interface DuoUserData {
  xp: number;
  gems: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  lastDate: string | null;
  completedNodes: string[];
  mastery: Record<string, number>; // conceptId -> 0..100%
  unlockedChests: number[]; // unitId array
  unlockedTheories: string[];
}

export type DuoTab = 'path' | 'theories' | 'practice' | 'profile';
