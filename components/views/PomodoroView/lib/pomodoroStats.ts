import type { PomodoroRecord } from '../store/types';

export function countHistoricalPomodoros(records: PomodoroRecord[], taskId: string): number {
  return records.reduce((count, record) => count + (record.taskId === taskId ? 1 : 0), 0);
}
