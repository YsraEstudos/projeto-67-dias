export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface OrganizeTask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number;
  isArchived: boolean;
  category: string;
  dueDate?: string;
  reminderDate?: string;
  createdAt: number;
}

// Tarefa ou Hábito selecionado para fazer durante tempo ocioso no trabalho
export interface IdleTask {
  id: string;                       // UUID interno
  sourceType: 'TASK' | 'HABIT';     // De onde veio (Task ou Habit do HabitsStore)
  sourceId: string;                 // ID original no HabitsStore
  title: string;                    // Cache do título (snapshot quando adicionou)
  points: number;                   // Pontos configuráveis (default: 5)
  addedAt: number;                  // Timestamp quando foi adicionado
}
