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
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) skill.resources.push(resource);
        });
        get()._syncToFirestore();
    },

    updateResource: (skillId, resourceId, updates) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                const resource = skill.resources.find(r => r.id === resourceId);
                if (resource) Object.assign(resource, updates);
            }
        });
        get()._syncToFirestore();
    },

    deleteResource: (skillId, resourceId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                const idx = skill.resources.findIndex(r => r.id === resourceId);
                if (idx !== -1) skill.resources.splice(idx, 1);
            }
        });
        get()._syncToFirestore();
    }
});

