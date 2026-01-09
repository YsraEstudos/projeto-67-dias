/**
 * Weekly Agenda Utilities
 * 
 * Functions for calculating progress, getting effective plans, and date handling.
 */
import { Skill, AgendaActivity, DayOfWeekPlan, DayOverride } from '../types';
import {
    getTodayISO,
    getTomorrowISO,
    getDayOfWeek as getDayOfWeekUtil,
    getWeekDatesFromMonday,
    formatDateBR,
    isToday as isTodayUtil,
    isDateBefore,
    isDateAfter,
    DAY_NAMES_PT,
    DAY_NAMES_SHORT_PT,
    getDayNamePT,
    getStartOfDay,
    formatDateISO,
    daysDiff
} from './dateUtils';

/**
 * Format minutes to human readable string
 */
export const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => getTodayISO();

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowDate = (): string => getTomorrowISO();

/**
 * Get the day of week (0-6) from a date string
 */
export const getDayOfWeek = (dateStr: string): number => getDayOfWeekUtil(dateStr);

/**
 * Get day name in Portuguese
 */
export const getDayName = (dayOfWeek: number, short = false): string => getDayNamePT(dayOfWeek, short);

/**
 * Get array of 7 dates for a week (Monday to Sunday)
 * @param baseDate - Reference date, defaults to today
 */
export const getWeekDates = (baseDate?: string): string[] => getWeekDatesFromMonday(baseDate);

/**
 * Get the effective plan for a specific date.
 * Priority: Override > DayOfWeek Plan > Empty plan
 */
export const getEffectiveDayPlan = (
    date: string,
    weeklyPlan: DayOfWeekPlan[],
    overrides: DayOverride[]
): { skillGoals: { skillId: string; targetMinutes: number }[]; activityGoals: { activityId: string; targetMinutes: number }[]; isOverride: boolean; reason?: string } => {
    // Check for override first
    const override = overrides.find(o => o.date === date);
    if (override) {
        return {
            skillGoals: override.skillGoals || [],
            activityGoals: override.activityGoals || [],
            isOverride: true,
            reason: override.reason
        };
    }

    // Fall back to day of week plan
    const dayOfWeek = getDayOfWeek(date);
    const dayPlan = weeklyPlan.find(p => p.dayOfWeek === dayOfWeek);

    if (dayPlan) {
        return {
            skillGoals: dayPlan.skillGoals || [],
            activityGoals: dayPlan.activityGoals || [],
            isOverride: false
        };
    }

    // No plan configured
    return {
        skillGoals: [],
        activityGoals: [],
        isOverride: false
    };
};

/**
 * Get logged minutes for a skill on a specific date
 */
export const getSkillMinutesForDate = (skill: Skill, date: string): number => {
    if (!skill.logs) return 0;

    return skill.logs
        .filter(log => log.date.startsWith(date))
        .reduce((sum, log) => sum + log.minutes, 0);
};

/**
 * Get logged minutes for an activity on a specific date
 */
export const getActivityMinutesForDate = (activity: AgendaActivity, date: string): number => {
    if (!activity.logs) return 0;

    return activity.logs
        .filter(log => log.date === date)
        .reduce((sum, log) => sum + log.minutes, 0);
};

/**
 * Calculate statistics for an activity or skill, including debt
 */
export const calculateActivityStats = (
    item: Skill | AgendaActivity,
    type: 'skill' | 'activity'
): { dailyGoal: number; todayDone: number; totalDebt: number } => {
    const today = getTodayISO();

    // Get daily goal with fallback for skills
    let dailyGoal = item.dailyGoalMinutes || 0;

    // Fallback: for skills without dailyGoalMinutes, calculate from deadline or use default
    if (type === 'skill' && dailyGoal === 0) {
        const skill = item as Skill;
        if (skill.deadline) {
            // Calculate based on deadline and remaining minutes
            const daysToDeadline = daysDiff(today, skill.deadline);
            if (daysToDeadline > 0) {
                const remaining = Math.max(0, skill.goalMinutes - skill.currentMinutes);
                dailyGoal = Math.ceil(remaining / daysToDeadline);
            }
        } else if (skill.goalMinutes > 0) {
            // Default: assume 30 days to complete if no deadline set
            const remaining = Math.max(0, skill.goalMinutes - skill.currentMinutes);
            dailyGoal = Math.ceil(remaining / 30);
        }
    }

    // Get today's completion
    let todayDone = 0;
    if (type === 'skill') {
        todayDone = getSkillMinutesForDate(item as Skill, today);
    } else {
        todayDone = getActivityMinutesForDate(item as AgendaActivity, today);
    }

    // Calculate total debt
    // Start from creation date
    const createdAt = (item as any).createdAt || Date.now();
    const startDate = formatDateISO(getStartOfDay(createdAt));

    // Days elapsed including today
    const daysElapsed = Math.max(1, daysDiff(startDate, today) + 1);

    const totalGoal = daysElapsed * dailyGoal;

    let totalDone = 0;
    if (type === 'skill') {
        totalDone = (item as Skill).logs?.reduce((acc, log) => acc + log.minutes, 0) || 0;
    } else {
        totalDone = (item as AgendaActivity).logs?.reduce((acc, log) => acc + log.minutes, 0) || 0;
    }

    const totalDebt = Math.max(0, totalGoal - totalDone);

    return {
        dailyGoal,
        todayDone,
        totalDebt
    };
};

/**
 * Calculate progress percentage for a single day
 */
export const calculateDayProgress = (
    date: string,
    skills: Skill[],
    activities: AgendaActivity[],
    weeklyPlan: DayOfWeekPlan[],
    overrides: DayOverride[]
): { percentage: number; completedMinutes: number; targetMinutes: number; details: { id: string; name: string; completed: number; target: number; type: 'skill' | 'activity' }[] } => {
    const plan = getEffectiveDayPlan(date, weeklyPlan, overrides);
    const details: { id: string; name: string; completed: number; target: number; type: 'skill' | 'activity' }[] = [];

    let totalTarget = 0;
    let totalCompleted = 0;

    // Calculate skill progress
    for (const goal of plan.skillGoals) {
        const skill = skills.find(s => s.id === goal.skillId);
        if (!skill) continue;

        const completed = getSkillMinutesForDate(skill, date);
        const target = goal.targetMinutes;

        totalTarget += target;
        totalCompleted += Math.min(completed, target); // Cap at target

        details.push({
            id: skill.id,
            name: skill.name,
            completed,
            target,
            type: 'skill'
        });
    }

    // Calculate activity progress
    for (const goal of plan.activityGoals) {
        const activity = activities.find(a => a.id === goal.activityId);
        if (!activity) continue;

        const completed = getActivityMinutesForDate(activity, date);
        const target = goal.targetMinutes;

        totalTarget += target;
        totalCompleted += Math.min(completed, target); // Cap at target

        details.push({
            id: activity.id,
            name: activity.title,
            completed,
            target,
            type: 'activity'
        });
    }

    const percentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

    return {
        percentage,
        completedMinutes: totalCompleted,
        targetMinutes: totalTarget,
        details
    };
};

/**
 * Calculate progress percentage for the entire week
 */
export const calculateWeekProgress = (
    skills: Skill[],
    activities: AgendaActivity[],
    weeklyPlan: DayOfWeekPlan[],
    overrides: DayOverride[],
    baseDate?: string
): { percentage: number; completedMinutes: number; targetMinutes: number; dailyProgress: { date: string; percentage: number; isToday: boolean }[] } => {
    const weekDates = getWeekDates(baseDate);
    const today = getTodayDate();

    let totalTarget = 0;
    let totalCompleted = 0;

    const dailyProgress = weekDates.map(date => {
        const dayResult = calculateDayProgress(date, skills, activities, weeklyPlan, overrides);
        totalTarget += dayResult.targetMinutes;
        totalCompleted += dayResult.completedMinutes;

        return {
            date,
            percentage: dayResult.percentage,
            isToday: date === today
        };
    });

    const percentage = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

    return {
        percentage,
        completedMinutes: totalCompleted,
        targetMinutes: totalTarget,
        dailyProgress
    };
};

/**
 * Format a date string to localized display
 */
export const formatDateDisplay = (dateStr: string): string => formatDateBR(dateStr, 'dd MMM');

/**
 * Check if a date is today
 */
export const isToday = (dateStr: string): boolean => isTodayUtil(dateStr);

/**
 * Check if a date is in the past
 */
export const isPastDate = (dateStr: string): boolean => isDateBefore(dateStr, getTodayISO());

/**
 * Check if a date is in the future
 */
export const isFutureDate = (dateStr: string): boolean => isDateAfter(dateStr, getTodayISO());
