/**
 * Config Store - Project configuration with Firebase persistence
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectConfig } from '../types';
import { createFirebaseStorage } from './persistMiddleware';

interface ConfigState {
    config: ProjectConfig;
    isLoading: boolean;

    // Actions
    setConfig: (config: Partial<ProjectConfig>) => void;
    resetConfig: () => void;
    setLoading: (loading: boolean) => void;
}

const DEFAULT_CONFIG: ProjectConfig = {
    startDate: new Date().toISOString(),
    userName: '',
    isGuest: false,
    restartCount: 0
};

export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            config: DEFAULT_CONFIG,
            isLoading: true,

            setConfig: (updates) => set((state) => ({
                config: { ...state.config, ...updates }
            })),

            resetConfig: () => set({
                config: {
                    ...DEFAULT_CONFIG,
                    startDate: new Date().toISOString() // Dynamic date on reset
                }
            }),

            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'p67_project_config',
            storage: createFirebaseStorage('p67_project_config'),
            onRehydrateStorage: () => (state) => {
                state?.setLoading(false);
            },
        }
    )
);
