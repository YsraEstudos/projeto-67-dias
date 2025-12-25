/**
 * Next Day Content Actions Slice
 * Handles next day content planning operations
 */
import { SkillsSet, SkillsGet, NextDayContent } from './types';
import { generateUUID } from '../../utils/uuid';

export interface NextDayContentActions {
    addNextDayContent: (skillId: string, title: string, url?: string, notes?: string) => void;
    toggleNextDayContent: (skillId: string, contentId: string) => void;
    updateNextDayContent: (skillId: string, contentId: string, updates: Partial<NextDayContent>) => void;
    deleteNextDayContent: (skillId: string, contentId: string) => void;
    clearCompletedNextDayContents: (skillId: string) => void;
}

export const createNextDayContentActions = (set: SkillsSet, get: SkillsGet): NextDayContentActions => ({
    addNextDayContent: (skillId, title, url, notes) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                const newContent: NextDayContent = {
                    id: generateUUID(),
                    title,
                    url,
                    notes,
                    isCompleted: false,
                    createdAt: Date.now()
                };
                if (!skill.nextDayContents) skill.nextDayContents = [];
                skill.nextDayContents.push(newContent);
            }
        });
        get()._syncToFirestore();
    },

    toggleNextDayContent: (skillId, contentId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.nextDayContents) {
                const content = skill.nextDayContents.find(c => c.id === contentId);
                if (content) content.isCompleted = !content.isCompleted;
            }
        });
        get()._syncToFirestore();
    },

    updateNextDayContent: (skillId, contentId, updates) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.nextDayContents) {
                const content = skill.nextDayContents.find(c => c.id === contentId);
                if (content) Object.assign(content, updates);
            }
        });
        get()._syncToFirestore();
    },

    deleteNextDayContent: (skillId, contentId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.nextDayContents) {
                const idx = skill.nextDayContents.findIndex(c => c.id === contentId);
                if (idx !== -1) skill.nextDayContents.splice(idx, 1);
            }
        });
        get()._syncToFirestore();
    },

    clearCompletedNextDayContents: (skillId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.nextDayContents) {
                skill.nextDayContents = skill.nextDayContents.filter(c => !c.isCompleted);
            }
        });
        get()._syncToFirestore();
    }
});

