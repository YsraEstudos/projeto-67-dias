// Modo de input da meta
export type GoalInputMode = 'COUNTER' | 'BOOLEAN' | 'TIME';

// Configuração de uma meta disponível (predefinida ou customizada)
export interface TimeSlotGoalConfig {
  id: string;                          // UUID ou slug ('ncm', 'anki', 'custom_xxx')
  label: string;                       // "NCM", "Anki", "Estudar SQL"
  icon: string;                        // Emoji
  color: string;                       // amber, violet, emerald...
  inputMode: GoalInputMode;            // COUNTER, BOOLEAN ou TIME
  isBuiltIn?: boolean;                 // true = predefinida (não deletável)
  createdAt: number;
}

// Configuração de um slot de tempo (4 slots com horários configuráveis)
export interface TimeSlotConfig {
  id: string;                          // 'slot1', 'slot2', 'slot3', 'slot4'
  startHour: number;                   // 8, 10, 14, 16
  endHour: number;                     // 10, 12, 16, 17
}

// Tarefa atribuída a um slot em data específica
export interface TimeSlotTask {
  id: string;                          // UUID
  goalId: string;                      // ID da meta (TimeSlotGoalConfig.id)
  slotId: string;                      // ID do slot
  date: string;                        // YYYY-MM-DD
  completed: boolean;
  count?: number;                      // Para inputMode: COUNTER
  minutes?: number;                    // Para inputMode: TIME
  completedAt?: number;
}

// Constantes de metas built-in
export const BUILT_IN_GOALS: TimeSlotGoalConfig[] = [
  { id: 'ncm', label: 'NCM', icon: '📋', color: 'amber', inputMode: 'COUNTER', isBuiltIn: true, createdAt: 0 },
  { id: 'anki', label: 'Anki', icon: '🧠', color: 'violet', inputMode: 'BOOLEAN', isBuiltIn: true, createdAt: 0 },
  { id: 'questoes', label: 'Questões', icon: '❓', color: 'emerald', inputMode: 'COUNTER', isBuiltIn: true, createdAt: 0 },
];

// Configuração padrão dos 4 time slots
export const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { id: 'slot1', startHour: 8, endHour: 10 },
  { id: 'slot2', startHour: 10, endHour: 12 },
  { id: 'slot3', startHour: 14, endHour: 16 },
  { id: 'slot4', startHour: 16, endHour: 17 },
];

// --- SCHEDULE BLOCKS (Metas por Horário) - DEPRECATED ---

/** @deprecated Use TimeSlotConfig instead */
export type ScheduleBlockType = 'NCM' | 'STUDY' | 'AJEITAR';

/** @deprecated Use TimeSlotConfig instead */
export interface ScheduleBlockConfig {
  id: ScheduleBlockType;
  label: string;
  startHour: number;
  endHour: number;
  icon: string;
  color: string;
}

/** @deprecated Use TimeSlotConfig instead */
export interface ScheduleBlockProgress {
  blockId: ScheduleBlockType;
  date: string;
  completed: boolean;
  count?: number;
  completedAt?: number;
}
