export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface SundaySubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface SundayTask {
  id: string;
  title: string;
  subTasks: SundaySubTask[];
  isArchived: boolean; // Moves to bottom list
  createdAt: number;
}

export interface SundayTimerState {
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';
  startTime: number | null;     // timestamp quando iniciou
  pausedAt: number | null;      // timestamp quando pausou
  accumulated: number;          // milissegundos acumulados em pausas
  totalDuration: number;        // 2.5h = 9000000ms
  widgetPosition: WidgetPosition; // posição do widget flutuante
}
