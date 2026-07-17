/**
 * Habit Consequences Engine
 * 
 * Pure functions that determine which consequences are active TODAY
 * based on what was marked YESTERDAY. No network calls.
 */
import { Habit, HabitConsequence } from '../types';

export interface TriggerInfo {
    title: string;
    isNegative: boolean;
}

export interface ActiveConsequence {
    consequence: HabitConsequence;
    sourceHabitId: string;
    sourceHabitTitle: string;
    triggeredBy: TriggerInfo[];  // Habits that triggered this consequence yesterday
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
 * Check if a habit failed yesterday.
 * - Negative habit (avoid): fails if it WAS marked (completed: true)
 * - Positive habit (do): fails if it WAS NOT marked (completed: false)
 */
function didHabitFailYesterday(habit: Habit, dateKey: string): boolean {
    const log = habit.history[dateKey];
    const completed = log ? log.completed : false;
    
    if (habit.isNegative) {
        // Negative habit: marking it is a failure
        return completed === true;
    } else {
        // Positive habit: not completing it is a failure
        return completed === false;
    }
}

/**
 * Get all active consequences for today based on yesterday's habits.
 * 
 * For each habit that has consequences defined:
 * - Check if the condition habits failed YESTERDAY
 * - ALL_MARKED: all condition habits must have failed
 * - ANY_MARKED: at least one condition habit must have failed
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

            const triggeredHabits: TriggerInfo[] = [];
            let conditionMet = false;

            if (consequence.conditionType === 'ALL_MARKED') {
                // ALL conditions must be met
                const allMet = consequence.conditionHabitIds.every(condId => {
                    const condHabit = habitMap.get(condId);
                    if (!condHabit) return false;
                    const failed = didHabitFailYesterday(condHabit, yesterday);
                    if (failed) {
                        triggeredHabits.push({
                            title: condHabit.title,
                            isNegative: !!condHabit.isNegative
                        });
                    }
                    return failed;
                });
                conditionMet = allMet;
            } else {
                // ANY condition must be met
                consequence.conditionHabitIds.forEach(condId => {
                    const condHabit = habitMap.get(condId);
                    if (condHabit && didHabitFailYesterday(condHabit, yesterday)) {
                        triggeredHabits.push({
                            title: condHabit.title,
                            isNegative: !!condHabit.isNegative
                        });
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
    const descriptions = ac.triggeredBy.map(t => {
        return t.isNegative 
            ? `"${t.title}" foi marcado (falha)` 
            : `"${t.title}" não foi realizado`;
    });

    if (descriptions.length === 1) {
        return `Ativado porque ${descriptions[0]} ontem.`;
    }
    
    const connector = ac.consequence.conditionType === 'ALL_MARKED' ? ' E ' : ' OU ';
    return `Ativado porque ontem: ${descriptions.join(connector)}.`;
}
