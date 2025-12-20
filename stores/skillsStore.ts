/**
 * Skills Store - Skills with Firestore-first persistence
 */
import { create } from 'zustand';
import { Skill, SkillLog, SkillResource, SkillRoadmapItem, VisualRoadmap, RoadmapViewMode, MicroAchievement, NextDayContent } from '../types';
import { writeToFirestore } from './firestoreSync';
import { generateUUID } from '../utils/uuid';

const STORE_KEY = 'p67_skills_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

interface SkillsState {
    skills: Skill[];
    hasInitialized: boolean;
    isLoading: boolean;
    _initialized: boolean;

    setSkills: (skills: Skill[]) => void;
    markInitialized: () => void;
    addSkill: (skill: Skill) => void;
    updateSkill: (id: string, updates: Partial<Skill>) => void;
    deleteSkill: (id: string) => void;

    addLog: (skillId: string, log: SkillLog) => void;
    deleteLog: (skillId: string, logId: string) => void;

    addResource: (skillId: string, resource: SkillResource) => void;
    updateResource: (skillId: string, resourceId: string, updates: Partial<SkillResource>) => void;
    deleteResource: (skillId: string, resourceId: string) => void;

    setRoadmap: (skillId: string, roadmap: SkillRoadmapItem[]) => void;
    toggleRoadmapItem: (skillId: string, itemId: string) => void;
    setVisualRoadmap: (skillId: string, visualRoadmap: VisualRoadmap) => void;
    setRoadmapViewMode: (skillId: string, mode: RoadmapViewMode) => void;

    addMicroAchievement: (skillId: string, title: string) => void;
    toggleMicroAchievement: (skillId: string, achievementId: string) => void;
    deleteMicroAchievement: (skillId: string, achievementId: string) => void;
    clearCompletedMicroAchievements: (skillId: string) => void;
    addPomodoro: (skillId: string) => void;

    addNextDayContent: (skillId: string, title: string, url?: string, notes?: string) => void;
    toggleNextDayContent: (skillId: string, contentId: string) => void;
    updateNextDayContent: (skillId: string, contentId: string, updates: Partial<NextDayContent>) => void;
    deleteNextDayContent: (skillId: string, contentId: string) => void;
    clearCompletedNextDayContents: (skillId: string) => void;

    completeSkill: (skillId: string) => void;
    uncompleteSkill: (skillId: string) => void;

    // Exponential Distribution Actions
    setDistributionType: (skillId: string, type: 'LINEAR' | 'EXPONENTIAL') => void;
    setExponentialIntensity: (skillId: string, intensity: number) => void;
    toggleExcludedDay: (skillId: string, dayOfWeek: number) => void;
    setExcludedDays: (skillId: string, days: number[]) => void;

    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { skills: Skill[]; hasInitialized: boolean } | null) => void;
    _reset: () => void;
}

export const useSkillsStore = create<SkillsState>()((set, get) => ({
    skills: [],
    hasInitialized: false,
    isLoading: true,
    _initialized: false,

    setSkills: (skills) => {
        set({ skills: deduplicateById(skills) });
        get()._syncToFirestore();
    },

    markInitialized: () => {
        set({ hasInitialized: true });
        get()._syncToFirestore();
    },

    addSkill: (skill) => {
        set((state) => ({ skills: [...state.skills, skill] }));
        get()._syncToFirestore();
    },

    updateSkill: (id, updates) => {
        set((state) => ({
            skills: state.skills.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
        get()._syncToFirestore();
    },

    deleteSkill: (id) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === id);
            if (skill?.name === 'Inglês Avançado') return state;
            return { skills: state.skills.filter(s => s.id !== id) };
        });
        get()._syncToFirestore();
    },

    addLog: (skillId, log) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    logs: [...skill.logs, log],
                    currentMinutes: skill.currentMinutes + log.minutes
                };
            })
        }));
        get()._syncToFirestore();
    },

    deleteLog: (skillId, logId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill?.name === 'Inglês Avançado') return state;
            return {
                skills: state.skills.map(skill => {
                    if (skill.id !== skillId) return skill;
                    const log = skill.logs.find(l => l.id === logId);
                    return {
                        ...skill,
                        logs: skill.logs.filter(l => l.id !== logId),
                        currentMinutes: log ? skill.currentMinutes - log.minutes : skill.currentMinutes
                    };
                })
            };
        });
        get()._syncToFirestore();
    },

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
    },

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
    },

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
    },

    addPomodoro: (skillId) => {
        set((state) => ({
            skills: state.skills.map(skill => {
                if (skill.id !== skillId) return skill;
                return {
                    ...skill,
                    pomodorosCompleted: (skill.pomodorosCompleted || 0) + 1,
                    currentMinutes: skill.currentMinutes + 25,
                    logs: [...skill.logs, {
                        id: generateUUID(),
                        date: new Date().toISOString(),
                        minutes: 25,
                        notes: '🍅 Pomodoro completado'
                    }]
                };
            })
        }));
        get()._syncToFirestore();
    },

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
    },

    completeSkill: (skillId) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, isCompleted: true, completedAt: Date.now() } : s
            )
        }));
        get()._syncToFirestore();
    },

    uncompleteSkill: (skillId) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, isCompleted: false, completedAt: undefined } : s
            )
        }));
        get()._syncToFirestore();
    },

    // Exponential Distribution Actions
    setDistributionType: (skillId, type) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, distributionType: type } : s
            )
        }));
        get()._syncToFirestore();
    },

    setExponentialIntensity: (skillId, intensity) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, exponentialIntensity: Math.max(0, Math.min(1, intensity)) } : s
            )
        }));
        get()._syncToFirestore();
    },

    toggleExcludedDay: (skillId, dayOfWeek) => {
        set((state) => ({
            skills: state.skills.map(s => {
                if (s.id !== skillId) return s;
                const currentDays = s.excludedDays || [];
                const newDays = currentDays.includes(dayOfWeek)
                    ? currentDays.filter(d => d !== dayOfWeek)
                    : [...currentDays, dayOfWeek].sort();
                return { ...s, excludedDays: newDays };
            })
        }));
        get()._syncToFirestore();
    },

    setExcludedDays: (skillId, days) => {
        set((state) => ({
            skills: state.skills.map(s =>
                s.id === skillId ? { ...s, excludedDays: days.sort() } : s
            )
        }));
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { skills, hasInitialized, _initialized } = get();
        if (_initialized) {
            // Use requestIdleCallback for non-blocking Firestore sync
            // Falls back to setTimeout for browsers without support
            const scheduleSync = () => writeToFirestore(STORE_KEY, { skills, hasInitialized });

            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(scheduleSync, { timeout: 2000 });
            } else {
                setTimeout(scheduleSync, 100);
            }
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data) {
            let skills = deduplicateById(data.skills || []);

            // Extra cleanup: Remove duplicate English skills, keep the one with most progress
            const englishSkills = skills.filter(s => s.name === 'Inglês Avançado');
            if (englishSkills.length > 1) {
                const bestEnglishSkill = englishSkills.reduce((prev, current) =>
                    (prev.currentMinutes > current.currentMinutes) ? prev : current
                );
                const otherSkills = skills.filter(s => s.name !== 'Inglês Avançado');
                skills = [...otherSkills, bestEnglishSkill];
            }

            set({
                skills,
                hasInitialized: data.hasInitialized || false,
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({ skills: [], hasInitialized: false, isLoading: true, _initialized: false });
    }
}));
