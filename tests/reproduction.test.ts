import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSkillsStore } from '../stores/skillsStore';
import { act } from '@testing-library/react';

// Mock useStorage and persistMiddleware
vi.mock('../stores/persistMiddleware', () => ({
    createFirebaseStorage: () => ({
        // Simulate storage
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    }),
    persistMiddleware: (config: any) => config
}));

describe('Skills Persistence Reproduction', () => {
    beforeEach(() => {
        useSkillsStore.setState({
            skills: [],
            hasInitialized: false,
            isLoading: false
        });
    });

    it('should NOT re-add "Inglês Avançado" after deletion', () => {
        const store = useSkillsStore.getState();

        // 1. Simulate Initialization
        act(() => {
            store.markInitialized();
            store.addSkill({
                id: 'english-1',
                name: 'Inglês Avançado',
                level: 'Avançado',
                currentMinutes: 0,
                goalMinutes: 100,
                resources: [],
                roadmap: [],
                logs: [],
                colorTheme: 'emerald',
                createdAt: Date.now()
            });
        });

        expect(useSkillsStore.getState().skills).toHaveLength(1);
        expect(useSkillsStore.getState().hasInitialized).toBe(true);

        // 2. Simulate Deletion
        act(() => {
            useSkillsStore.getState().deleteSkill('english-1');
        });

        expect(useSkillsStore.getState().skills).toHaveLength(0);

        // 3. Simulate "Re-check" or logic that might run
        // In the app, SkillsView useEffect runs.
        // It checks !skillsLoading && skills.length === 0 && !hasInitialized
        // skills.length is 0.
        // hasInitialized IS TRUE.

        const shouldReInitialize =
            !useSkillsStore.getState().isLoading &&
            useSkillsStore.getState().skills.length === 0 &&
            !useSkillsStore.getState().hasInitialized;

        expect(shouldReInitialize).toBe(false);
    });
});
