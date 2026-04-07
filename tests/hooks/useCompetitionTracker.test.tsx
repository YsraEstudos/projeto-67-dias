import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { useCompetitionTracker } from '../../hooks/useCompetitionTracker';
import {
    useCompetitionStore,
    useHabitsStore,
    useReadingStore,
    useSkillsStore,
    useWorkStore,
} from '../../stores';
import { calculateAdaptiveCompetitionMetrics } from '../../utils/competitionEngine';
import { getTodayISO } from '../../utils/dateUtils';
import type { Habit, OrganizeTask } from '../../types';

const TrackerHarness: React.FC<{ enabled: boolean; startDate: string }> = ({ enabled, startDate }) => {
    useCompetitionTracker({ enabled, startDate });
    return null;
};

const createHabit = (overrides: Partial<Habit> = {}): Habit => ({
    id: 'habit-1',
    title: 'Habit teste',
    category: 'Saude',
    goalType: 'BOOLEAN',
    frequency: 'DAILY',
    isNegative: false,
    subHabits: [],
    history: {},
    createdAt: Date.now(),
    archived: false,
    ...overrides,
});

const createTask = (overrides: Partial<OrganizeTask> = {}): OrganizeTask => ({
    id: 'task-1',
    title: 'Task teste',
    isCompleted: false,
    isArchived: false,
    category: 'Geral',
    createdAt: Date.now(),
    ...overrides,
});

describe('useCompetitionTracker', () => {
    beforeEach(() => {
        useCompetitionStore.getState()._reset();
        useWorkStore.getState()._reset();
        useHabitsStore.getState()._reset();
        useSkillsStore.getState()._reset();
        useReadingStore.getState()._reset();
    });

    it('updates today snapshot when work currentCount changes and keeps the same day record', async () => {
        const today = getTodayISO();

        act(() => {
            useWorkStore.setState({
                currentCount: 40,
                history: [],
                tasks: [],
                availableGoals: [],
            } as any);
            useHabitsStore.setState({ habits: [], tasks: [] } as any);
            useSkillsStore.setState({ skills: [] } as any);
            useReadingStore.setState({ books: [] } as any);
        });

        render(<TrackerHarness enabled startDate={today} />);

        const firstMetrics = calculateAdaptiveCompetitionMetrics(40, 390);
        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            expect(record?.activityScore).toBe(40);
            expect(record?.score).toBe(firstMetrics.score);
        });

        const firstUpdatedAt = useCompetitionStore.getState().competition.dailyRecords[today]?.updatedAt;

        act(() => {
            useWorkStore.setState({ currentCount: 130 } as any);
        });

        const secondMetrics = calculateAdaptiveCompetitionMetrics(180, 390);
        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const questoes = record?.breakdown.find((entry) => entry.id === 'questoes');
            expect(record?.activityScore).toBe(180);
            expect(record?.score).toBe(secondMetrics.score);
            expect(questoes?.points).toBe(180);
        });

        const latest = useCompetitionStore.getState().competition.dailyRecords[today];

        expect(useCompetitionStore.getState().competition.competitionStartedAt).not.toBeNull();
        expect(latest?.updatedAt).toBeGreaterThanOrEqual(firstUpdatedAt || 0);
        expect(Object.keys(useCompetitionStore.getState().competition.dailyRecords)).toEqual([today]);
    });

    it('recalculates today snapshot when reading progress changes', async () => {
        const today = getTodayISO();

        act(() => {
            useWorkStore.setState({
                currentCount: 0,
                history: [],
                tasks: [],
                availableGoals: [],
            } as any);
            useHabitsStore.setState({ habits: [], tasks: [] } as any);
            useSkillsStore.setState({ skills: [] } as any);
            useReadingStore.getState()._hydrateFromFirestore({
                books: [{
                    id: 'book-1',
                    title: 'Livro teste',
                    author: 'Autor teste',
                    genre: 'Estudo',
                    unit: 'PAGES',
                    total: 144,
                    current: 0,
                    status: 'READING',
                    rating: 0,
                    folderId: null,
                    notes: '',
                    addedAt: today,
                    dailyGoal: 20,
                    logs: [],
                }],
                folders: [],
            });
        });

        render(<TrackerHarness enabled startDate={today} />);

        await waitFor(() => {
            const reading = useCompetitionStore.getState().competition.dailyRecords[today]?.breakdown
                .find((entry) => entry.id === 'leitura');
            expect(reading?.points).toBe(0);
        });

        act(() => {
            useReadingStore.getState().updateProgress('book-1', 10);
        });

        const firstReadingMetrics = calculateAdaptiveCompetitionMetrics(45, 480);
        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const reading = record?.breakdown.find((entry) => entry.id === 'leitura');
            expect(record?.activityScore).toBe(45);
            expect(record?.score).toBe(firstReadingMetrics.score);
            expect(reading?.points).toBe(45);
        });

        act(() => {
            useReadingStore.getState().updateProgress('book-1', 20);
        });

        const secondReadingMetrics = calculateAdaptiveCompetitionMetrics(90, 480);
        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const reading = record?.breakdown.find((entry) => entry.id === 'leitura');
            expect(record?.activityScore).toBe(90);
            expect(record?.score).toBe(secondReadingMetrics.score);
            expect(reading?.points).toBe(90);
        });

        expect(Object.keys(useCompetitionStore.getState().competition.dailyRecords)).toEqual([today]);
    });

    it('recalculates today snapshot when a positive habit is marked', async () => {
        const today = getTodayISO();

        act(() => {
            useWorkStore.setState({
                currentCount: 0,
                history: [],
                tasks: [],
                availableGoals: [],
            } as any);
            useHabitsStore.setState({
                habits: [createHabit()],
                tasks: [],
            } as any);
            useSkillsStore.setState({ skills: [] } as any);
            useReadingStore.setState({ books: [] } as any);
        });

        render(<TrackerHarness enabled startDate={today} />);

        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const habits = record?.breakdown.find((entry) => entry.id === 'habitos');
            expect(habits?.points).toBe(0);
        });

        act(() => {
            useHabitsStore.getState().toggleHabitCompletion('habit-1', today);
        });

        const metrics = calculateAdaptiveCompetitionMetrics(40, 390);
        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const habits = record?.breakdown.find((entry) => entry.id === 'habitos');
            expect(record?.activityScore).toBe(40);
            expect(record?.score).toBe(metrics.score);
            expect(habits?.points).toBe(40);
        });
    });

    it('recalculates today snapshot when a sub-habit is marked', async () => {
        const today = getTodayISO();

        act(() => {
            useWorkStore.setState({
                currentCount: 0,
                history: [],
                tasks: [],
                availableGoals: [],
            } as any);
            useHabitsStore.setState({
                habits: [
                    createHabit({
                        subHabits: [
                            { id: 'sub-1', title: 'Sub 1' },
                            { id: 'sub-2', title: 'Sub 2' },
                        ],
                    }),
                ],
                tasks: [],
            } as any);
            useSkillsStore.setState({ skills: [] } as any);
            useReadingStore.setState({ books: [] } as any);
        });

        render(<TrackerHarness enabled startDate={today} />);

        act(() => {
            useHabitsStore.getState().toggleHabitCompletion('habit-1', today, 'sub-1');
        });

        const metrics = calculateAdaptiveCompetitionMetrics(40, 430);
        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const habits = record?.breakdown.find((entry) => entry.id === 'habitos');
            expect(record?.activityScore).toBe(40);
            expect(record?.score).toBe(metrics.score);
            expect(habits?.points).toBe(40);
            expect(habits?.maxPoints).toBe(80);
        });
    });

    it('recalculates today snapshot when a task is completed', async () => {
        const today = getTodayISO();

        act(() => {
            useWorkStore.setState({
                currentCount: 0,
                history: [],
                tasks: [],
                availableGoals: [],
            } as any);
            useHabitsStore.setState({
                habits: [],
                tasks: [createTask()],
            } as any);
            useSkillsStore.setState({ skills: [] } as any);
            useReadingStore.setState({ books: [] } as any);
        });

        render(<TrackerHarness enabled startDate={today} />);

        act(() => {
            useHabitsStore.getState().toggleTaskComplete('task-1');
        });

        const metrics = calculateAdaptiveCompetitionMetrics(22, 372);
        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const tasks = record?.breakdown.find((entry) => entry.id === 'tarefas');
            expect(record?.activityScore).toBe(22);
            expect(record?.score).toBe(metrics.score);
            expect(tasks?.points).toBe(22);
        });
    });

    it('allows a negative habit to pull the official daily score below zero', async () => {
        const today = getTodayISO();

        act(() => {
            useWorkStore.setState({
                currentCount: 0,
                history: [],
                tasks: [],
                availableGoals: [],
            } as any);
            useHabitsStore.setState({
                habits: [
                    createHabit({
                        isNegative: true,
                        subHabits: [
                            { id: 'trigger-1', title: 'Trigger 1' },
                            { id: 'trigger-2', title: 'Trigger 2' },
                        ],
                    }),
                ],
                tasks: [],
            } as any);
            useSkillsStore.setState({ skills: [] } as any);
            useReadingStore.setState({ books: [] } as any);
        });

        render(<TrackerHarness enabled startDate={today} />);

        act(() => {
            useHabitsStore.getState().toggleHabitCompletion('habit-1', today, 'trigger-1');
            useHabitsStore.getState().toggleHabitCompletion('habit-1', today, 'trigger-2');
        });

        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const habits = record?.breakdown.find((entry) => entry.id === 'habitos');
            expect(record?.activityScore).toBeLessThan(0);
            expect(record?.score).toBeLessThan(0);
            expect(habits?.points).toBe(-80);
        });
    });
});
