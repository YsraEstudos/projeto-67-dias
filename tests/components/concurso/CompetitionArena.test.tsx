import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { CompetitionArena } from '../../../components/concurso/CompetitionArena';
import { useCompetitionStore } from '../../../stores/competitionStore';
import {
    COMPETITION_ENGINE_VERSION,
    createCompetitionDailyRecord,
    createDefaultCompetitionRoster,
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
});

describe('CompetitionArena', () => {
    beforeEach(() => {
        useCompetitionStore.getState()._reset();
    });

    it('renders the leaderboard and opens rules and rival modals', async () => {
        const record = createArenaRecord();

        useCompetitionStore.getState()._hydrateFromFirestore({
            competition: {
                competitionStartedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
                engineVersion: COMPETITION_ENGINE_VERSION,
                roster: createDefaultCompetitionRoster(),
                dailyRecords: {
                    [record.date]: record,
                },
                lastSyncedDate: record.date,
            },
        });

        render(<CompetitionArena />);

        expect(screen.getByText('Quem leva a coroa no fim')).toBeInTheDocument();
        expect(screen.getByText('O golpe mais valioso agora')).toBeInTheDocument();
        expect(screen.getByText('Voce')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Como pontua/i }));

        await waitFor(() => {
            expect(screen.getByText('Manual da arena')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByLabelText('Fechar regras'));

        fireEvent.click(screen.getAllByRole('button', { name: /Aline Blindada/i })[0]);

        await waitFor(() => {
            expect(screen.getByText('Rival dossier')).toBeInTheDocument();
            expect(screen.getByText('Quase nao entrega ponto gratis e pressiona em todas as frentes.')).toBeInTheDocument();
        });
    });
});
