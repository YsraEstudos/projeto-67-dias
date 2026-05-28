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
  goalType?: 'BOOLEAN' | 'MAX_TIME' | 'MIN_TIME' | 'COUNTER'; // Padrão: BOOLEAN
  frequency?: 'DAILY' | 'WEEKLY';   // Padrão: DAILY
  targetValue?: number;             // Meta em minutos (se aplicável)

  isNegative?: boolean;  // Hábito negativo (evitar) - marcar = falha (APENAS PARA BOOLEAN)
  subHabits: SubHabit[];
  history: Record<string, HabitLog>;
  createdAt: number;
  archived: boolean;
}
