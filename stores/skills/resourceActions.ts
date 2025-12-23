/**
 * Resource Actions Slice
 * Handles skill resource CRUD operations
 */
import { SkillsSet, SkillsGet, SkillResource } from './types';

export interface ResourceActions {
    addResource: (skillId: string, resource: SkillResource) => void;
    updateResource: (skillId: string, resourceId: string, updates: Partial<SkillResource>) => void;
    deleteResource: (skillId: string, resourceId: string) => void;
}

export const createResourceActions = (set: SkillsSet, get: SkillsGet): ResourceActions => ({
    addResource: (skillId, resource) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return { ...skill, resources: [...skill.resources, resource] };
            })
        }));
        get()._syncToFirestore();
    },

    updateResource: (skillId, resourceId, updates) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    resources: skill.resources.map(r => r.id === resourceId ? { ...r, ...updates } : r)
                };
            })
        }));
        get()._syncToFirestore();
    },

    deleteResource: (skillId, resourceId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return { ...skill, resources: skill.resources.filter(r => r.id !== resourceId) };
            })
        }));
        get()._syncToFirestore();
    }
});
