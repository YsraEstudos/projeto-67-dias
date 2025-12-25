/**
 * Centralized Date Utilities using date-fns
 * 
 * This module provides timezone-safe date manipulation functions
 * to replace manual string parsing and millisecond arithmetic.
 */
import {
    format,
    parseISO,
    differenceInDays,
    addDays,
    startOfDay,
    getDay,
    isToday as isTodayFns,
    isBefore,
    isAfter,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─────────────────────────────────────────────────────────────────────────────
// DATE PARSING & FORMATTING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a date string (YYYY-MM-DD) safely to a Date object.
 * Uses parseISO which handles timezone correctly.
 */
export const parseDate = (dateStr: string): Date => parseISO(dateStr);

/**
 * Format a Date object to YYYY-MM-DD string (timezone-safe).
 */
export const formatDateISO = (date: Date): string => format(date, 'yyyy-MM-dd');

/**
 * Get today's date as YYYY-MM-DD string.
 * Uses startOfDay to normalize to midnight.
 */
export const getTodayISO = (): string => formatDateISO(startOfDay(new Date()));

/**
 * Get tomorrow's date as YYYY-MM-DD string.
 */
export const getTomorrowISO = (): string => formatDateISO(addDays(startOfDay(new Date()), 1));

/**
 * Format date for Brazilian Portuguese display.
 * @param date - Date object or YYYY-MM-DD string
 * @param formatStr - date-fns format string (e.g., "dd MMM", "EEEE")
 */
export const formatDateBR = (date: Date | string, formatStr: string): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: ptBR });
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE ARITHMETIC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate difference in days between two dates.
 * Both dates are normalized to start of day.
 * 
 * @param from - Start date (Date or YYYY-MM-DD string)
 * @param to - End date (Date or YYYY-MM-DD string)
 * @returns Number of days (positive if to > from)
 */
export const daysDiff = (from: Date | string, to: Date | string): number => {
    const fromDate = typeof from === 'string' ? parseISO(from) : from;
    const toDate = typeof to === 'string' ? parseISO(to) : to;
    return differenceInDays(startOfDay(toDate), startOfDay(fromDate));
};

/**
 * Add days to a date.
 * @param date - Base date (Date or YYYY-MM-DD string)
 * @param days - Number of days to add (can be negative)
 * @returns New Date object
 */
export const addDaysToDate = (date: Date | string, days: number): Date => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, days);
};

/**
 * Get start of day (midnight) for a date.
 */
export const getStartOfDay = (date: Date | string): Date => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfDay(dateObj);
};

// ─────────────────────────────────────────────────────────────────────────────
// DATE COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a date is today.
 */
export const isToday = (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isTodayFns(dateObj);
};

/**
 * Check if dateA is before dateB (comparing days only).
 */
export const isDateBefore = (dateA: Date | string, dateB: Date | string): boolean => {
    const a = typeof dateA === 'string' ? parseISO(dateA) : dateA;
    const b = typeof dateB === 'string' ? parseISO(dateB) : dateB;
    return isBefore(startOfDay(a), startOfDay(b));
};

/**
 * Check if dateA is after dateB (comparing days only).
 */
export const isDateAfter = (dateA: Date | string, dateB: Date | string): boolean => {
    const a = typeof dateA === 'string' ? parseISO(dateA) : dateA;
    const b = typeof dateB === 'string' ? parseISO(dateB) : dateB;
    return isAfter(startOfDay(a), startOfDay(b));
};

// ─────────────────────────────────────────────────────────────────────────────
// DAY OF WEEK
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get day of week (0 = Sunday, 6 = Saturday).
 */
export const getDayOfWeek = (date: Date | string): number => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return getDay(dateObj);
};

/**
 * Get array of dates for a week containing the given date.
 * Week starts on Monday (index 0 = Monday).
 * 
 * @param baseDate - Reference date (defaults to today)
 * @returns Array of 7 YYYY-MM-DD strings [Monday, ..., Sunday]
 */
export const getWeekDatesFromMonday = (baseDate?: Date | string): string[] => {
    const date = baseDate
        ? (typeof baseDate === 'string' ? parseISO(baseDate) : baseDate)
        : new Date();

    // Get Monday of the week (weekStartsOn: 1 = Monday)
    const monday = startOfWeek(date, { weekStartsOn: 1 });

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        dates.push(formatDateISO(addDays(monday, i)));
    }

    return dates;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const DAY_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DAY_NAMES_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Get Portuguese day name.
 * @param dayOfWeek - 0 (Sunday) to 6 (Saturday)
 * @param short - Use short form (e.g., "Seg" instead of "Segunda")
 */
export const getDayNamePT = (dayOfWeek: number, short = false): string => {
    return short ? DAY_NAMES_SHORT_PT[dayOfWeek] : DAY_NAMES_PT[dayOfWeek];
};
