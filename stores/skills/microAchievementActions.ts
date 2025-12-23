/**
 * Micro Achievement Actions Slice
 * Handles micro-achievement CRUD and completion operations
 */
import { SkillsSet, SkillsGet, MicroAchievement } from './types';
import { generateUUID } from '../../utils/uuid';

export interface MicroAchievementActions {
    addMicroAchievement: (skillId: string, title: string) => void;
    toggleMicroAchievement: (skillId: string, achievementId: string) => void;
    deleteMicroAchievement: (skillId: string, achievementId: string) => void;
    clearCompletedMicroAchievements: (skillId: string) => void;
}

export const createMicroAchievementActions = (set: SkillsSet, get: SkillsGet): MicroAchievementActions => ({
    addMicroAchievement: (skillId, title) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                const newAchievement: MicroAchievement = {
                    id: generateUUID(),
                    title,
                    isCompleted: false,
                    createdAt: Date.now()
                };
                return { ...skill, microAchievements: [...(skill.microAchievements || []), newAchievement] };
            })
        }));
        get()._syncToFirestore();
    },

    toggleMicroAchievement: (skillId, achievementId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    microAchievements: skill.microAchievements?.map(a =>
                        a.id === achievementId
                            ? { ...a, isCompleted: !a.isCompleted, completedAt: !a.isCompleted ? Date.now() : undefined }
                            : a
                    )
                };
            })
        }));
        get()._syncToFirestore();
    },

    deleteMicroAchievement: (skillId, achievementId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return { ...skill, microAchievements: skill.microAchievements?.filter(a => a.id !== achievementId) };
            })
        }));
        get()._syncToFirestore();
    },

    clearCompletedMicroAchievements: (skillId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return { ...skill, microAchievements: skill.microAchievements?.filter(a => !a.isCompleted) };
            })
        }));
        get()._syncToFirestore();
    }
});
