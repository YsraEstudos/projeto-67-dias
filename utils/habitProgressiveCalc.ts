/**
 * Habit Progressive Calculator
 * 
 * Calculates the progressive "staircase" target for a 67-day habit plan.
 * Uses an ease-in curve so the user starts gently and ramps up to the full target.
 * 
 * All calculations are pure math — zero network requests.
 */
import { ProgressivePlan } from '../types';

const TOTAL_PLAN_DAYS = 67;
const MIN_SESSION_MINUTES = 5; // Minimum first session

/**
 * Ease-in-out cubic curve for natural progression.
 * Starts slow, accelerates in the middle, levels off at the end.
 * t ∈ [0, 1] → output ∈ [0, 1]
 */
function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Parses a date string (YYYY-MM-DD) to a Date object at midnight local time.
 */
function parseDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Formats a Date to YYYY-MM-DD string.
 */
function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Check if a given date falls on one of the scheduled days of the week.
 */
export function isDayScheduled(plan: ProgressivePlan, date: string): boolean {
    const d = parseDate(date);
    return plan.scheduledDays.includes(d.getDay());
}

/**
 * Generate the full 67-day schedule with progressive targets.
 * 
 * Returns an array of { date, targetMinutes, sessionNumber } for each scheduled day.
 * Only includes days that are scheduled (matching daysPerWeek/scheduledDays).
 * 
 * The progression uses an ease-in-out cubic curve:
 * - Session 1: starts at MIN_SESSION_MINUTES (5 min)
 * - Final session: reaches plan.targetMinutes
 * - Middle sessions: smooth curve between the two
 */
export function generateFullSchedule(plan: ProgressivePlan): {
    date: string;
    targetMinutes: number;
    sessionNumber: number;
    dayNumber: number;
}[] {
    const startDate = parseDate(plan.startDate);
    const sessions: { date: string; targetMinutes: number; sessionNumber: number; dayNumber: number }[] = [];

    // First pass: collect all scheduled dates within 67 calendar days
    for (let dayOffset = 0; dayOffset < TOTAL_PLAN_DAYS; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + dayOffset);
        const dateStr = formatDate(currentDate);

        if (plan.scheduledDays.includes(currentDate.getDay())) {
            sessions.push({
                date: dateStr,
                targetMinutes: 0, // Will be filled below
                sessionNumber: sessions.length + 1,
                dayNumber: dayOffset + 1,
            });
        }
    }

    // Second pass: calculate progressive target for each session
    const totalSessions = sessions.length;
    if (totalSessions === 0) return sessions;

    const minTarget = Math.min(MIN_SESSION_MINUTES, plan.targetMinutes);
    const range = plan.targetMinutes - minTarget;

    for (let i = 0; i < totalSessions; i++) {
        // t goes from 0 to 1 across all sessions
        const t = totalSessions === 1 ? 1 : i / (totalSessions - 1);
        const easedT = easeInOutCubic(t);
        const target = minTarget + range * easedT;

        // Round to nearest 5 for clean numbers, but never below minTarget
        sessions[i].targetMinutes = Math.max(
            minTarget,
            Math.round(target / 5) * 5
        );
    }

    // Ensure the last session hits exactly the target
    if (sessions.length > 0) {
        sessions[sessions.length - 1].targetMinutes = plan.targetMinutes;
    }

    return sessions;
}

/**
 * Get the progressive target for a specific date.
 * Returns null if the date is not a scheduled day or is outside the 67-day window.
 */
export function getProgressiveTarget(plan: ProgressivePlan, currentDate: string): number | null {
    const schedule = generateFullSchedule(plan);
    const entry = schedule.find(s => s.date === currentDate);
    return entry ? entry.targetMinutes : null;
}

/**
 * Get the current session info for a date.
 * Returns session number, total sessions, target, and day number within the plan.
 * Returns null if the date is not scheduled or outside the plan window.
 */
export function getSessionInfo(plan: ProgressivePlan, currentDate: string): {
    sessionNumber: number;
    totalSessions: number;
    targetMinutes: number;
    dayNumber: number;
    totalDays: number;
    progressPercent: number;
} | null {
    const schedule = generateFullSchedule(plan);
    const entry = schedule.find(s => s.date === currentDate);
    if (!entry) return null;

    return {
        sessionNumber: entry.sessionNumber,
        totalSessions: schedule.length,
        targetMinutes: entry.targetMinutes,
        dayNumber: entry.dayNumber,
        totalDays: TOTAL_PLAN_DAYS,
        progressPercent: Math.round((entry.dayNumber / TOTAL_PLAN_DAYS) * 100),
    };
}

/**
 * Check if the 67-day plan is completed (current date is past end date).
 */
export function isPlanCompleted(plan: ProgressivePlan, currentDate: string): boolean {
    const start = parseDate(plan.startDate);
    const current = parseDate(currentDate);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= TOTAL_PLAN_DAYS;
}

/**
 * Get remaining calendar days in the plan.
 */
export function getRemainingDays(plan: ProgressivePlan, currentDate: string): number {
    const start = parseDate(plan.startDate);
    const current = parseDate(currentDate);
    const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, TOTAL_PLAN_DAYS - diffDays);
}
