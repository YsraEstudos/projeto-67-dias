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
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                skill.pomodorosCompleted = (skill.pomodorosCompleted || 0) + 1;
                skill.currentMinutes += 25;
                skill.logs.push({
                    id: generateUUID(),
                    date: new Date().toISOString(),
                    minutes: 25,
                    notes: '🍅 Pomodoro completado'
                });
            }
        });
        get()._syncToFirestore();
    },

    setPomodorosCompleted: (skillId, count) => {
        const validCount = Math.max(0, count);
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                const minutesDiff = (validCount - (skill.pomodorosCompleted || 0)) * 25;
                skill.pomodorosCompleted = validCount;
                skill.currentMinutes = Math.max(0, skill.currentMinutes + minutesDiff);
            }
        });
        get()._syncToFirestore();
    }
});

