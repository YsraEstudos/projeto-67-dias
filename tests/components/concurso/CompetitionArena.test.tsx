import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { ChampionshipView } from '../../../components/skills/ChampionshipView';
import { useCompetitionStore } from '../../../stores/competitionStore';
import {
    COMPETITION_ENGINE_VERSION,
    createCompetitionDailyRecord,
} from '../../../utils/competitionEngine';
import { getTodayISO } from '../../../utils/dateUtils';

const createArenaRecord = () => createCompetitionDailyRecord({
    startDate: getTodayISO(),
    currentCount: 120,
    workHistory: [],
    scheduledTasks: [],
    availableGoals: [],
    habits: [],
    tasks: [],
    skills: [],
    books: [],
    restActivities: [],
});

describe('CompetitionArena legacy coverage', () => {
    beforeEach(() => {
        useCompetitionStore.getState()._reset();
    });

    it('renders the current championship dashboard widgets', () => {
        const record = createArenaRecord();

        useCompetitionStore.getState()._hydrateFromFirestore({
            competition: {
                competitionStartedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
                engineVersion: COMPETITION_ENGINE_VERSION,
                roster: [],
                dailyRecords: {
                    [record.date]: record,
                },
                lastSyncedDate: record.date,
            },
        });

        render(<ChampionshipView />);

        expect(screen.getByText('Ganhos de Hoje')).toBeInTheDocument();
        expect(screen.getByText('Radar de Rivais')).toBeInTheDocument();
        expect(screen.getByText(/Ascensão no Ranking/i)).toBeInTheDocument();
    });
});
