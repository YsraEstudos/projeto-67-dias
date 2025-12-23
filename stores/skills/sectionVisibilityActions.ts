/**
 * Section Visibility Actions Slice
 * Handles anti-anxiety roadmap section visibility
 */
import { SkillsSet, SkillsGet } from './types';

export interface SectionVisibilityActions {
    unlockSection: (skillId: string, sectionId: string) => void;
    lockSection: (skillId: string, sectionId: string) => void;
}

export const createSectionVisibilityActions = (set: SkillsSet, get: SkillsGet): SectionVisibilityActions => ({
    unlockSection: (skillId, sectionId) => {
        set((state) => ({
            skills: state.skills.map(s => {
                if (s.id !== skillId) return s;
                const current = s.unlockedSections || [];
                if (current.includes(sectionId)) return s;
                return { ...s, unlockedSections: [...current, sectionId] };
            })
        }));
        get()._syncToFirestore();
    },

    lockSection: (skillId, sectionId) => {
        set((state) => ({
            skills: state.skills.map(s => {
                if (s.id !== skillId) return s;
                return { ...s, unlockedSections: (s.unlockedSections || []).filter(id => id !== sectionId) };
            })
        }));
        get()._syncToFirestore();
    }
});
