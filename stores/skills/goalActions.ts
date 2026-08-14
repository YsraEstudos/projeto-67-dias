/**
 * Goals & Points Actions Slice
 * Handles goal CRUD, completion (XP/level) and point bookkeeping
 */
import { SkillsSet, SkillsGet, SkillGoal } from './types';
import { generateUUID } from '../../utils/uuid';

export interface GoalActions {
    addGoal: (skillId: string, input: { title: string; description?: string; points: number }) => void;
    updateGoal: (skillId: string, goalId: string, updates: Partial<Pick<SkillGoal, 'title' | 'description' | 'points'>>) => void;
    toggleGoalComplete: (skillId: string, goalId: string) => void;
    deleteGoal: (skillId: string, goalId: string) => void;
}

export const createGoalActions = (set: SkillsSet, get: SkillsGet): GoalActions => ({
    addGoal: (skillId, input) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill) return;

            const title = input.title?.trim();
            if (!title) return;

            if (!skill.goals) skill.goals = [];
            const points = (typeof input.points === 'number' && !isNaN(input.points) && input.points > 0)
                ? input.points
                : 1;

            const newGoal: SkillGoal = {
                id: generateUUID(),
                title,
                description: input.description,
                points,
                status: 'pending',
                createdAt: Date.now()
            };
            skill.goals.push(newGoal);
        });
        get()._syncToFirestore();
    },

    toggleGoalComplete: (skillId, goalId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill?.goals) return;

            const goal = skill.goals.find(g => g.id === goalId);
            if (!goal) return;

            if (goal.status === 'pending') {
                goal.status = 'completed';
                goal.completedAt = Date.now();
                skill.totalXp = (skill.totalXp || 0) + goal.points;
                skill.levelNumber = (skill.levelNumber || 1) + 1;
            } else {
                goal.status = 'pending';
                goal.completedAt = undefined;
                skill.totalXp = Math.max(0, (skill.totalXp || 0) - goal.points);
                skill.levelNumber = Math.max(1, (skill.levelNumber || 1) - 1);
            }
        });
        get()._syncToFirestore();
    },

    updateGoal: (skillId, goalId, updates) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill?.goals) return;

            const goal = skill.goals.find(g => g.id === goalId);
            if (!goal) return;

            if (updates.title !== undefined) {
                const title = updates.title.trim();
                if (title) goal.title = title;
            }
            if (updates.description !== undefined) {
                goal.description = updates.description;
            }
            if (updates.points !== undefined) {
                const newPoints = (typeof updates.points === 'number' && !isNaN(updates.points) && updates.points >= 1)
                    ? updates.points
                    : 1;
                if (goal.status === 'completed') {
                    skill.totalXp = Math.max(0, (skill.totalXp || 0) - goal.points + newPoints);
                }
                goal.points = newPoints;
            }
        });
        get()._syncToFirestore();
    },

    deleteGoal: (skillId, goalId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill?.goals) return;

            const idx = skill.goals.findIndex(g => g.id === goalId);
            if (idx === -1) return;

            const removed = skill.goals[idx];
            skill.goals.splice(idx, 1);

            if (removed.status === 'completed') {
                skill.totalXp = Math.max(0, (skill.totalXp || 0) - removed.points);
                skill.levelNumber = Math.max(1, (skill.levelNumber || 1) - 1);
            }
        });
        get()._syncToFirestore();
    }
});
