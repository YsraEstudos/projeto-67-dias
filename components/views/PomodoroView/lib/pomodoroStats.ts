import type { PomodoroRecord, Task } from '../store/types';

export function countHistoricalPomodoros(records: PomodoroRecord[], taskId: string): number {
  return records.reduce((count, record) => count + (record.taskId === taskId ? 1 : 0), 0);
}

export function getLocalISODate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getTaskTodayPomodoros(task: Task, today = getLocalISODate()): number {
  if (task.lastCompletedDate !== today) {
    return 0;
  }

  return Math.max(0, task.completedPomodoros);
}
