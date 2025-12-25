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
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                const newAchievement: MicroAchievement = {
                    id: generateUUID(),
                    title,
                    isCompleted: false,
                    createdAt: Date.now()
                };
                if (!skill.microAchievements) skill.microAchievements = [];
                skill.microAchievements.push(newAchievement);
            }
        });
        get()._syncToFirestore();
    },

    toggleMicroAchievement: (skillId, achievementId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.microAchievements) {
                const achievement = skill.microAchievements.find(a => a.id === achievementId);
                if (achievement) {
                    achievement.isCompleted = !achievement.isCompleted;
                    achievement.completedAt = achievement.isCompleted ? Date.now() : undefined;
                }
            }
        });
        get()._syncToFirestore();
    },

    deleteMicroAchievement: (skillId, achievementId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.microAchievements) {
                const idx = skill.microAchievements.findIndex(a => a.id === achievementId);
                if (idx !== -1) skill.microAchievements.splice(idx, 1);
            }
        });
        get()._syncToFirestore();
    },

    clearCompletedMicroAchievements: (skillId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.microAchievements) {
                skill.microAchievements = skill.microAchievements.filter(a => !a.isCompleted);
            }
        });
        get()._syncToFirestore();
    }
});

