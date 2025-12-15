/**
 * Skills Store - Skills with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Skill, SkillLog, SkillResource, SkillRoadmapItem, VisualRoadmap, RoadmapViewMode, MicroAchievement, NextDayContent } from '../types';
import { createFirebaseStorage } from './persistMiddleware';
import { generateUUID } from '../utils/uuid';

interface SkillsState {
    skills: Skill[];
    hasInitialized: boolean;
    isLoading: boolean;

    // Skill Actions
    setSkills: (skills: Skill[]) => void;
    markInitialized: () => void;
    addSkill: (skill: Skill) => void;
    updateSkill: (id: string, updates: Partial<Skill>) => void;
    deleteSkill: (id: string) => void;

    // Progress Actions
    addLog: (skillId: string, log: SkillLog) => void;
    deleteLog: (skillId: string, logId: string) => void;

    // Resource Actions
    addResource: (skillId: string, resource: SkillResource) => void;
    updateResource: (skillId: string, resourceId: string, updates: Partial<SkillResource>) => void;
    deleteResource: (skillId: string, resourceId: string) => void;

    // Roadmap Actions
    setRoadmap: (skillId: string, roadmap: SkillRoadmapItem[]) => void;
    toggleRoadmapItem: (skillId: string, itemId: string) => void;
    setVisualRoadmap: (skillId: string, visualRoadmap: VisualRoadmap) => void;
    setRoadmapViewMode: (skillId: string, mode: RoadmapViewMode) => void;

    // Micro-Achievements Actions
    addMicroAchievement: (skillId: string, title: string) => void;
    toggleMicroAchievement: (skillId: string, achievementId: string) => void;
    deleteMicroAchievement: (skillId: string, achievementId: string) => void;
    clearCompletedMicroAchievements: (skillId: string) => void;
    addPomodoro: (skillId: string) => void;

    // Next Day Content Actions
    addNextDayContent: (skillId: string, title: string, url?: string, notes?: string) => void;
    toggleNextDayContent: (skillId: string, contentId: string) => void;
    updateNextDayContent: (skillId: string, contentId: string, updates: Partial<NextDayContent>) => void;
    deleteNextDayContent: (skillId: string, contentId: string) => void;
    clearCompletedNextDayContents: (skillId: string) => void;

    setLoading: (loading: boolean) => void;
}

export const useSkillsStore = create<SkillsState>()(
    persist(
        (set) => ({
            skills: [],
            hasInitialized: false,
            isLoading: true,

            // Skill Actions
            setSkills: (skills) => set({ skills }),
            markInitialized: () => set({ hasInitialized: true }),

            addSkill: (skill) => set((state) => ({
                skills: [...state.skills, skill]
            })),

            updateSkill: (id, updates) => set((state) => ({
                skills: state.skills.map(s => s.id === id ? { ...s, ...updates } : s)
            })),

            deleteSkill: (id) => set((state) => ({
                skills: state.skills.filter(s => s.id !== id)
            })),

            // Progress Actions
            addLog: (skillId, log) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        logs: [...skill.logs, log],
                        currentMinutes: skill.currentMinutes + log.minutes
                    };
                })
            })),

            deleteLog: (skillId, logId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    const log = skill.logs.find(l => l.id === logId);
                    return {
                        ...skill,
                        logs: skill.logs.filter(l => l.id !== logId),
                        currentMinutes: log ? skill.currentMinutes - log.minutes : skill.currentMinutes
                    };
                })
            })),

            // Resource Actions
            addResource: (skillId, resource) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        resources: [...skill.resources, resource]
                    };
                })
            })),

            updateResource: (skillId, resourceId, updates) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        resources: skill.resources.map(r =>
                            r.id === resourceId ? { ...r, ...updates } : r
                        )
                    };
                })
            })),

            deleteResource: (skillId, resourceId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        resources: skill.resources.filter(r => r.id !== resourceId)
                    };
                })
            })),

            // Roadmap Actions
            setRoadmap: (skillId, roadmap) => set((state) => ({
                skills: state.skills.map(skill =>
                    skill.id === skillId ? { ...skill, roadmap } : skill
                )
            })),

            toggleRoadmapItem: (skillId, itemId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;

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
            })),

            setVisualRoadmap: (skillId, visualRoadmap) => set((state) => ({
                skills: state.skills.map(skill =>
                    skill.id === skillId ? { ...skill, visualRoadmap } : skill
                )
            })),

            setRoadmapViewMode: (skillId, mode) => set((state) => ({
                skills: state.skills.map(skill =>
                    skill.id === skillId ? { ...skill, roadmapViewMode: mode } : skill
                )
            })),

            // Micro-Achievements Actions
            addMicroAchievement: (skillId, title) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    const newAchievement: MicroAchievement = {
                        id: generateUUID(),
                        title,
                        isCompleted: false,
                        createdAt: Date.now()
                    };
                    return {
                        ...skill,
                        microAchievements: [...(skill.microAchievements || []), newAchievement]
                    };
                })
            })),

            toggleMicroAchievement: (skillId, achievementId) => set((state) => ({
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
            })),

            deleteMicroAchievement: (skillId, achievementId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        microAchievements: skill.microAchievements?.filter(a => a.id !== achievementId)
                    };
                })
            })),

            clearCompletedMicroAchievements: (skillId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        microAchievements: skill.microAchievements?.filter(a => !a.isCompleted)
                    };
                })
            })),

            addPomodoro: (skillId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    const newPomodoros = (skill.pomodorosCompleted || 0) + 1;
                    return {
                        ...skill,
                        pomodorosCompleted: newPomodoros,
                        currentMinutes: skill.currentMinutes + 25,
                        logs: [...skill.logs, {
                            id: generateUUID(),
                            date: new Date().toISOString(),
                            minutes: 25,
                            notes: '🍅 Pomodoro completado'
                        }]
                    };
                })
            })),

            // Next Day Content Actions
            addNextDayContent: (skillId, title, url, notes) => set((state) => ({
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
                    return {
                        ...skill,
                        nextDayContents: [...(skill.nextDayContents || []), newContent]
                    };
                })
            })),

            toggleNextDayContent: (skillId, contentId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        nextDayContents: skill.nextDayContents?.map(c =>
                            c.id === contentId
                                ? { ...c, isCompleted: !c.isCompleted }
                                : c
                        )
                    };
                })
            })),

            updateNextDayContent: (skillId, contentId, updates) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        nextDayContents: skill.nextDayContents?.map(c =>
                            c.id === contentId ? { ...c, ...updates } : c
                        )
                    };
                })
            })),

            deleteNextDayContent: (skillId, contentId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        nextDayContents: skill.nextDayContents?.filter(c => c.id !== contentId)
                    };
                })
            })),

            clearCompletedNextDayContents: (skillId) => set((state) => ({
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    return {
                        ...skill,
                        nextDayContents: skill.nextDayContents?.filter(c => !c.isCompleted)
                    };
                })
            })),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_skills_store',
            storage: createFirebaseStorage('p67_skills_store'),
            partialize: (state) => ({
                skills: state.skills,
                hasInitialized: state.hasInitialized
            }),
            onRehydrateStorage: () => (state) => {
                // Clean up any duplicate skills (same id)
                if (state?.skills?.length) {
                    const seen = new Set<string>();
                    const uniqueSkills = state.skills.filter(s => {
                        if (seen.has(s.id)) {
                            return false; // Skip duplicate ID
                        }
                        seen.add(s.id);
                        return true;
                    });

                    // Extra cleanup: Remove duplicate "English" modules (kept getting created)
                    // Keep the one with the most progress
                    const englishSkills = uniqueSkills.filter(s => s.name === 'Inglês Avançado');
                    if (englishSkills.length > 1) {
                        const bestEnglishSkill = englishSkills.reduce((prev, current) =>
                            (prev.currentMinutes > current.currentMinutes) ? prev : current
                        );

                        // Remove all english skills except the best one
                        const otherSkills = uniqueSkills.filter(s => s.name !== 'Inglês Avançado');
                        const finalSkills = [...otherSkills, bestEnglishSkill];

                        state.setSkills(finalSkills);
                    } else if (uniqueSkills.length !== state.skills.length) {
                        // There were duplicates by ID, update the store
                        state.setSkills(uniqueSkills);
                    }
                }
                state?.setLoading(false);
            },
        }
    )
);
