/**
 * Log Actions Slice
 * Handles skill study log operations
 */
import { SkillsSet, SkillsGet, SkillLog } from './types';

export interface LogActions {
    addLog: (skillId: string, log: SkillLog) => void;
    deleteLog: (skillId: string, logId: string) => void;
}

export const createLogActions = (set: SkillsSet, get: SkillsGet): LogActions => ({
    addLog: (skillId, log) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                skill.logs.push(log);
                skill.currentMinutes += log.minutes;
            }
        });
        get()._syncToFirestore();
    },

    deleteLog: (skillId, logId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill || skill.name === 'Inglês Avançado') return;

            const logIdx = skill.logs.findIndex(l => l.id === logId);
            if (logIdx !== -1) {
                const log = skill.logs[logIdx];
                skill.currentMinutes -= log.minutes;
                skill.logs.splice(logIdx, 1);
            }
        });
        get()._syncToFirestore();
    }
});

