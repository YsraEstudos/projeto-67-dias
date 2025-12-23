/**
 * Roadmap Actions Slice
 * Handles roadmap and visual roadmap operations
 */
import { SkillsSet, SkillsGet, SkillRoadmapItem, VisualRoadmap, RoadmapViewMode } from './types';

export interface RoadmapActions {
    setRoadmap: (skillId: string, roadmap: SkillRoadmapItem[]) => void;
    toggleRoadmapItem: (skillId: string, itemId: string) => void;
    setVisualRoadmap: (skillId: string, visualRoadmap: VisualRoadmap) => void;
    setRoadmapViewMode: (skillId: string, mode: RoadmapViewMode) => void;
}

export const createRoadmapActions = (set: SkillsSet, get: SkillsGet): RoadmapActions => ({
    setRoadmap: (skillId, roadmap) => {
        set((state) => ({
            skills: state.skills.map(skill => skill.id === skillId ? { ...skill, roadmap } : skill)
        }));
        get()._syncToFirestore();
    },

    toggleRoadmapItem: (skillId, itemId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;

                // Recursive function to toggle item in nested subtasks
                const toggleItem = (items: SkillRoadmapItem[]): SkillRoadmapItem[] => {
                    return items.map(item => {
                        if (item.id === itemId) {
                            return { ...item, isCompleted: !item.isCompleted };
                        }
                        if (item.subTasks) {
                            return { ...item, subTasks: toggleItem(item.subTasks) };
                        }
                        return item;
                    });
                };

                return { ...skill, roadmap: toggleItem(skill.roadmap) };
            })
        }));
        get()._syncToFirestore();
    },

    setVisualRoadmap: (skillId, visualRoadmap) => {
        set((state) => ({
            skills: state.skills.map(skill => skill.id === skillId ? { ...skill, visualRoadmap } : skill)
        }));
        get()._syncToFirestore();
    },

    setRoadmapViewMode: (skillId, mode) => {
        set((state) => ({
            skills: state.skills.map(skill => skill.id === skillId ? { ...skill, roadmapViewMode: mode } : skill)
        }));
        get()._syncToFirestore();
    }
});
