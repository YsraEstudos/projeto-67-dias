export interface DailyPlannerPreferences {
  defaultSleepTime: string;          // HH:mm
  defaultWindDownMinutes: number;    // Janela final sem tarefas
  mealDurationMinutes: number;       // Duração padrão da refeição
  dogDurationMinutes: number;        // Duração padrão para levar a Irlanda
}

export interface DailyPlannerDayInputs {
  sleepTime: string;                 // HH:mm
  windDownMinutes: number;
  mealPending: boolean;
  mealDurationMinutes: number;
  dogPending: boolean;
  dogDurationMinutes: number;
  pendingTasksText: string;
}

export type DailyPlannerMessageRole = 'user' | 'assistant';

export interface DailyPlannerMessage {
  id: string;
  role: DailyPlannerMessageRole;
  text: string;
  createdAt: number;
}

export type DailyPlannerBlockCategory =
  | 'focus'
  | 'meal'
  | 'dog'
  | 'wind-down'
  | 'admin'
  | 'personal'
  | 'rest'
  | 'buffer'
  | 'other';

export interface DailyPlannerBlock {
  id: string;
  title: string;
  category: DailyPlannerBlockCategory;
  startTime: string;                // HH:mm
  endTime: string;                  // HH:mm
  durationMinutes: number;
  reason: string;
  required: boolean;
}

export interface DailyPlannerDeferredItem {
  title: string;
  reason: string;
  suggestedNextStep: string;
}

export interface DailyPlannerTimeSummary {
  currentTime: string;              // HH:mm
  sleepTime: string;                // HH:mm
  windDownStart: string;            // HH:mm
  availableMinutes: number;
  reservedMinutes: number;
  scheduledMinutes: number;
  freeBufferMinutes: number;
}

export interface DailyPlannerPlan {
  assistantMessage: string;
  encouragement: string;
  timeSummary: DailyPlannerTimeSummary;
  scheduledBlocks: DailyPlannerBlock[];
  deferredItems: DailyPlannerDeferredItem[];
  generatedAt: number;
}

export interface DailyPlannerSession {
  date: string;                     // YYYY-MM-DD
  dayInputs: DailyPlannerDayInputs;
  draftMessage: string;
  messages: DailyPlannerMessage[];
  latestPlan: DailyPlannerPlan | null;
  completedBlockIds: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: number;
}
