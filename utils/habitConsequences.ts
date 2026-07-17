/**
 * Habit Consequences Engine
 * 
 * Pure functions that determine which consequences are active TODAY
 * based on what was marked YESTERDAY. No network calls.
 */
import { Habit, HabitConsequence } from '../types';

export interface ActiveConsequence {
    consequence: HabitConsequence;
    sourceHabitId: string;
    sourceHabitTitle: string;
    triggeredBy: string[];  // Titles of habits that were marked yesterday
}

/**
 * Get the date string for yesterday relative to a given date.
 */
function getYesterday(todayStr: string): string {
    const [y, m, d] = todayStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

/**
 * Check if a habit was marked (completed) on a specific date.
 */
function wasHabitMarked(habit: Habit, dateKey: string): boolean {
    return habit.history[dateKey]?.completed === true;
}

/**
 * Get all active consequences for today based on yesterday's habits.
 * 
 * For each habit that has consequences defined:
 * - Check if the condition habits were marked YESTERDAY
 * - ALL_MARKED: all condition habits must be marked
 * - ANY_MARKED: at least one condition habit must be marked
 * - If conditions are met, the consequence is active TODAY
 * 
 * @param habits - All habits in the system
 * @param today - Today's date as YYYY-MM-DD
 * @returns Array of active consequences with source info
 */
export function getActiveConsequences(habits: Habit[], today: string): ActiveConsequence[] {
    const yesterday = getYesterday(today);
    const active: ActiveConsequence[] = [];

    // Build a lookup map for fast access
    const habitMap = new Map<string, Habit>();
    for (const h of habits) {
        habitMap.set(h.id, h);
    }

    for (const habit of habits) {
        if (!habit.consequences || habit.consequences.length === 0) continue;
        if (habit.archived) continue;

        for (const consequence of habit.consequences) {
            if (consequence.conditionHabitIds.length === 0) continue;

            const triggeredHabits: string[] = [];
            let conditionMet = false;

            if (consequence.conditionType === 'ALL_MARKED') {
                // ALL conditions must be met
                const allMet = consequence.conditionHabitIds.every(condId => {
                    const condHabit = habitMap.get(condId);
                    if (!condHabit) return false;
                    const marked = wasHabitMarked(condHabit, yesterday);
                    if (marked) triggeredHabits.push(condHabit.title);
                    return marked;
                });
                conditionMet = allMet;
            } else {
                // ANY condition must be met
                consequence.conditionHabitIds.forEach(condId => {
                    const condHabit = habitMap.get(condId);
                    if (condHabit && wasHabitMarked(condHabit, yesterday)) {
                        triggeredHabits.push(condHabit.title);
                    }
                });
                conditionMet = triggeredHabits.length > 0;
            }

            if (conditionMet) {
                active.push({
                    consequence,
                    sourceHabitId: habit.id,
                    sourceHabitTitle: habit.title,
                    triggeredBy: triggeredHabits,
                });
            }
        }
    }

    return active;
}

/**
 * Get a human-readable summary of why a consequence was triggered.
 */
export function getConsequenceSummary(ac: ActiveConsequence): string {
    if (ac.triggeredBy.length === 1) {
        return `Porque "${ac.triggeredBy[0]}" foi marcado ontem`;
    }
    const names = ac.triggeredBy.map(n => `"${n}"`).join(' e ');
    return `Porque ${names} foram marcados ontem`;
}
