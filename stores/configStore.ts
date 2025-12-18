/**
 * Config Store - Project configuration with Firestore-first persistence
 */
import { create } from 'zustand';
import { ProjectConfig, OffensiveGoalsConfig } from '../types';
import { writeToFirestore } from './firestoreSync';

const STORE_KEY = 'p67_project_config';

export const DEFAULT_OFFENSIVE_GOALS: OffensiveGoalsConfig = {
    minimumPercentage: 50,
    categoryWeights: {
        skills: 50,
        reading: 30,
        games: 20,
    },
    focusSkills: [],
    dailyGameHoursGoal: 1,
};

const DEFAULT_CONFIG: ProjectConfig = {
    startDate: new Date().toISOString(),
    userName: '',
    isGuest: false,
    restartCount: 0,
    offensiveGoals: DEFAULT_OFFENSIVE_GOALS
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
            config: { ...state.config, ...updates }
        }));
        get()._syncToFirestore();
    },

    resetConfig: () => {
        set({
            config: {
                ...DEFAULT_CONFIG,
                startDate: new Date().toISOString()
            }
        });
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
                config: { ...DEFAULT_CONFIG, ...data.config },
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
