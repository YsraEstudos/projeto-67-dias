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

// Bloco de template (sem data específica)
export interface TemplateBlock {
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  type: 'skill' | 'activity' | 'event';
  referenceId: string;
  color?: string;
  notes?: string;
}

// Template de dia reutilizável
export interface DayTemplate {
  id: string;
  name: string;                  // "Dia de Trabalho", "Feriado"
  blocks: TemplateBlock[];       // Blocos do template
  createdAt: number;
}

// Dados persistidos da Agenda Semanal
export interface WeeklyAgendaData {
  weeklyPlan: DayOfWeekPlan[];      // 7 dias padrão (pode ter menos se não configurado)
  overrides: DayOverride[];          // Ajustes pontuais
  activities: AgendaActivity[];      // Atividades extras (não são skills)
  events: CalendarEvent[];           // Eventos customizados
  scheduledBlocks: ScheduledBlock[]; // Blocos agendados no calendário
  templates?: DayTemplate[];         // Templates de dias reutilizáveis
}
