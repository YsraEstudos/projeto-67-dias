/**
 * Config Store - Project configuration with Firestore-first persistence
 */
import { create } from 'zustand';
import { ProjectConfig, OffensiveGoalsConfig } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_project_config';
const THEME_WHITELIST = ['default', 'amoled'] as const;

export const DEFAULT_OFFENSIVE_GOALS: OffensiveGoalsConfig = {
    minimumPercentage: 50,
    enabledModules: {
        skills: true,
        reading: true,
        games: true,
    },
    categoryWeights: {
        skills: 50,
        reading: 30,
        games: 20,
    },
    focusSkills: [],
    dailyGameHoursGoal: 1,
};

const sanitizeOffensive = (input?: OffensiveGoalsConfig): OffensiveGoalsConfig => ({
    minimumPercentage: Math.min(100, Math.max(0, input?.minimumPercentage ?? 50)),
    enabledModules: {
        skills: !!input?.enabledModules?.skills,
        reading: !!input?.enabledModules?.reading,
        games: !!input?.enabledModules?.games,
    },
    categoryWeights: {
        skills: Math.max(0, input?.categoryWeights?.skills ?? 50),
        reading: Math.max(0, input?.categoryWeights?.reading ?? 30),
        games: Math.max(0, input?.categoryWeights?.games ?? 20),
    },
    focusSkills: Array.isArray(input?.focusSkills)
        ? input.focusSkills.map((value) => String(value).slice(0, 120)).slice(0, 50)
        : [],
    dailyGameHoursGoal: Math.max(0, Math.min(24, input?.dailyGameHoursGoal ?? 1)),
});

const sanitizeConfig = (updates: Partial<ProjectConfig>, base: ProjectConfig): ProjectConfig => {
    const theme = updates.theme && THEME_WHITELIST.includes(updates.theme as (typeof THEME_WHITELIST)[number])
        ? updates.theme
        : base.theme;

    return {
        ...base,
        startDate: updates.startDate ?? base.startDate,
        userName: (updates.userName ?? base.userName).trim().slice(0, 120),
        isGuest: updates.isGuest ?? base.isGuest,
        isProjectStarted: updates.isProjectStarted ?? base.isProjectStarted,
        restartCount: Math.max(0, updates.restartCount ?? base.restartCount),
        offensiveGoals: sanitizeOffensive(updates.offensiveGoals ?? base.offensiveGoals),
        theme,
    };
};

const DEFAULT_CONFIG: ProjectConfig = {
    startDate: new Date().toISOString(),
    userName: '',
    isGuest: false,
    isProjectStarted: false,
    restartCount: 0,
    offensiveGoals: DEFAULT_OFFENSIVE_GOALS,
    theme: 'default',
};

interface ConfigState {
    config: ProjectConfig;
    isLoading: boolean;
    _initialized: boolean;

    // Actions
    setConfig: (config: Partial<ProjectConfig>) => void;
    resetConfig: () => void;
    setLoading: (loading: boolean) => void;

    // Internal sync methods
    _syncToFirestore: () => void;
    _hydrateFromFirestore: (data: { config: ProjectConfig } | null) => void;
    _reset: () => void;
}

export const useConfigStore = create<ConfigState>()((set, get) => ({
    config: DEFAULT_CONFIG,
    isLoading: true,
    _initialized: false,

    setConfig: (updates) => {
        set((state) => ({
            config: sanitizeConfig(updates, state.config)
        }));
        get()._syncToFirestore();
    },

    resetConfig: () => {
        const nextConfig = sanitizeConfig({
            startDate: new Date().toISOString(),
            isProjectStarted: false
        }, DEFAULT_CONFIG);
        set({ config: nextConfig });
        get()._syncToFirestore();
    },

    setLoading: (loading) => set({ isLoading: loading }),

    _syncToFirestore: () => {
        const { config, _initialized } = get();
        if (_initialized) {
            writeToFirestore(STORE_KEY, { config });
        }
    },

    _hydrateFromFirestore: (data) => {
        if (data?.config) {
            set({
                config: sanitizeConfig(data.config, DEFAULT_CONFIG),
                isLoading: false,
                _initialized: true
            });
        } else {
            set({ isLoading: false, _initialized: true });
        }
    },

    _reset: () => {
        set({
            config: DEFAULT_CONFIG,
            isLoading: true,
            _initialized: false
        });
    }
}));
