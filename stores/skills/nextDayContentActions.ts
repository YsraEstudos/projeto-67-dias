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
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                const newContent: NextDayContent = {
                    id: generateUUID(),
                    title,
                    url,
                    notes,
                    isCompleted: false,
                    createdAt: Date.now()
                };
                return { ...skill, nextDayContents: [...(skill.nextDayContents || []), newContent] };
            })
        }));
        get()._syncToFirestore();
    },

    toggleNextDayContent: (skillId, contentId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    nextDayContents: skill.nextDayContents?.map(c =>
                        c.id === contentId ? { ...c, isCompleted: !c.isCompleted } : c
                    )
                };
            })
        }));
        get()._syncToFirestore();
    },

    updateNextDayContent: (skillId, contentId, updates) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    nextDayContents: skill.nextDayContents?.map(c =>
                        c.id === contentId ? { ...c, ...updates } : c
                    )
                };
            })
        }));
        get()._syncToFirestore();
    },

    deleteNextDayContent: (skillId, contentId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return { ...skill, nextDayContents: skill.nextDayContents?.filter(c => c.id !== contentId) };
            })
        }));
        get()._syncToFirestore();
    },

    clearCompletedNextDayContents: (skillId) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId
                    ? { ...s, nextDayContents: (s.nextDayContents || []).filter(c => !c.isCompleted) }
                    : s
            )
        }));
        get()._syncToFirestore();
    }
});
