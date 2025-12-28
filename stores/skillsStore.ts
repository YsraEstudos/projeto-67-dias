/**
 * Skills Store - Skills with Firestore-first persistence
 * Refactored to use modular action slices with Immer middleware
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Skill, SkillLog, SkillResource, SkillRoadmapItem, VisualRoadmap, RoadmapViewMode, MicroAchievement, NextDayContent } from '../types';
import { writeToFirestore } from './firestoreSync';

// Import action slices
import { createLogActions, LogActions } from './skills/logActions';
import { createResourceActions, ResourceActions } from './skills/resourceActions';
import { createRoadmapActions, RoadmapActions } from './skills/roadmapActions';
import { createMicroAchievementActions, MicroAchievementActions } from './skills/microAchievementActions';
import { createPomodoroActions, PomodoroActions } from './skills/pomodoroActions';
import { createNextDayContentActions, NextDayContentActions } from './skills/nextDayContentActions';
import { createDistributionActions, DistributionActions } from './skills/distributionActions';
import { createSectionVisibilityActions, SectionVisibilityActions } from './skills/sectionVisibilityActions';
import { createHistoryActions, HistoryActions } from './skills/historyActions';

const STORE_KEY = 'p67_skills_store';

const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

// Base state and CRUD actions interface
interface SkillsBaseState {
    skills: Skill[];
    hasInitialized: boolean;
    isLoading: boolean;
    _initialized: boolean;

    setSkills: (skills: Skill[]) => void;
    markInitialized: () => void;
    addSkill: (skill: Skill) => void;
    updateSkill: (id: string, updates: Partial<Skill>) => void;
    deleteSkill: (id: string) => void;
    completeSkill: (skillId: string) => void;
    uncompleteSkill: (skillId: string) => void;
    setLoading: (loading: boolean) => void;

    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { skills: Skill[]; hasInitialized: boolean } | null) => void;
    _reset: () => void;
}

// Combined state type with all action slices
interface SkillsState extends SkillsBaseState,
    LogActions,
    ResourceActions,
    RoadmapActions,
    MicroAchievementActions,
    PomodoroActions,
    NextDayContentActions,
    DistributionActions,
    SectionVisibilityActions,
    HistoryActions { }

export const useSkillsStore = create<SkillsState>()(immer((set, get) => ({
    // Initial state
    skills: [],
    hasInitialized: false,
    isLoading: true,
    _initialized: false,

    // Base CRUD actions
    setSkills: (skills) => {
        set((state) => { state.skills = deduplicateById(skills); });
        get()._syncToFirestore();
    },

    markInitialized: () => {
        set((state) => { state.hasInitialized = true; });
        get()._syncToFirestore();
    },

    addSkill: (skill) => {
        set((state) => { state.skills.push(skill); });
        get()._syncToFirestore();
    },

    updateSkill: (id, updates) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === id);
            if (skill) Object.assign(skill, updates);
        });
        get()._syncToFirestore();
    },

    deleteSkill: (id) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === id);
            if (skill?.name === 'Inglês Avançado') return;
            const idx = state.skills.findIndex(s => s.id === id);
            if (idx !== -1) state.skills.splice(idx, 1);
        });
        get()._syncToFirestore();
    },

    completeSkill: (skillId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                skill.isCompleted = true;
                skill.completedAt = Date.now();
            }
        });
        get()._syncToFirestore();
    },

    uncompleteSkill: (skillId) => {
        set((state) => {
            const skill = state.skills.find(s => s.id === skillId);
            if (skill) {
                skill.isCompleted = false;
                skill.completedAt = undefined;
            }
        });
        get()._syncToFirestore();
    },

    // Spread action slices
    ...createLogActions(set as any, get as any),
    ...createResourceActions(set as any, get as any),
    ...createRoadmapActions(set as any, get as any),
    ...createMicroAchievementActions(set as any, get as any),
    ...createPomodoroActions(set as any, get as any),
    ...createNextDayContentActions(set as any, get as any),
    ...createDistributionActions(set as any, get as any),
    ...createSectionVisibilityActions(set as any, get as any),
    ...createHistoryActions(set as any, get as any),

    // Internal methods
    setLoading: (loading) => set((state) => { state.isLoading = loading; }),

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

            set((state) => {
                state.skills = skills;
                state.hasInitialized = data.hasInitialized || false;
                state.isLoading = false;
                state._initialized = true;
            });
        } else {
            set((state) => {
                state.isLoading = false;
                state._initialized = true;
            });
        }
    },

    _reset: () => {
        set((state) => {
            state.skills = [];
            state.hasInitialized = false;
            state.isLoading = true;
            state._initialized = false;
        });
    }
})));
