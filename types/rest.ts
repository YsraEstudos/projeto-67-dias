export interface RestActivityLink {
  id: string;
  label: string;
  url: string;
}

export interface RestActivitySeries {
  id: string;
  label: string;
  isCompleted: boolean;
  completedAt?: number;
  order: number;
}

export interface RestActivity {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number;
  totalSets?: number;
  completedSets?: number;
  series?: RestActivitySeries[];
  type: 'DAILY' | 'WEEKLY' | 'ONCE';
  daysOfWeek?: number[];
  specificDate?: string;
  order: number;
  notes?: string;  // Comentários/notas da atividade
  links?: RestActivityLink[];  // Links associados à atividade
  history?: Record<string, boolean>; // date -> isCompleted
  seriesHistory?: Record<string, Record<string, boolean>>; // date -> seriesId -> isCompleted
}
