/**
 * Skill Prediction Utilities
 * 
 * Calculates daily requirements to complete a skill by its deadline.
 */
import { Skill } from '../types';

export interface DailyPrediction {
    remainingDays: number;
    pomodorosPerDay: number;
    hoursPerDay: number;
    isExpired: boolean;
}

/**
 * Calculates how many pomodoros/hours per day are needed to complete a skill by its deadline.
 * 
 * @param skill - The skill to analyze
 * @returns DailyPrediction object or null if no deadline is set
 */
export function calculateDailyRequirement(skill: Skill): DailyPrediction | null {
    // No deadline set - can't calculate prediction
    if (!skill.deadline) return null;

    // Calculate remaining days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(skill.deadline);
    deadline.setHours(0, 0, 0, 0);

    const diffMs = deadline.getTime() - today.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Deadline has passed
    if (remainingDays <= 0) {
        return {
            remainingDays: 0,
            pomodorosPerDay: 0,
            hoursPerDay: 0,
            isExpired: true
        };
    }

    // Calculate remaining units based on goal type
    const isPomodoro = skill.goalType === 'POMODOROS';

    let remainingUnits: number;
    if (isPomodoro) {
        const goal = skill.goalPomodoros || 0;
        const completed = skill.pomodorosCompleted || 0;
        remainingUnits = Math.max(0, goal - completed);
    } else {
        remainingUnits = Math.max(0, skill.goalMinutes - skill.currentMinutes);
    }

    // Already completed
    if (remainingUnits <= 0) {
        return {
            remainingDays,
            pomodorosPerDay: 0,
            hoursPerDay: 0,
            isExpired: false
        };
    }

    // Calculate daily requirement
    const unitsPerDay = Math.ceil(remainingUnits / remainingDays);

    if (isPomodoro) {
        // Units are pomodoros
        return {
            remainingDays,
            pomodorosPerDay: unitsPerDay,
            hoursPerDay: (unitsPerDay * 25) / 60, // 25 min per pomodoro
            isExpired: false
        };
    } else {
        // Units are minutes
        return {
            remainingDays,
            pomodorosPerDay: Math.ceil(unitsPerDay / 25), // Convert minutes to pomodoros
            hoursPerDay: unitsPerDay / 60,
            isExpired: false
        };
    }
}
