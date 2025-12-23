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
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, distributionType: type } : s
            )
        }));
        get()._syncToFirestore();
    },

    setExponentialIntensity: (skillId, intensity) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, exponentialIntensity: Math.max(0, Math.min(1, intensity)) } : s
            )
        }));
        get()._syncToFirestore();
    },

    toggleExcludedDay: (skillId, dayOfWeek) => {
        set((state) => ({
            skills: state.skills.map(s => {
                if (s.id !== skillId) return s;
                const currentDays = s.excludedDays || [];
                const newDays = currentDays.includes(dayOfWeek)
                    ? currentDays.filter(d => d !== dayOfWeek)
                    : [...currentDays, dayOfWeek].sort();
                return { ...s, excludedDays: newDays };
            })
        }));
        get()._syncToFirestore();
    },

    setExcludedDays: (skillId, days) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, excludedDays: days.sort() } : s
            )
        }));
        get()._syncToFirestore();
    }
});
