import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { ChampionshipView } from '../../../components/skills/ChampionshipView';
import { useCompetitionStore } from '../../../stores/competitionStore';
import { COMPETITION_ENGINE_VERSION } from '../../../utils/competitionEngine';
import { getTodayISO } from '../../../utils/dateUtils';

describe('ChampionshipView', () => {
    beforeEach(() => {
        useCompetitionStore.getState()._reset();
    });

    it('shows reading gains when today record has reading XP', () => {
        const today = getTodayISO();

        useCompetitionStore.getState()._hydrateFromFirestore({
            competition: {
                competitionStartedAt: Date.now(),
                engineVersion: COMPETITION_ENGINE_VERSION,
                dailyRecords: {
                    [today]: {
                        date: today,
                        projectDay: 1,
                        score: 45,
                        maxScore: 90,
                        theoreticalMaxScore: 1000,
                        remainingScore: 45,
                        breakdown: [
                            {
                                id: 'leitura',
                                label: 'Leitura',
                                points: 45,
                                maxPoints: 90,
                                remainingPoints: 45,
                                summary: '10 paginas hoje (50% da meta diaria).',
                                priority: 45,
                            },
                        ],
                        updatedAt: Date.now(),
                    },
                },
                lastSyncedDate: today,
            },
        });

        render(<ChampionshipView />);

        expect(screen.getByText('Ganhos de Hoje')).toBeInTheDocument();
        expect(screen.getAllByText('+45 XP')[0]).toBeInTheDocument();
        expect(screen.getByText('Leitura')).toBeInTheDocument();
        expect(screen.getByText('10 paginas hoje (50% da meta diaria).')).toBeInTheDocument();
    });
});
