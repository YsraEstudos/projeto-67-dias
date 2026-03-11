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

        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            expect(record?.score).toBe(40);
        });

        const firstUpdatedAt = useCompetitionStore.getState().competition.dailyRecords[today]?.updatedAt;

        act(() => {
            useWorkStore.setState({ currentCount: 130 } as any);
        });

        await waitFor(() => {
            const record = useCompetitionStore.getState().competition.dailyRecords[today];
            const questoes = record?.breakdown.find((entry) => entry.id === 'questoes');
            expect(record?.score).toBe(180);
            expect(questoes?.points).toBe(180);
        });

        const latest = useCompetitionStore.getState().competition.dailyRecords[today];

        expect(useCompetitionStore.getState().competition.competitionStartedAt).not.toBeNull();
        expect(latest?.updatedAt).toBeGreaterThanOrEqual(firstUpdatedAt || 0);
        expect(Object.keys(useCompetitionStore.getState().competition.dailyRecords)).toEqual([today]);
    });
});
