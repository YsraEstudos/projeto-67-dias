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
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    logs: [...skill.logs, log],
                    currentMinutes: skill.currentMinutes + log.minutes
                };
            })
        }));
        get()._syncToFirestore();
    },

    deleteLog: (skillId, logId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.name === 'Inglês Avançado') return state;
            return {
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    const log = skill.logs.find(l => l.id === logId);
                    return {
                        ...skill,
                        logs: skill.logs.filter(l => l.id !== logId),
                        currentMinutes: log ? skill.currentMinutes - log.minutes : skill.currentMinutes
                    };
                })
            };
        });
        get()._syncToFirestore();
    }
});
