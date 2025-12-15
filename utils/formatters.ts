/**
 * Cached Date Formatters for Performance
 * 
 * This module provides singleton Intl.DateTimeFormat instances
 * to avoid the performance cost of creating new formatters on each render.
 */

// Cache de formatters para evitar recriação
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Get or create a cached DateTimeFormat formatter
 * @param options - Intl.DateTimeFormatOptions
 * @param locale - Locale string (default: 'pt-BR')
 */
export const getDateFormatter = (
    options: Intl.DateTimeFormatOptions,
    locale: string = 'pt-BR'
): Intl.DateTimeFormat => {
    const key = `${locale}::${JSON.stringify(options)}`;

    if (!dateFormatters.has(key)) {
        dateFormatters.set(key, new Intl.DateTimeFormat(locale, options));
    }

    return dateFormatters.get(key)!;
};

/**
 * Get or create a cached NumberFormat formatter
 * @param options - Intl.NumberFormatOptions
 * @param locale - Locale string (default: 'pt-BR')
 */
export const getNumberFormatter = (
    options: Intl.NumberFormatOptions = {},
    locale: string = 'pt-BR'
): Intl.NumberFormat => {
    const key = `${locale}::${JSON.stringify(options)}`;

    if (!numberFormatters.has(key)) {
        numberFormatters.set(key, new Intl.NumberFormat(locale, options));
    }

    return numberFormatters.get(key)!;
};

// Pre-cached common formatters for direct use
export const formatters = {
    /** Format like "12 dez" */
    dayMonth: getDateFormatter({ day: '2-digit', month: 'short' }),

    /** Format like "domingo" */
    weekdayLong: getDateFormatter({ weekday: 'long' }),

    /** Format like "dom" */
    weekdayShort: getDateFormatter({ weekday: 'short' }),

    /** Format like "12 de dezembro" */
    dayMonthLong: getDateFormatter({ day: 'numeric', month: 'long' }),

    /** Format like "12/12/2025" */
    fullDate: getDateFormatter({ day: '2-digit', month: '2-digit', year: 'numeric' }),

    /** Format like "12/12" */
    shortDate: getDateFormatter({ day: '2-digit', month: '2-digit' }),

    /** Format like "14:30" */
    time: getDateFormatter({ hour: '2-digit', minute: '2-digit' }),

    /** Format percentage like "78%" */
    percent: getNumberFormatter({ style: 'percent', maximumFractionDigits: 0 }),
};

/**
 * Format a duration in minutes to a human-readable string
 * @param minutes - Total minutes
 * @returns Formatted string like "2h 30m"
 */
export const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
};

/**
 * Format time remaining like "02:45:30"
 * @param seconds - Total seconds
 */
export const formatTimeRemaining = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
