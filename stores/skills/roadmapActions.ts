/**
 * Roadmap Actions Slice
 * Handles roadmap and visual roadmap operations
 */
import { SkillsSet, SkillsGet, SkillRoadmapItem, VisualRoadmap, RoadmapViewMode } from './types';
import { normalizeRoadmap } from './roadmapValidator';

export interface RoadmapActions {
    setRoadmap: (skillId: string, roadmap: SkillRoadmapItem[], options?: { createBackup?: boolean; backupLabel?: string }) => void;
    toggleRoadmapItem: (skillId: string, itemId: string) => void;
    setVisualRoadmap: (skillId: string, visualRoadmap: VisualRoadmap) => void;
    setRoadmapViewMode: (skillId: string, mode: RoadmapViewMode) => void;
}

export const createRoadmapActions = (set: SkillsSet, get: SkillsGet): RoadmapActions => ({
    setRoadmap: (skillId, roadmap, options) => {
        const safeRoadmap = normalizeRoadmap(roadmap);
        if (!safeRoadmap) return;

        // Create backup before replacing if requested
        if (options?.createBackup) {
            get().createRoadmapBackup(skillId, options.backupLabel);
        }

        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) skill.roadmap = safeRoadmap;
        });
        get()._syncToFirestore();
    },

    toggleRoadmapItem: (skillId, itemId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (!skill) return;

            // Recursive function to toggle item in nested subtasks
            const toggleItem = (items: SkillRoadmapItem[]): boolean => {
                for (const item of items) {
                    if (item.id === itemId) {
                        item.isCompleted = !item.isCompleted;
                        return true;
                    }
                    if (item.subTasks && toggleItem(item.subTasks)) {
                        return true;
                    }
                }
                return false;
            };

            toggleItem(skill.roadmap);
        });
        get()._syncToFirestore();
    },

    setVisualRoadmap: (skillId, visualRoadmap) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) skill.visualRoadmap = visualRoadmap;
        });
        get()._syncToFirestore();
    },

    setRoadmapViewMode: (skillId, mode) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) skill.roadmapViewMode = mode;
        });
        get()._syncToFirestore();
    }
});
