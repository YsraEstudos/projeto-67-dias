import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSkillsStore } from '../stores/skillsStore';
import { act } from '@testing-library/react';

// Mock useStorage and persistMiddleware
vi.mock('../stores/persistMiddleware', () => ({
    createFirebaseStorage: () => ({
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    }),
    persistMiddleware: (config: any) => config
}));

// Mock Firebase
vi.mock('../services/firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'test-uid' } }
}));

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
}));

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback({ uid: 'test-uid' });
        return () => { };
    })
}));

describe('Skills Store Protection', () => {
    beforeEach(() => {
        useSkillsStore.setState({
            skills: [],
            hasInitialized: true,
            isLoading: false
        });
    });

    it('should prevent deletion of "Inglês Avançado" skill', () => {
        const store = useSkillsStore.getState();

        // Add protected skill
        act(() => {
            store.addSkill({
                id: 'english-1',
                name: 'Inglês Avançado',
                level: 'Avançado',
                currentMinutes: 0,
                goalMinutes: 100,
                resources: [],
                roadmap: [],
                logs: [],
                colorTheme: 'blue',
                createdAt: Date.now()
            });

            // Add unprotected skill
            store.addSkill({
                id: 'other-1',
                name: 'Outra Skill',
                level: 'Iniciante',
                currentMinutes: 0,
                goalMinutes: 100,
                resources: [],
                roadmap: [],
                logs: [],
                colorTheme: 'red',
                createdAt: Date.now()
            });
        });

        // Verify both exist
        expect(useSkillsStore.getState().skills).toHaveLength(2);

        // Try to delete protected skill
        act(() => {
            useSkillsStore.getState().deleteSkill('english-1');
        });

        // Should still exist
        expect(useSkillsStore.getState().skills).toHaveLength(2);
        expect(useSkillsStore.getState().skills.find(s => s.id === 'english-1')).toBeDefined();

        // Try to delete unprotected skill
        act(() => {
            useSkillsStore.getState().deleteSkill('other-1');
        });

        // Should be gone
        expect(useSkillsStore.getState().skills).toHaveLength(1);
        expect(useSkillsStore.getState().skills.find(s => s.id === 'other-1')).toBeUndefined();
    });

    it('should prevent deletion of logs in "Inglês Avançado"', () => {
        const store = useSkillsStore.getState();

        act(() => {
            store.addSkill({
                id: 'english-1',
                name: 'Inglês Avançado',
                level: 'Avançado',
                currentMinutes: 0,
                goalMinutes: 100,
                resources: [],
                roadmap: [],
                logs: [{ id: 'log-1', date: '2024-01-01', minutes: 60 }],
                colorTheme: 'blue',
                createdAt: Date.now()
            });
        });

        // Try to delete log
        act(() => {
            useSkillsStore.getState().deleteLog('english-1', 'log-1');
        });

        // Log should still exist
        const skill = useSkillsStore.getState().skills.find(s => s.id === 'english-1');
        expect(skill?.logs).toHaveLength(1);
    });
});
