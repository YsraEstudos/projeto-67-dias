import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Skill } from '../../types';

const { writeToFirestoreMock } = vi.hoisted(() => ({
    writeToFirestoreMock: vi.fn(),
}));

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: writeToFirestoreMock,
}));

import { useSkillsStore } from '../../stores/skillsStore';

const BASE_SKILL: Skill = {
    id: 'skill-1',
    name: 'Test Skill',
    level: 'Intermediário',
    currentMinutes: 0,
    goalMinutes: 100,
    resources: [],
    roadmap: [],
    logs: [],
    colorTheme: 'emerald',
    createdAt: 0,
};

const seedSkill = (overrides: Partial<Skill> = {}) => {
    useSkillsStore.setState({ skills: [{ ...BASE_SKILL, ...overrides }], _initialized: true });
};

const getSkill = () => useSkillsStore.getState().skills[0];

describe('skillsStore core actions', () => {
    beforeEach(() => {
        useSkillsStore.getState()._reset();
        useSkillsStore.getState()._hydrateFromFirestore(null);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('deleteLog', () => {
        it('never drives currentMinutes below zero after a manual hours correction', () => {
            // User corrected studied hours to 10min while a 60min log still exists
            seedSkill({ currentMinutes: 10, logs: [{ id: 'log-1', date: '2026-01-01T10:00:00.000Z', minutes: 60 }] });

            useSkillsStore.getState().deleteLog('skill-1', 'log-1');

            expect(getSkill().logs).toHaveLength(0);
            expect(getSkill().currentMinutes).toBe(0);
        });

        it('subtracts the log minutes in the normal case', () => {
            seedSkill({ currentMinutes: 90, logs: [{ id: 'log-1', date: '2026-01-01T10:00:00.000Z', minutes: 60 }] });

            useSkillsStore.getState().deleteLog('skill-1', 'log-1');

            expect(getSkill().currentMinutes).toBe(30);
        });
    });

    describe('addLog', () => {
        it('initializes a missing logs array from legacy data', () => {
            seedSkill({ logs: undefined as unknown as Skill['logs'] });

            useSkillsStore.getState().addLog('skill-1', { id: 'l', date: '2026-01-01T10:00:00.000Z', minutes: 25 });

            expect(getSkill().logs).toHaveLength(1);
            expect(getSkill().currentMinutes).toBe(25);
        });
    });

    describe('roadmap backups', () => {
        it('creates a backup even when crypto.randomUUID is unavailable (non-secure context)', () => {
            vi.stubGlobal('crypto', {});
            seedSkill({ roadmap: [{ id: 't1', title: 'Task', isCompleted: false, type: 'TASK' }] });

            expect(() => useSkillsStore.getState().createRoadmapBackup('skill-1', 'Antes')).not.toThrow();

            const history = getSkill().roadmapHistory!;
            expect(history).toHaveLength(1);
            expect(typeof history[0].id).toBe('string');
            expect(history[0].id.length).toBeGreaterThan(0);
        });

        it('setRoadmap import keeps completion timestamps of completed items', () => {
            seedSkill({ roadmap: [{ id: 'old', title: 'Old', isCompleted: false, type: 'TASK' }] });

            useSkillsStore.getState().setRoadmap('skill-1', [
                { id: 'a', title: 'Done', isCompleted: true, completedAt: 1700000000000, type: 'TASK' },
                { id: 'b', title: 'Todo', isCompleted: false, type: 'TASK' },
            ], { createBackup: true, backupLabel: 'Import' });

            const skill = getSkill();
            expect(skill.roadmap[0].completedAt).toBe(1700000000000);
            expect(skill.roadmap[1].completedAt).toBeUndefined();
            expect(skill.roadmapHistory?.[0].label).toBe('Import');
        });
    });
});
