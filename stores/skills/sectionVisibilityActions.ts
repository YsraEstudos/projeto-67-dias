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
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                if (!skill.unlockedSections) skill.unlockedSections = [];
                if (!skill.unlockedSections.includes(sectionId)) {
                    skill.unlockedSections.push(sectionId);
                }
            }
        });
        get()._syncToFirestore();
    },

    lockSection: (skillId, sectionId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.unlockedSections) {
                const idx = skill.unlockedSections.indexOf(sectionId);
                if (idx !== -1) skill.unlockedSections.splice(idx, 1);
            }
        });
        get()._syncToFirestore();
    }
});

