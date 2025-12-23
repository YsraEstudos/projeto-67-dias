/**
 * Pomodoro Actions Slice
 * Handles pomodoro tracking operations
 */
import { SkillsSet, SkillsGet } from './types';
import { generateUUID } from '../../utils/uuid';

export interface PomodoroActions {
    addPomodoro: (skillId: string) => void;
    setPomodorosCompleted: (skillId: string, count: number) => void;
}

export const createPomodoroActions = (set: SkillsSet, get: SkillsGet): PomodoroActions => ({
    addPomodoro: (skillId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    pomodorosCompleted: (skill.pomodorosCompleted || 0) + 1,
                    currentMinutes: skill.currentMinutes + 25,
                    logs: [...skill.logs, {
                        id: generateUUID(),
                        date: new Date().toISOString(),
                        minutes: 25,
                        notes: '🍅 Pomodoro completado'
                    }]
                };
            })
        }));
        get()._syncToFirestore();
    },

    setPomodorosCompleted: (skillId, count) => {
        const validCount = Math.max(0, count);
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                // Recalculate currentMinutes based on pomodoro difference
                const minutesDiff = (validCount - (skill.pomodorosCompleted || 0)) * 25;
                return {
                    ...skill,
                    pomodorosCompleted: validCount,
                    currentMinutes: Math.max(0, skill.currentMinutes + minutesDiff),
                };
            })
        }));
        get()._syncToFirestore();
    }
});
