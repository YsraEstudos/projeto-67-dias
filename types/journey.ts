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

  // Sites/Links (Hub de conhecimento)
  sitesUpdated?: number;      // sites alterados na semana
  linksClicked?: number;      // links revisitados na semana
}

// Comparação de evolução entre semanas
export interface WeeklyEvolution {
  habitsChange: number;       // % diferença
  skillsChange: number;       // minutos diferença
  readingChange: number;      // páginas diferença
  gamesChange?: number;       // horas diferença (optional because it's new)
  linksChange?: number;       // cliques diferença (optional because it's new)
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
