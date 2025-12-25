/**
 * Distribution Actions Slice
 * Handles exponential distribution settings for skills
 */
import { SkillsSet, SkillsGet } from './types';

export interface DistributionActions {
    setDistributionType: (skillId: string, type: 'LINEAR' | 'EXPONENTIAL') => void;
    setExponentialIntensity: (skillId: string, intensity: number) => void;
    toggleExcludedDay: (skillId: string, dayOfWeek: number) => void;
    setExcludedDays: (skillId: string, days: number[]) => void;
}

export const createDistributionActions = (set: SkillsSet, get: SkillsGet): DistributionActions => ({
    setDistributionType: (skillId, type) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) skill.distributionType = type;
        });
        get()._syncToFirestore();
    },

    setExponentialIntensity: (skillId, intensity) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) skill.exponentialIntensity = Math.max(0, Math.min(1, intensity));
        });
        get()._syncToFirestore();
    },

    toggleExcludedDay: (skillId, dayOfWeek) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                if (!skill.excludedDays) skill.excludedDays = [];
                const idx = skill.excludedDays.indexOf(dayOfWeek);
                if (idx >= 0) {
                    skill.excludedDays.splice(idx, 1);
                } else {
                    skill.excludedDays.push(dayOfWeek);
                    skill.excludedDays.sort((a, b) => a - b);
                }
            }
        });
        get()._syncToFirestore();
    },

    setExcludedDays: (skillId, days) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) skill.excludedDays = [...days].sort((a, b) => a - b);
        });
        get()._syncToFirestore();
    }
});

