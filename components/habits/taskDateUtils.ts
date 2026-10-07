import { getTodayISO, daysDiff } from '../../utils/dateUtils';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Calendar days from today (local) until `dateStr` (YYYY-MM-DD).
 * Negative means the date is in the past. Returns null for empty/invalid input.
 */
export const getDaysUntil = (dateStr?: string | null, today: string = getTodayISO()): number | null => {
    if (!dateStr || !ISO_DATE.test(dateStr)) return null;
    return daysDiff(today, dateStr);
};

/** A task is overdue only after its due day has fully passed (due today is NOT overdue). */
export const isTaskOverdue = (dueDate?: string | null, today: string = getTodayISO()): boolean => {
    const days = getDaysUntil(dueDate, today);
    return days !== null && days < 0;
};
