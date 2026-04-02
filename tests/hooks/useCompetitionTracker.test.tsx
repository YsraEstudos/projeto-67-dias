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

const TrackerHarness: React.FC<{ enabled: boolean; startDate: string }> = ({ enabled, startDate }) => {
    useCompetitionTracker({ enabled, startDate });
    return null;
};

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
});
