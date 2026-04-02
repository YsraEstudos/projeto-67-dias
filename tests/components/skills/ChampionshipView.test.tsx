import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../stores/firestoreSync', () => ({
    writeToFirestore: vi.fn(),
}));

import { ChampionshipView } from '../../../components/skills/ChampionshipView';
import { useCompetitionStore } from '../../../stores/competitionStore';
import { calculateAdaptiveCompetitionMetrics, COMPETITION_ENGINE_VERSION } from '../../../utils/competitionEngine';
import { getTodayISO } from '../../../utils/dateUtils';

describe('ChampionshipView', () => {
    beforeEach(() => {
        useCompetitionStore.getState()._reset();
    });

    it('shows reading gains when today record has reading XP', () => {
        const today = getTodayISO();
        const metrics = calculateAdaptiveCompetitionMetrics(45, 90);

        useCompetitionStore.getState()._hydrateFromFirestore({
            competition: {
                competitionStartedAt: Date.now(),
                engineVersion: COMPETITION_ENGINE_VERSION,
                dailyRecords: {
                    [today]: {
                        date: today,
                        projectDay: 1,
                        score: metrics.score,
                        activityScore: 45,
                        maxScore: 90,
                        theoreticalMaxScore: 1000,
                        completionRate: metrics.completionRate,
                        availabilityRate: metrics.availabilityRate,
                        difficultyMultiplier: metrics.difficultyMultiplier,
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
        expect(screen.getByText(`+${metrics.score} XP oficial`)).toBeInTheDocument();
        expect(screen.getByText('Leitura')).toBeInTheDocument();
        expect(screen.getByText('10 paginas hoje (50% da meta diaria).')).toBeInTheDocument();
        expect(screen.getByText(/45 XP bruto com 50% de aproveitamento/i)).toBeInTheDocument();
        expect(screen.getByText(/\+45 bruto/i)).toBeInTheDocument();
        expect(screen.getByText(/O campeonato sobe pelo desempenho do dia/i)).toBeInTheDocument();
    });
});
