import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Skill, SkillGoal } from '../../types';

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
    createdAt: Date.now(),
};

const seedSkill = (overrides: Partial<Skill> = {}) => {
    useSkillsStore.setState({
        skills: [{ ...BASE_SKILL, ...overrides }],
        _initialized: true,
    });
};

const makeGoal = (overrides: Partial<SkillGoal> = {}): SkillGoal => ({
    id: 'goal-1',
    title: 'Meta 1',
    points: 50,
    status: 'pending',
    createdAt: Date.now(),
    ...overrides,
});

describe('skillsStore goal actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSkillsStore.getState()._reset();
        useSkillsStore.getState()._hydrateFromFirestore(null);
        vi.clearAllMocks();
    });

    it('addGoal creates a pending goal with generated id, defaults, and clamps points <= 0 to 1', () => {
        seedSkill();

        useSkillsStore.getState().addGoal('skill-1', { title: 'Aprender React', description: 'Fundamentos', points: 0 });

        const skill = useSkillsStore.getState().skills[0];
        expect(skill.goals).toHaveLength(1);

        const goal = skill.goals![0];
        expect(goal.id).toBeDefined();
        expect(goal.title).toBe('Aprender React');
        expect(goal.description).toBe('Fundamentos');
        expect(goal.points).toBe(1); // clamped from 0
        expect(goal.status).toBe('pending');
        expect(goal.completedAt).toBeUndefined();
        expect(goal.createdAt).toBeTypeOf('number');
    });

    it('addGoal clamps NaN points to 1 and ignores empty titles', () => {
        seedSkill();

        useSkillsStore.getState().addGoal('skill-1', { title: 'Meta XP', points: Number.NaN });
        useSkillsStore.getState().addGoal('skill-1', { title: '   ', points: 10 });

        const skill = useSkillsStore.getState().skills[0];
        expect(skill.goals).toHaveLength(1);
        expect(skill.goals![0].points).toBe(1);
    });

    it('toggleGoalComplete sets status completed, adds points to totalXp, and increments levelNumber from 1 to 2', () => {
        seedSkill({
            goals: [makeGoal({ points: 50 })],
        });

        useSkillsStore.getState().toggleGoalComplete('skill-1', 'goal-1');

        const skill = useSkillsStore.getState().skills[0];
        expect(skill.goals![0].status).toBe('completed');
        expect(skill.goals![0].completedAt).toBeTypeOf('number');
        expect(skill.totalXp).toBe(50);
        expect(skill.levelNumber).toBe(2);
    });

    it('toggling back to pending reverts totalXp and decrements levelNumber back to 1', () => {
        seedSkill({
            totalXp: 50,
            levelNumber: 2,
            goals: [makeGoal({ status: 'completed', completedAt: Date.now(), points: 50 })],
        });

        useSkillsStore.getState().toggleGoalComplete('skill-1', 'goal-1');

        const skill = useSkillsStore.getState().skills[0];
        expect(skill.goals![0].status).toBe('pending');
        expect(skill.goals![0].completedAt).toBeUndefined();
        expect(skill.totalXp).toBe(0);
        expect(skill.levelNumber).toBe(1);
    });

    it('updateGoal edits title and points; if goal completed, totalXp adjusts by the points difference', () => {
        seedSkill({
            totalXp: 10,
            levelNumber: 2,
            goals: [makeGoal({ status: 'completed', completedAt: Date.now(), points: 10 })],
        });

        useSkillsStore.getState().updateGoal('skill-1', 'goal-1', { title: 'Meta Nova', points: 25 });

        const skill = useSkillsStore.getState().skills[0];
        const goal = skill.goals![0];
        expect(goal.title).toBe('Meta Nova');
        expect(goal.points).toBe(25);
        expect(skill.totalXp).toBe(25); // 10 - 10 + 25
        expect(skill.levelNumber).toBe(2); // level unchanged by points edit
    });

    it('updateGoal on a pending goal does not touch totalXp and clamps points to >= 1', () => {
        seedSkill({
            goals: [makeGoal({ points: 10 })],
        });

        useSkillsStore.getState().updateGoal('skill-1', 'goal-1', { points: 0 });

        const skill = useSkillsStore.getState().skills[0];
        const goal = skill.goals![0];
        expect(goal.points).toBe(1); // clamped
        expect(skill.totalXp).toBeUndefined();

        useSkillsStore.getState().updateGoal('skill-1', 'goal-1', { title: '   ' });
        expect(skill.goals![0].title).toBe('Meta 1'); // empty title ignored
    });

    it('deleteGoal removes the goal; if it was completed, totalXp and levelNumber revert', () => {
        seedSkill({
            totalXp: 10,
            levelNumber: 2,
            goals: [makeGoal({ status: 'completed', completedAt: Date.now(), points: 10 })],
        });

        useSkillsStore.getState().deleteGoal('skill-1', 'goal-1');

        const skill = useSkillsStore.getState().skills[0];
        expect(skill.goals).toHaveLength(0);
        expect(skill.totalXp).toBe(0);
        expect(skill.levelNumber).toBe(1);
    });

    it('deleteGoal of a pending goal does not affect totalXp or levelNumber', () => {
        seedSkill({
            goals: [makeGoal({ points: 10 })],
        });

        useSkillsStore.getState().deleteGoal('skill-1', 'goal-1');

        const skill = useSkillsStore.getState().skills[0];
        expect(skill.goals).toHaveLength(0);
        expect(skill.totalXp).toBeUndefined();
        expect(skill.levelNumber).toBeUndefined();
    });
});
