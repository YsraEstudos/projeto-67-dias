export interface SubHabit {
  id: string;
  title: string;
}

export interface HabitLog {
  completed: boolean;
  value?: number; // Valor numérico registrado (minutos)
  subHabitsCompleted: string[];
}

/** Consequência ativada no dia seguinte quando condições de hábitos são atendidas */
export interface HabitConsequence {
  id: string;
  description: string;              // Ex: "Não jogar videogame"
  conditionHabitIds: string[];      // IDs dos hábitos que precisam ser marcados
  conditionType: 'ALL_MARKED' | 'ANY_MARKED'; // Lógica AND ou OR
}

/** Configuração do plano progressivo de 67 dias */
export interface ProgressivePlan {
  startDate: string;               // Data de início (YYYY-MM-DD)
  targetMinutes: number;           // Meta final em minutos por sessão
  daysPerWeek: number;             // Quantas vezes por semana (1-7)
  scheduledDays: number[];         // Dias da semana (0=Dom, 1=Seg, ..., 6=Sáb)
}

export interface Habit {
  id: string;
  title: string;
  category: string;

  // Configuração de meta
  goalType?: 'BOOLEAN' | 'MAX_TIME' | 'MIN_TIME' | 'COUNTER'; // Padrão: BOOLEAN
  frequency?: 'DAILY' | 'WEEKLY';   // Padrão: DAILY
  targetValue?: number;             // Meta em minutos (se aplicável)

  isNegative?: boolean;  // Hábito negativo (evitar) - marcar = falha (APENAS PARA BOOLEAN)
  subHabits: SubHabit[];
  history: Record<string, HabitLog>;
  createdAt: number;
  archived: boolean;

  // Sistema de consequências
  consequences?: HabitConsequence[];

  // Plano progressivo de 67 dias
  progressivePlan?: ProgressivePlan;
}
